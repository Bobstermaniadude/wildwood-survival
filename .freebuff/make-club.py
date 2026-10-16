import math,struct,json
from pathlib import Path
rings=[(0,.036),(.08,.043),(.2,.041),(.32,.049),(.44,.078),(.58,.108),(.72,.13),(.84,.119),(.93,.087),(.97,.018)]
v=[];uv=[];idx=[];N=12
for j,(y,r) in enumerate(rings):
 for i in range(N):
  a=i/N*math.tau;rr=r*(1+.08*math.sin(i*2+j*.9));v.extend([math.cos(a)*rr+.018*y*y,y,math.sin(a)*rr*.85]);uv.extend([i/N,y*1.5])
for j in range(len(rings)-1):
 for i in range(N):
  a=j*N+i;b=j*N+(i+1)%N;c=a+N;d=b+N;idx.extend([a,c,b,b,c,d])
for i in range(1,N-1):idx.extend([0,i,i+1]);idx.extend([(len(rings)-1)*N,(len(rings)-1)*N+i+1,(len(rings)-1)*N+i])
n=[0.]*len(v)
for k in range(0,len(idx),3):
 a,b,c=[i*3 for i in idx[k:k+3]];u=[v[b+i]-v[a+i] for i in range(3)];w=[v[c+i]-v[a+i] for i in range(3)];q=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]]
 for t in [a,b,c]:
  for i in range(3):n[t+i]+=q[i]
for k in range(0,len(n),3):
 l=math.sqrt(sum(x*x for x in n[k:k+3])) or 1;n[k:k+3]=[x/l for x in n[k:k+3]]
data=bytearray();views=[]
def pack(b,target=None):
 while len(data)%4:data.append(0)
 d={'buffer':0,'byteOffset':len(data),'byteLength':len(b)}
 if target:d['target']=target
 views.append(d);data.extend(b);return len(views)-1
p=pack(struct.pack('<'+'f'*len(v),*v),34962);no=pack(struct.pack('<'+'f'*len(n),*n),34962);u=pack(struct.pack('<'+'f'*len(uv),*uv),34962);i=pack(struct.pack('<'+'H'*len(idx),*idx),34963);im=pack(Path('assets/textures/bark_brown_02.jpg').read_bytes())
d={'asset':{'version':'2.0','generator':'Wildwood authored carved club'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'CarvedWoodClub'}],'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'TEXCOORD_0':2},'indices':3,'material':0}]}],'materials':[{'name':'Weathered bark','pbrMetallicRoughness':{'baseColorTexture':{'index':0},'baseColorFactor':[.75,.65,.52,1],'metallicFactor':0,'roughnessFactor':.93}}],'textures':[{'source':0}],'images':[{'bufferView':im,'mimeType':'image/jpeg'}],'buffers':[{'byteLength':len(data)}],'bufferViews':views,'accessors':[{'bufferView':p,'componentType':5126,'count':len(v)//3,'type':'VEC3','min':[min(v[j::3]) for j in range(3)],'max':[max(v[j::3]) for j in range(3)]},{'bufferView':no,'componentType':5126,'count':len(v)//3,'type':'VEC3'},{'bufferView':u,'componentType':5126,'count':len(uv)//2,'type':'VEC2'},{'bufferView':i,'componentType':5123,'count':len(idx),'type':'SCALAR'}]}
j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4);data+=b'\0'*((-len(data))%4)
Path('assets/models/club.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(data))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(data),0x004e4942)+data)
