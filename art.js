import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const FILES = {
  survivor:'survivor',husk:'husk',hideLoot:'hide-loot',fiberLoot:'fiber-loot',bow:'bow',meatLoot:'meat-loot',pearlCore:'pearl-core',
  axe:'kenney/tool-axe',stoneAxe:'kenney/tool-axe-upgraded',pick:'kenney/tool-pickaxe',shovel:'kenney/tool-shovel',
  sword:'stone-sword',iron:'iron-blade',gold:'gold-blade',knife:'knife',torch:'torch',club:'club',
  deer:'deer',pig:'pig',pine:'pine',tree:'kenney/tree',treeTall:'kenney/tree-tall',log:'kenney/tree-log',
  rock:'kenney/rock-a',rockB:'kenney/rock-b',chest:'kenney/chest',workbench:'kenney/workbench',campfire:'kenney/campfire-pit',
  bedroll:'kenney/bedroll',barrel:'kenney/barrel',woodPickup:'kenney/resource-wood',stonePickup:'kenney/resource-stone',
};
export function createArtLibrary() {
  const cache=new Map(), sharedGeometry=new Set(), sharedMaterials=new Set(), failures=[];
  const loader=new GLTFLoader();
  // Subtle, neutral hide grain, not a photorealistic animal pasted into a stylized forest.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(64,64);
  for(let i=0;i<4096;i++){const n=224+((i*37^(i>>>3)*17)%24);pixels.data.set([n,n,n,255],i*4);}
  ctx.putImageData(pixels,0,0);const hide=new THREE.CanvasTexture(canvas);hide.colorSpace=THREE.SRGBColorSpace;hide.wrapS=hide.wrapT=THREE.RepeatWrapping;hide.repeat.set(3,3);
  const palettes=new WeakMap();
  function weatheredPalette(texture){
    if(palettes.has(texture))return palettes.get(texture);
    const c=document.createElement('canvas');c.width=texture.image.width;c.height=texture.image.height;
    const cx=c.getContext('2d');cx.drawImage(texture.image,0,0);const image=cx.getImageData(0,0,c.width,c.height);
    for(let i=0;i<image.data.length;i+=4){const r=image.data[i]/255,g=image.data[i+1]/255,b=image.data[i+2]/255;const lum=r*.2126+g*.7152+b*.0722;
      const color=g>r*1.12&&g>b*1.02?[lum*.72,lum*.88,lum*.54]:b>r*1.04&&b>g*.96?[lum*.87,lum*.89,lum*.84]:[r*.79+lum*.07,g*.84+lum*.07,b*.86+lum*.07];
      for(let j=0;j<3;j++)image.data[i+j]=Math.min(255,color[j]*255);
    }
    cx.putImageData(image,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.flipY=texture.flipY;t.magFilter=texture.magFilter;t.minFilter=texture.minFilter;palettes.set(texture,t);return t;
  }
  const ready=Promise.all(Object.entries(FILES).map(async([id,file])=>{
    try {
      const gltf=await loader.loadAsync('./assets/models/'+file+'.glb');
      const matCache=new Map();
      gltf.scene.traverse(o=>{
        if(!o.isMesh)return;
        sharedGeometry.add(o.geometry);o.castShadow=true;o.receiveShadow=true;
        const adjust=mat=>{
          if(matCache.has(mat))return matCache.get(mat);
          const m=mat.clone();matCache.set(mat,m);
          m.roughness=.88;m.metalness=0;
          if(m.map){m.map.colorSpace=THREE.SRGBColorSpace;if(file.startsWith('kenney/')||['survivor','husk'].includes(id))m.map=weatheredPalette(m.map);}
          if(['deer','pig'].includes(id)) {m.map=hide;m.roughness=.96;m.color.lerp(new THREE.Color(id==='pig'?0x927663:0x80705b),.15);}
          if(['iron','gold','knife'].includes(id)&&/steel/i.test(m.name)){m.metalness=.65;m.roughness=.55;if(id==='gold')m.color.setHex(0xb99a55);}
          if(id==='gold'&&/red|steel/i.test(m.name)){m.color.setHex(/light/i.test(m.name)?0xc2aa6a:0x9f8246);m.metalness=.65;m.roughness=.58;}
          if(id==='sword'&&/steel/i.test(m.name)){m.color.setHex(0x76776f);m.roughness=.96;}
          if(id==='torch'&&/yellow/i.test(m.name)){m.emissive.setHex(0xff862d);m.emissiveIntensity=1.5;}
          sharedMaterials.add(m);return m;
        };
        o.material=Array.isArray(o.material)?o.material.map(adjust):adjust(o.material);
      });
      gltf.scene.updateMatrixWorld(true);
      if(id==='torch'){
        // The source GLB exports its yellow flame below the handle. Move that actual mesh
        // into the wrapped torch head before normalization, preserving the wooden grip.
        const whole=new THREE.Box3().setFromObject(gltf.scene);
        gltf.scene.traverse(o=>{if(o.isMesh&&/yellow/i.test(o.material.name)){
          const box=new THREE.Box3().setFromObject(o),center=box.getCenter(new THREE.Vector3());
          const deltaY=whole.max.y-(box.max.y-box.min.y)*.5-center.y;
          const a=o.parent.worldToLocal(center.clone()),b=o.parent.worldToLocal(center.clone().add(new THREE.Vector3(0,deltaY,0)));
          o.position.add(b.sub(a));o.updateMatrixWorld(true);
        }});
      }
      const bounds=new THREE.Box3().setFromObject(gltf.scene);
      cache.set(id,{gltf,bounds,size:bounds.getSize(new THREE.Vector3())});
    } catch(error) {failures.push(id);console.warn('Local model failed; deliberate fallback retained:',id,error);}
  }));
  function instance(id,height,grip=null,uniqueMaterials=false) {
    const data=cache.get(id);if(!data)return null;
    const root=clone(data.gltf.scene),group=new THREE.Group(),scale=height/data.size.y;
    root.scale.multiplyScalar(scale);
    const center=data.bounds.getCenter(new THREE.Vector3());
    root.position.set(-center.x*scale,-(data.bounds.min.y+(grip??0)*data.size.y)*scale,-center.z*scale);
    group.add(root);group.userData.asset=id;
    if(uniqueMaterials){const materials=new Map();root.traverse(o=>{if(o.isMesh){const make=m=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(make):make(o.material);}});group.userData.ownedMaterials=[...materials.values()];}
    return group;
  }
  function animal(kind) {
    const group=new THREE.Group(),visual=instance(kind,kind==='pig'?.95:1.65,null,true);
    if(!visual)return null;
    visual.rotation.y=Math.PI/2;group.add(visual);
    const mixer=new THREE.AnimationMixer(visual),clips=cache.get(kind).gltf.animations;
    const actions={};
    for(const [key,match]of Object.entries({idle:/^(?:Armature\|)?Idle$/,walk:/^Walk$/,run:/^Gallop$/,death:/^Death$/,hit:/^Idle_HitReact_Left$/})){
      const clip=clips.find(c=>match.test(c.name));if(clip)actions[key]=mixer.clipAction(clip);
    }
    const bones=[];visual.traverse(o=>{if(o.isBone&&/^(Front|Back)UpLeg[LR]$/.test(o.name))bones.push({bone:o,rest:o.rotation.x});});
    const entity={group,visual,mixer,actions,bones,mats:visual.userData.ownedMaterials,legs:[],head:new THREE.Object3D(),animationState:'',reaction:0,kind};
    animateAnimal(entity,0,0);return entity;
  }
  function animateAnimal(e,dt,speed) {
    if(!e.mixer)return;
    e.reaction=Math.max(0,e.reaction-dt);
    const key=!e.alive&&e.alive!==undefined?'death':e.reaction>0?'hit':speed>2?'run':speed>.1?'walk':'idle';
    const action=e.actions[key]||e.actions.idle;
    if(e.animationState!==key){
      const previous=e.activeAction;e.activeAction=action;e.animationState=key;
      if(action){action.reset();if(key==='death'||key==='hit'){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}else action.setLoop(THREE.LoopRepeat,Infinity);action.fadeIn(.12).play();if(previous&&previous!==action)previous.fadeOut(.12);}
    }
    if(action)action.timeScale=key==='walk'?Math.max(.5,speed/1.2):key==='run'?Math.max(.7,speed/4):1;
    e.mixer.update(dt);
    // Farm pig only supplies idle/jump. A skeleton gait supplements the real rig without pretending a run clip exists.
    if(e.kind==='pig'&&e.alive!==false){e.bones.forEach(({bone,rest},i)=>{bone.rotation.x=rest+Math.sin(e.walkPhase+(i===0||i===3?0:Math.PI))*(speed>.1?.48:0);});}
  }
  function character(id,height=1.85) {
    const visual=instance(id,height,null,true);if(!visual)return null;
    const group=new THREE.Group();group.add(visual);
    const mixer=new THREE.AnimationMixer(visual),actions={};
    for(const key of ['idle','run']){const clip=cache.get(id).gltf.animations.filter(c=>c.name===key).sort((a,b)=>b.duration-a.duration)[0];if(clip)actions[key]=mixer.clipAction(clip);}
    const root=visual.getObjectByName('Hips'),head=visual.getObjectByName('Head');
    const arms=['LeftArm','RightArm'].map(n=>visual.getObjectByName(n)).filter(Boolean),legs=['LeftUpLeg','RightUpLeg'].map(n=>visual.getObjectByName(n)).filter(Boolean);
    const e={group,visual,mixer,actions,root,head,arms,legs,mats:visual.userData.ownedMaterials,animationState:''};animateCharacter(e,0,'idle');return e;
  }
  function animateCharacter(e,dt,key='idle') {
    if(!e.mixer)return;const action=e.actions[key]||e.actions.idle;
    if(e.activeAction!==action){const previous=e.activeAction;e.activeAction=action;action?.reset().fadeIn(.15).play();if(previous)previous.fadeOut(.15);}
    e.mixer.update(dt);
    // Uploaded FBX run contains root translation. Keep locomotion in the authoritative AI transform.
    if(e.root){e.root.position.x=0;e.root.position.z=0;}
  }
  function cleanup(e){if(e.mixer){const root=e.visual||e.mixer.getRoot();e.mixer.stopAllAction();e.mixer.uncacheRoot(root);const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const skeleton of skeletons)skeleton.dispose();}}
  return {ready,cache,failures,sharedGeometry,sharedMaterials,instance,animal,animateAnimal,character,animateCharacter,cleanup};
}
