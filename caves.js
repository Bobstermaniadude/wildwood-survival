// Shared topology for rendering, player/AI collision and streaming. No portal teleportation.
export function createCaveTopology(g) {
  const {THREE,CFG,world,naturalHeight,hash2,findSpawn,clamp,mulberry32}=g;
  const cache=new Map();let key='',starter=null;
  const floor=(c,x,z)=>c.y-Math.sin(Math.min(1,Math.hypot(x-c.x,z-c.z)/(c.r+1))*Math.PI)*.9;
  function complete(c){c.entranceX=c.x;c.entranceZ=c.z-c.r-32;c.entranceY=naturalHeight(c.entranceX,c.entranceZ);c.endZ=c.z-c.r+2;c.exit={x:c.x,y:c.y,z:c.endZ};c.id=c.i+','+c.j;c.breached=true;c.connected=true;return c;}
  function reset(){const k=CFG.seed+':'+CFG.terrainVersion;if(k===key)return;key=k;cache.clear();starter=null;
    const p=findSpawn();let best=null,score=Infinity;
    for(let r=42;r<=102;r+=12)for(let a=0;a<16;a++){
      const angle=a*Math.PI/8,x=p.x+Math.cos(angle)*r,z=p.z+Math.sin(angle)*r+42;
      const c=complete({i:-900000,j:0,x,z,y:naturalHeight(x,z)-14,r:11});
      let valid=c.entranceY>CFG.waterLevel+1.1,rough=0;
      for(let t=0;t<=1;t+=.1){const zz=c.entranceZ+(c.endZ-c.entranceZ)*t;const h=naturalHeight(x,zz);if(h<CFG.waterLevel+1)valid=false;rough=Math.max(rough,Math.abs(naturalHeight(x+3,zz)-naturalHeight(x-3,zz)));}
      const d=Math.hypot(c.entranceX-p.x,c.entranceZ-p.z);if(valid&&d<score&&rough<2.5){best=c;score=d;}
    }
    // All normal seeds have dry land around the spawn; do not generate a flooded fallback.
    if(!best){ // Rare all-water candidate rings: search farther without choosing a flooded entrance.
      for(let r=114;r<=198&&!best;r+=12)for(let a=0;a<32&&!best;a++){const x=p.x+Math.cos(a*Math.PI/16)*r,z=p.z+Math.sin(a*Math.PI/16)*r+42,c=complete({i:-900000,j:0,x,z,y:naturalHeight(x,z)-14,r:11});if(c.entranceY>CFG.waterLevel+1.2&&naturalHeight(x,z)>CFG.waterLevel+1.2&&Math.abs(naturalHeight(x-3,c.entranceZ)-naturalHeight(x+3,c.entranceZ))<2.5)best=c;}
    }
    starter=best; if(best)cache.set(best.id,best);
  }
  function site(i,j){reset();const id=i+','+j;if(cache.has(id))return cache.get(id);if(i===-900000)return starter;
    const rng=mulberry32((i*374761393)^(j*668265263)^(CFG.seed^0xCAFE));
    const x=i*150+30+rng()*90,z=j*150+30+rng()*90,surf=naturalHeight(x,z);
    let c=complete({i,j,x,z,y:surf-(11+rng()*6),r:9+rng()*5});
    if(surf<CFG.waterLevel+1.5||c.entranceY<CFG.waterLevel+1.2||Math.abs(naturalHeight(x-3,c.entranceZ)-naturalHeight(x+3,c.entranceZ))>2||starter&&Math.hypot(x-starter.x,z-starter.z)<90)c=null;
    cache.set(id,c);return c;
  }
  function nearby(x,z,r=75){reset();const out=[];if(starter&&Math.hypot(x-starter.x,z-starter.z)<r+60)out.push(starter);
    for(let i=Math.floor((x-r-50)/150);i<=Math.floor((x+r+50)/150);i++)for(let j=Math.floor((z-r-50)/150);j<=Math.floor((z+r+50)/150);j++){const c=site(i,j);if(c&&Math.hypot(x-c.x,z-c.z)<r+60)out.push(c);}return out;
  }
  function ramp(c,x,z){if(Math.abs(x-c.x)>3||z<c.entranceZ||z>c.endZ)return null;const t=(z-c.entranceZ)/(c.endZ-c.entranceZ);return c.entranceY+(floor(c,c.x,c.endZ)-c.entranceY)*t;}
  function surface(x,z,h){for(const c of nearby(x,z,8)){const y=ramp(c,x,z);if(y!==null)return Math.min(h,y);}return h;}
  function reserved(x,z,pad=0){return nearby(x,z,15).some(c=>Math.hypot(x-c.x,z-c.z)<c.r+2+pad||Math.abs(x-c.x)<5+pad&&z>c.entranceZ-5-pad&&z<c.endZ+pad);}
  function maskTerrain(geo,ox,oz){const p=geo.attributes.position,indices=geo.index.array,out=[],sites=nearby(ox+8,oz+8,25);
    for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],d=indices[i+2],x=ox+(p.getX(a)+p.getX(b)+p.getX(d))/3,z=oz+(p.getZ(a)+p.getZ(b)+p.getZ(d))/3;
      const hole=sites.some(c=>{const y=ramp(c,x,z);return y!==null&&(naturalHeight(x,z)-y>3.3||Math.abs(ox+p.getX(a)-c.x)<3.2&&Math.abs(ox+p.getX(b)-c.x)<3.2&&Math.abs(ox+p.getX(d)-c.x)<3.2);});if(!hole)out.push(a,b,d);
    }geo.setIndex(out);
  }
  function ground(x,z,ref){for(const c of world.caves){const y=ramp(c,x,z);if(y!==null)return y;const d=Math.hypot(x-c.x,z-c.z);if(d<c.r+1&&ref<c.y+5)return floor(c,x,z);}return null;}
  function inside(pos){return world.caves.find(c=>pos.y<naturalHeight(pos.x,pos.z)-2.8&&(Math.hypot(pos.x-c.x,pos.z-c.z)<c.r+1||ramp(c,pos.x,pos.z)!==null));}
  function collide(pos,radius){for(const c of world.caves){if(pos.y>c.y+5&&ramp(c,pos.x,pos.z)===null)continue;
    const dz=pos.z-c.z,dx=pos.x-c.x,d=Math.hypot(dx,dz),inPassage=pos.z>=c.entranceZ&&pos.z<=c.endZ&&Math.abs(dx)<3.8;
    if(inPassage){pos.x=clamp(pos.x,c.x-3+radius,c.x+3-radius);continue;}
    if(pos.y<c.y+5&&d<c.r+3&&d>c.r-.45-radius){const r=c.r-.45-radius;pos.x=c.x+dx/d*r;pos.z=c.z+dz/d*r;}
  }}
  function build(c,group,material){
    const rock=new THREE.MeshStandardMaterial({map:g.TEX.rock,color:0x827b70,roughness:1,side:THREE.DoubleSide});
    const add=(geo,x,y,z,mat=rock)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.receiveShadow=m.castShadow=true;group.add(m);return m;};
    // The chamber wall has a real six-metre-wide opening facing the ramp.
    const opening=Math.asin(3/(c.r+1));const wall=add(new THREE.CylinderGeometry(c.r+1,c.r+1,5.3,48,1,true,Math.PI+opening,Math.PI*2-opening*2),c.x,c.y+2.4,c.z);wall.material=rock;
    const dome=add(new THREE.SphereGeometry(c.r+1,40,16,0,Math.PI*2,0,Math.PI/2),c.x,c.y+4.6,c.z);dome.scale.y=.38;c.dome=dome;
    // A continuous ramp floor, bank walls and overhead rock only after sufficient cover.
    const length=c.endZ-c.entranceZ,segments=48;
    const positions=[],idx=[];
    for(let k=0;k<=segments;k++){const z=c.entranceZ+length*k/segments,y=ramp(c,c.x,z);positions.push(c.x-3,y,z,c.x+3,y,z);if(k<segments){const n=k*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(idx);geo.computeVertexNormals();
    const rampMat=material.clone();rampMat.polygonOffset=true;rampMat.polygonOffsetFactor=1;rampMat.polygonOffsetUnits=2;add(geo,0,0,0,rampMat);
    const passageParts=[];
    for(let k=0;k<segments;k++){const z=c.entranceZ+length*(k+.5)/segments,y=ramp(c,c.x,z),top=naturalHeight(c.x,z),height=Math.max(3.2,top-y);
      for(const side of [-1,1]){const w=add(new THREE.BoxGeometry(.9,height,length/segments+.12),c.x+side*3.45,y+height/2,z);w.rotation.z=side*.035;passageParts.push(w);}
      if(top-y>3.2){const roof=add(new THREE.BoxGeometry(6.9,.7,length/segments+.15),c.x,y+3.7,z);roof.rotation.x=Math.atan((floor(c,c.x,c.endZ)-c.entranceY)/length);passageParts.push(roof);}
    }
    if(g.mergeGeometries&&passageParts.length){const pieces=passageParts.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix);});const merged=g.mergeGeometries(pieces,false);for(const geo of pieces)geo.dispose();if(merged){for(const m of passageParts){m.removeFromParent();m.geometry.dispose();}add(merged,0,0,0);}}
    const portal=new THREE.Group();portal.position.set(c.entranceX,c.entranceY,c.entranceZ+2.5);group.add(portal);c.portal=portal;
    for(const side of [-1,1]){const m=add(new THREE.IcosahedronGeometry(2,1),c.x+side*4.1,c.entranceY+1.3,c.entranceZ+3);m.scale.set(.8,1.25,1.5);}
    const lintel=add(new THREE.IcosahedronGeometry(2,1),c.x,c.entranceY+3.6,c.entranceZ+5);lintel.scale.set(2.15,.42,.72);
    const cv=document.createElement('canvas');cv.width=512;cv.height=160;const ctx=cv.getContext('2d');ctx.fillStyle='#33302b';ctx.fillRect(0,0,512,160);ctx.fillStyle='#e8d9ac';ctx.font='bold 44px monospace';ctx.fillText('SURVEY RIDGE',35,62);ctx.font='25px monospace';ctx.fillText('ORE BELOW · BRING LIGHT',30,117);
    const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;const signMat=new THREE.MeshStandardMaterial({map,roughness:.9,emissive:0xbda97a,emissiveIntensity:.12,side:THREE.DoubleSide});const sign=add(new THREE.PlaneGeometry(2,.63),c.x-4,c.entranceY+2.8,c.entranceZ-1,signMat);sign.rotation.y=Math.PI;
    for(let k=0;k<5;k++){const a=.5+k*1.15,x=c.x+Math.cos(a)*(c.r-2),z=c.z+Math.sin(a)*(c.r-2),y=floor(c,x,z);const m=add(new THREE.ConeGeometry(.6,.8+k*.22,7),x,y+.4+k*.11,z);c.colliders.push({x,z,r:.65,minY:y,maxY:y+1.9});}
    const survey=new THREE.Mesh(new THREE.BoxGeometry(.6,.06,.8),g.MAT.trunk);survey.position.set(c.x+1.8,c.y-.3,c.endZ+1);group.add(survey);
    const dustGeo=new THREE.BufferGeometry(),dust=[];for(let k=0;k<28;k++)dust.push(c.x+(hash2(k,c.i,CFG.seed)-.5)*c.r*1.3,c.y+1+hash2(k,c.j,CFG.seed+1)*3,c.z+(hash2(k,1,CFG.seed)-.5)*c.r*1.3);dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dust,3));const particles=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xb8b4a2,size:.035,transparent:true,opacity:.18,depthWrite:false}));group.add(particles);
  }
  return {site,nearby,ramp,floor,surface,reserved,maskTerrain,ground,inside,collide,build,reset,get starter(){reset();return starter;}};
}
