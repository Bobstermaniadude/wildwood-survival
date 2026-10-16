package com.tompearl.client;

import com.tompearl.TomPearlMod;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.packs.resources.Resource;
import org.joml.Matrix4f;
import org.joml.Quaternionf;
import org.joml.Vector3f;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads the baked Tom Pearl mesh (see tools/gltf_bake.py) and evaluates its
 * skinned pose. Format: "TOMPEA1\0" + counts + vertices + indices + bones + clips.
 *
 * This class is API-independent of the 26.2 render pipeline — it only produces
 * skinned positions/normals that the feature renderer uploads.
 */
public final class TomPearlModelData {

    public static final ResourceLocation MODEL_PATH = TomPearlMod.id("models/tom_pearl.bin");

    // mesh
    public final int vertCount;
    public final int indexCount;
    public final int[] indices;
    public final float[] pos;        // 3 per vertex
    public final float[] normal;     // 3 per vertex
    public final float[] uv;         // 2 per vertex
    public final int[] joints;       // 4 per vertex
    public final float[] weights;    // 4 per vertex

    // rig
    public final int boneCount;
    public final int[] boneParent;
    public final Matrix4f[] inverseBind;
    public final float[] restPos;    // 3 per bone
    public final Quaternionf[] restRot;
    public final Map<String, Integer> boneByName;

    // clips
    public final int clipCount;
    public final String[] clipNames;
    public final float[] clipDurations;
    /** clip -> bone -> keyframe times */
    public final float[][][] keyTimes;
    /** clip -> bone -> keyframe quats (4 per key, xyzw) */
    public final float[][][] keyRots;

    // scratch (single-threaded render use)
    private final Matrix4f[] boneMatrices;
    private final Matrix4f[] localMats;
    private final float[] skinnedPos;
    private final float[] skinnedNormal;

    private TomPearlModelData(ByteBuffer buf) {
        buf.position(8);
        vertCount = buf.getInt();
        indexCount = buf.getInt();
        boneCount = buf.getInt();
        clipCount = buf.getInt();
        buf.getFloat(); // targetHeight
        buf.getFloat(); // hover bob

        pos = new float[vertCount * 3];
        normal = new float[vertCount * 3];
        uv = new float[vertCount * 2];
        joints = new int[vertCount * 4];
        weights = new float[vertCount * 4];
        for (int i = 0; i < vertCount; i++) {
            pos[i * 3] = buf.getFloat(); pos[i * 3 + 1] = buf.getFloat(); pos[i * 3 + 2] = buf.getFloat();
            normal[i * 3] = buf.getFloat(); normal[i * 3 + 1] = buf.getFloat(); normal[i * 3 + 2] = buf.getFloat();
            uv[i * 2] = buf.getFloat(); uv[i * 2 + 1] = buf.getFloat();
            for (int k = 0; k < 4; k++) joints[i * 4 + k] = buf.get() & 0xFF;
            for (int k = 0; k < 4; k++) weights[i * 4 + k] = (buf.get() & 0xFF) / 255f;
        }

        indices = new int[indexCount];
        for (int i = 0; i < indexCount; i++) indices[i] = buf.getInt();

        boneParent = new int[boneCount];
        inverseBind = new Matrix4f[boneCount];
        restPos = new float[boneCount * 3];
        restRot = new Quaternionf[boneCount];
        boneByName = new HashMap<>();
        for (int b = 0; b < boneCount; b++) {
            int nameLen = buf.get() & 0xFF;
            byte[] nameBytes = new byte[nameLen];
            buf.get(nameBytes);
            String name = new String(nameBytes, java.nio.charset.StandardCharsets.UTF_8);
            boneByName.put(name, b);
            boneParent[b] = buf.getInt();
            float[] m = new float[16];
            for (int i = 0; i < 16; i++) m[i] = buf.getFloat();
            inverseBind[b] = new Matrix4f().set(m);
            restPos[b * 3] = buf.getFloat(); restPos[b * 3 + 1] = buf.getFloat(); restPos[b * 3 + 2] = buf.getFloat();
            float qx = buf.getFloat(), qy = buf.getFloat(), qz = buf.getFloat(), qw = buf.getFloat();
            restRot[b] = new Quaternionf(qx, qy, qz, qw);
        }

        clipNames = new String[clipCount];
        clipDurations = new float[clipCount];
        keyTimes = new float[clipCount][][];
        keyRots = new float[clipCount][][];
        for (int c = 0; c < clipCount; c++) {
            int nameLen = buf.get() & 0xFF;
            byte[] nameBytes = new byte[nameLen];
            buf.get(nameBytes);
            clipNames[c] = new String(nameBytes, java.nio.charset.StandardCharsets.UTF_8);
            clipDurations[c] = buf.getFloat();
            keyTimes[c] = new float[boneCount][];
            keyRots[c] = new float[boneCount][];
            int trackCount = buf.getInt();
            for (int t = 0; t < trackCount; t++) {
                int bone = buf.getInt();
                int keys = buf.getInt();
                float[] times = new float[keys];
                float[] rots = new float[keys * 4];
                for (int k = 0; k < keys; k++) {
                    times[k] = buf.getFloat();
                    rots[k * 4] = buf.getFloat(); rots[k * 4 + 1] = buf.getFloat();
                    rots[k * 4 + 2] = buf.getFloat(); rots[k * 4 + 3] = buf.getFloat();
                }
                keyTimes[c][bone] = times;
                keyRots[c][bone] = rots;
            }
        }

        boneMatrices = new Matrix4f[boneCount];
        localMats = new Matrix4f[boneCount];
        for (int b = 0; b < boneCount; b++) {
            boneMatrices[b] = new Matrix4f();
            localMats[b] = new Matrix4f();
        }
        skinnedPos = new float[vertCount * 3];
        skinnedNormal = new float[vertCount * 3];
    }

    public static TomPearlModelData load(net.minecraft.client.renderer.texture.TextureManager ignored) {
        try {
            Resource resource = net.minecraft.client.Minecraft.getInstance()
                    .getResourceManager().getResourceOrThrow(MODEL_PATH);
            try (InputStream in = resource.open()) {
                byte[] bytes = in.readAllBytes();
                ByteBuffer buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
                byte[] magic = new byte[8];
                buf.get(magic);
                if (!new String(magic, 0, 7, java.nio.charset.StandardCharsets.US_ASCII).equals("TOMPEA1")) {
                    throw new IOException("bad tom_pearl.bin magic");
                }
                return new TomPearlModelData(buf);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not load " + MODEL_PATH, e);
        }
    }

    public int clipIndex(String name) {
        for (int i = 0; i < clipCount; i++) if (clipNames[i].equals(name)) return i;
        return 0;
    }

    /**
     * Evaluates the pose at the given clip/time and skins the mesh.
     * Returns positions in model space; normals are normalized post-skin.
     */
    public float[] skin(int clip, float timeSeconds) {
        float dur = Math.max(0.001f, clipDurations[clip]);
        float t = timeSeconds % dur;

        // local bone transforms
        for (int b = 0; b < boneCount; b++) {
            Quaternionf rot = restRot[b];
            float[] times = keyTimes[clip][b];
            if (times != null && times.length > 0) {
                float[] rots = keyRots[clip][b];
                int i = 0;
                while (i < times.length - 1 && times[i + 1] < t) i++;
                if (i >= times.length - 1) {
                    rot = new Quaternionf(rots[(times.length - 1) * 4], rots[(times.length - 1) * 4 + 1],
                            rots[(times.length - 1) * 4 + 2], rots[(times.length - 1) * 4 + 3]);
                } else {
                    float span = times[i + 1] - times[i];
                    float f = span > 1e-6f ? (t - times[i]) / span : 0f;
                    Quaternionf a = new Quaternionf(rots[i * 4], rots[i * 4 + 1], rots[i * 4 + 2], rots[i * 4 + 3]);
                    Quaternionf b2 = new Quaternionf(rots[(i + 1) * 4], rots[(i + 1) * 4 + 1], rots[(i + 1) * 4 + 2], rots[(i + 1) * 4 + 3]);
                    rot = a.slerp(b2, f, new Quaternionf());
                }
            }
            localMats[b].translationRotateScale(
                    restPos[b * 3], restPos[b * 3 + 1], restPos[b * 3 + 2],
                    rot.x(), rot.y(), rot.z(), rot.w(), 1f, 1f, 1f);
        }

        // global = parent * local; skin matrix = global * inverseBind
        for (int b = 0; b < boneCount; b++) {
            int p = boneParent[b];
            if (p < 0) {
                boneMatrices[b].set(localMats[b]);
            } else {
                boneMatrices[b].set(boneMatrices[p]).mul(localMats[b]);
            }
            boneMatrices[b].mul(inverseBind[b]);
        }

        // skin vertices (4 influences)
        Vector3f tmp = new Vector3f();
        Vector3f acc = new Vector3f();
        Vector3f nrm = new Vector3f();
        Vector3f nacc = new Vector3f();
        for (int v = 0; v < vertCount; v++) {
            acc.set(0, 0, 0);
            nacc.set(0, 0, 0);
            for (int k = 0; k < 4; k++) {
                float w = weights[v * 4 + k];
                if (w <= 0f) continue;
                int b = joints[v * 4 + k];
                if (b >= boneCount) continue;
                tmp.set(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]).mulPosition(boneMatrices[b]);
                acc.fma(w, tmp);
                tmp.set(normal[v * 3], normal[v * 3 + 1], normal[v * 3 + 2]).mulDirection(boneMatrices[b]);
                nacc.fma(w, tmp);
            }
            skinnedPos[v * 3] = acc.x(); skinnedPos[v * 3 + 1] = acc.y(); skinnedPos[v * 3 + 2] = acc.z();
            nrm.set(nacc).normalize();
            skinnedNormal[v * 3] = nrm.x(); skinnedNormal[v * 3 + 1] = nrm.y(); skinnedNormal[v * 3 + 2] = nrm.z();
        }
        return skinnedPos;
    }

    public float[] getSkinnedNormal() {
        return skinnedNormal;
    }
}
