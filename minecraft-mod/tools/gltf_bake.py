# -*- coding: utf-8 -*-
"""
gltf_bake.py — bakes model-rigged.glb into the Tom Pearl mod's runtime format.

Outputs (into src/main/resources/assets/tompearl/):
  models/tom_pearl.bin      — skinned mesh + bone hierarchy + animation clips
  textures/entity/tom_pearl.png — base color texture

Binary format (little-endian):
  magic "TOMPEA1\0" (8 bytes)
  u32 vertCount, indexCount, boneCount, clipCount
  f32 targetHeight, f32 hoverBob (reserved)
  vertices:  vertCount  x [3f pos, 3f normal, 2f uv, 4B joints, 4B weights(u8/255)]
  indices:   indexCount x u32
  bones:     boneCount  x [u8 nameLen, name utf-8, i32 parent(-1 root),
                           16f inverseBind row-major, 3f restPos, 4f restRot(x,y,z,w)]
  clips:     clipCount  x [u8 nameLen, name, f32 duration, u32 trackCount,
                           tracks: i32 boneIndex, u32 keyCount,
                                   keys: f32 time, 4f rot(x,y,z,w)]

Usage:  python tools/gltf_bake.py   (run from the minecraft-mod folder)
"""
import struct, json, math, io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GLB_PATH = os.path.join(ROOT, '..', 'model-rigged.glb')
ASSETS = os.path.join(ROOT, 'src', 'main', 'resources', 'assets', 'tompearl')
TARGET_HEIGHT = 2.6   # Minecraft units (blocks) for the floating upper body

# ---------------------------------------------------------------- GLB parsing
def read_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, ver, _ = struct.unpack('<4sII', data[:12])
    assert magic == b'glTF', 'not a GLB file'
    off = 12
    js, bin_data = None, b''
    while off < len(data):
        clen, ctype = struct.unpack('<II', data[off:off + 8])
        chunk = data[off + 8:off + 8 + clen]
        if ctype == 0x4E4F534A:
            js = json.loads(chunk.decode('utf-8'))
        elif ctype == 0x004E4942:
            bin_data = chunk
        off += 8 + clen
    return js, bin_data

def acc(js, bin_data, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = a['count']
    t = a['type']
    comp = a['componentType']
    fmt = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}[comp]
    sz = {'b': 1, 'B': 1, 'h': 2, 'H': 2, 'I': 4, 'f': 4}[fmt]
    k = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[t]
    stride = bv.get('byteStride')
    out = []
    if stride and stride != k * sz:
        for i2 in range(n):
            o = off + i2 * stride
            out.append(list(struct.unpack_from('<' + fmt * k, bin_data, o)))
    else:
        flat = struct.unpack_from('<' + fmt * k * n, bin_data, off)
        out = [list(flat[i * k:(i + 1) * k]) for i in range(n)]
    return out

# ---------------------------------------------------------------- quaternion math
def q_mul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return [aw*bx + ax*bw + ay*bz - az*by,
            aw*by - ax*bz + ay*bw + az*bx,
            aw*bz + ax*by - ay*bx + az*bw,
            aw*bw - ax*bx - ay*by - az*bz]

def q_axis(axis, angle):
    x, y, z = axis
    l = math.sqrt(x*x + y*y + z*z) or 1.0
    s = math.sin(angle / 2) / l
    return [x*s, y*s, z*s, math.cos(angle / 2)]

def q_norm(q):
    l = math.sqrt(sum(c*c for c in q)) or 1.0
    return [c / l for c in q]

def q_slerp(a, b, t):
    d = sum(x*y for x, y in zip(a, b))
    if d < 0:
        b = [-c for c in b]; d = -d
    if d > 0.9995:
        return q_norm([x + (y - x) * t for x, y in zip(a, b)])
    th = math.acos(max(-1.0, min(1.0, d)))
    s = math.sin(th)
    wa = math.sin((1 - t) * th) / s
    wb = math.sin(t * th) / s
    return q_norm([x*wa + y*wb for x, y in zip(a, b)])

# ---------------------------------------------------------------- load
js, bin_data = read_glb(os.path.normpath(GLB_PATH))
mesh = js['meshes'][0]['primitives'][0]
pos   = acc(js, bin_data, mesh['attributes']['POSITION'])
nrm   = acc(js, bin_data, mesh['attributes']['NORMAL'])
uv    = acc(js, bin_data, mesh['attributes']['TEXCOORD_0'])
joints = acc(js, bin_data, mesh['attributes']['JOINTS_0'])
weights = acc(js, bin_data, mesh['attributes']['WEIGHTS_0'])
indices = [v[0] for v in acc(js, bin_data, mesh['indices'])]

skin = js['skins'][0]
joints_nodes = skin['joints']
ibm = acc(js, bin_data, skin['inverseBindMatrices'])  # MAT4 floats per joint

nodes = js['nodes']
parent_of = {}
for ni, n in enumerate(nodes):
    for c in n.get('children', []):
        parent_of[c] = ni

bone_index_of_node = {node: bi for bi, node in enumerate(joints_nodes)}
bones = []
for bi, node in enumerate(joints_nodes):
    n = nodes[node]
    pnode = parent_of.get(node, -1)
    parent = bone_index_of_node.get(pnode, -1)
    t = n.get('translation', [0, 0, 0])
    r = n.get('rotation', [0, 0, 0, 1])
    name = n.get('name') or ('bone_%d' % bi)
    bones.append({'name': name, 'parent': parent, 'restPos': list(t), 'restRot': list(r)})

# --------------------------------------------------- rescale to Minecraft units
ys = [p[1] for p in pos]
min_y, max_y = min(ys), max(ys)
height = max(1e-6, max_y - min_y)
s = TARGET_HEIGHT / height
verts = []
for i in range(len(pos)):
    verts.append([
        pos[i][0] * s, (pos[i][1] - min_y) * s, pos[i][2] * s,
        nrm[i][0], nrm[i][1], nrm[i][2],
        uv[i][0], uv[i][1],
        joints[i][0], joints[i][1], joints[i][2], joints[i][3],
        weights[i][0], weights[i][1], weights[i][2], weights[i][3],
    ])
for b in bones:
    b['restPos'] = [b['restPos'][0] * s, b['restPos'][1] * s, b['restPos'][2] * s]
ibm_scaled = []
for m in ibm:
    m = list(m)
    m[12] *= s; m[13] *= s; m[14] *= s  # translation column (column-major in glTF)
    ibm_scaled.append(m)

# --------------------------------------------------------------- animation clip
anim = js['animations'][0]
times = [v[0] for v in acc(js, bin_data, anim['samplers'][0]['input'])]
duration = times[-1] if times else 1.0
tracks = {}   # boneIndex -> list[(time, quat)]
for ch, samp in zip(anim['channels'], anim['samplers']):
    tgt = ch['target']['node']
    if ch['target']['path'] != 'rotation':
        continue
    bi = bone_index_of_node.get(tgt)
    if bi is None:
        continue
    keys = acc(js, bin_data, samp['output'])
    ts = acc(js, bin_data, samp['input'])
    tracks[bi] = [(ts[i][0], [k[0], k[1], k[2], k[3]]) for i, k in enumerate(keys)]

clips = [{'name': 'walk', 'duration': duration,
          'tracks': {bi: list(k) for bi, k in tracks.items()}}]

# -------------------------------------------- synthesized clips on the same rig
def bone_by_name(name):
    for i, b in enumerate(bones):
        if b['name'] == name:
            return i
    return -1

L_SH, R_SH = bone_by_name('L_Shoulder'), bone_by_name('R_Shoulder')
L_EL, R_EL = bone_by_name('L_Elbow'), bone_by_name('R_Elbow')
SPINE, HEAD = bone_by_name('Spine3'), bone_by_name('Head')

def synth(name, dur, poses, loop=False):
    """poses: list of (t, {bone: quatOffset}) — composed over each bone's restRot."""
    st = {}
    for t, offs in poses:
        for bi, off in offs.items():
            if bi < 0:
                continue
            q = q_mul(bones[bi]['restRot'], off)
            st.setdefault(bi, []).append((t, q))
    clips.append({'name': name, 'duration': dur, 'tracks': st})

X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)

# run: the walk cycle sped up with a harder arm pump
run_tracks = {bi: [(t / 1.55, q) for t, q in k] for bi, k in tracks.items()}
clips.append({'name': 'run', 'duration': duration / 1.55, 'tracks': run_tracks})

# idle: slow breathing sway
synth('idle', 3.0, [
    (0.0, {SPINE: q_axis(X, 0.03), HEAD: q_axis(X, -0.02)}),
    (1.5, {SPINE: q_axis(X, -0.03), HEAD: q_axis(X, 0.03)}),
    (3.0, {SPINE: q_axis(X, 0.03), HEAD: q_axis(X, -0.02)}),
], loop=True)

# attack_slam: both arms rise, then smash down
synth('attack_slam', 1.1, [
    (0.00, {}),
    (0.35, {L_SH: q_axis(X, -2.1), R_SH: q_axis(X, -2.1),
            L_EL: q_axis(X, -0.5), R_EL: q_axis(X, -0.5), SPINE: q_axis(X, -0.25)}),
    (0.55, {L_SH: q_axis(X, -2.3), R_SH: q_axis(X, -2.3), SPINE: q_axis(X, -0.3)}),
    (0.72, {L_SH: q_axis(X, 0.9), R_SH: q_axis(X, 0.9),
            L_EL: q_axis(X, 0.4), R_EL: q_axis(X, 0.4), SPINE: q_axis(X, 0.35), HEAD: q_axis(X, 0.2)}),
    (1.10, {}),
])

# attack_swipe_l: left arm rakes across
synth('attack_swipe_l', 0.9, [
    (0.00, {}),
    (0.30, {L_SH: q_axis(Y, 0.9), L_EL: q_axis(X, -0.7), SPINE: q_axis(Y, -0.25)}),
    (0.52, {L_SH: q_axis(Y, -1.15), L_EL: q_axis(X, 0.35), SPINE: q_axis(Y, 0.35), HEAD: q_axis(Y, 0.2)}),
    (0.90, {}),
])

# attack_swipe_r: right arm rakes across
synth('attack_swipe_r', 0.9, [
    (0.00, {}),
    (0.30, {R_SH: q_axis(Y, -0.9), R_EL: q_axis(X, -0.7), SPINE: q_axis(Y, 0.25)}),
    (0.52, {R_SH: q_axis(Y, 1.15), R_EL: q_axis(X, 0.35), SPINE: q_axis(Y, -0.35), HEAD: q_axis(Y, -0.2)}),
    (0.90, {}),
])

# stun: reel back and slump
synth('stun', 1.4, [
    (0.00, {}),
    (0.25, {SPINE: q_axis(X, -0.5), HEAD: q_axis(X, -0.45),
            L_SH: q_axis(Z, 0.5), R_SH: q_axis(Z, -0.5)}),
    (1.40, {}),
])

# ------------------------------------------------------------------ write .bin
def name_bytes(s):
    b = s.encode('utf-8')
    return struct.pack('<B', len(b)) + b

out = bytearray()
out += b'TOMPEA1\0'
out += struct.pack('<IIII', len(verts), len(indices), len(bones), len(clips))
out += struct.pack('<ff', TARGET_HEIGHT, 0.45)
for v in verts:
    out += struct.pack('<8f4B4B', *v[:8],
                       int(max(0, min(255, v[8]))), int(max(0, min(255, v[9]))),
                       int(max(0, min(255, v[10]))), int(max(0, min(255, v[11]))),
                       int(v[12] * 255), int(v[13] * 255), int(v[14] * 255), int(v[15] * 255))
for i in indices:
    out += struct.pack('<I', i)
for bi, b in enumerate(bones):
    out += name_bytes(b['name'])
    out += struct.pack('<i', b['parent'])
    out += struct.pack('<16f', *ibm_scaled[bi])
    out += struct.pack('<3f', *b['restPos'])
    out += struct.pack('<4f', *b['restRot'])
for c in clips:
    out += name_bytes(c['name'])
    out += struct.pack('<f', c['duration'])
    out += struct.pack('<I', len(c['tracks']))
    for bi, keys in sorted(c['tracks'].items()):
        out += struct.pack('<iI', bi, len(keys))
        for t, q in keys:
            out += struct.pack('<f4f', t, q[0], q[1], q[2], q[3])

os.makedirs(os.path.join(ASSETS, 'models'), exist_ok=True)
os.makedirs(os.path.join(ASSETS, 'textures', 'entity'), exist_ok=True)
bin_path = os.path.join(ASSETS, 'models', 'tom_pearl.bin')
with open(bin_path, 'wb') as f:
    f.write(out)

# ------------------------------------------------------------ extract texture
from PIL import Image
tex_i = None
for i, im in enumerate(js['images']):
    if 'baseColor' in json.dumps(js['materials'][0].get('pbrMetallicRoughness', {}).get('baseColorTexture', {})) :
        pass
# material 0: baseColorTexture index -> texture -> source
bc = js['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
tex_i = js['textures'][bc]['source']
bv = js['bufferViews'][js['images'][tex_i]['bufferView']]
img_bytes = bin_data[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
img.save(os.path.join(ASSETS, 'textures', 'entity', 'tom_pearl.png'))

print('baked %d verts, %d indices, %d bones, %d clips' % (len(verts), len(indices), len(bones), len(clips)))
print('clips:', [c['name'] for c in clips])
print('wrote', bin_path, '(%d bytes)' % len(out))
print('wrote texture tom_pearl.png (%dx%d)' % img.size)
