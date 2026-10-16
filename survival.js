// Wildwood: original procedural geometry, music and field-journal writing.
// This module deliberately extends the existing terrain/combat systems rather than replacing them.
import { installIndustry } from './industry.js?v=6';
import { LIGHTING } from './lighting.js?v=6';
export function installSurvival(g)  {
  const { THREE, ART, items, activeWeapon, inventoryUI, state, world, player, camera, scene, CFG, TEX, MAT, AudioFX, dom, terrainHeight, groundHeightAt, dist2D, clamp, showToast, releaseInput, lockPointer, spawnBurst, allocLight, freeLight } = g;
  const $ = id => document.getElementById(id);
  const industry=installIndustry({...g,LIGHTING,save:()=>saveGame(false),showOverlay,hideOverlay});
  const BUILD_PARTS = [
    { id:'floor', name:'Timber foundation', cost:{wood:4}, description:'A level 3m floor. Walls and roofs snap to it.' },
    { id:'wall', name:'Log wall', cost:{wood:3}, description:'A solid boundary. Slows night attackers.' },
    { id:'door', name:'Framed door', cost:{wood:4}, description:'E opens and closes. Keep it shut at night.' },
    { id:'roof', name:'Shingle roof', cost:{wood:4}, description:'Add above a foundation for shelter.' },
    { id:'chest', name:'Storage chest', cost:{wood:5}, description:'Store resources safely at your camp.' },
    { id:'workbench', name:'Workbench', cost:{wood:8,stone:4}, description:'Unlocks advanced tools and field equipment.' },
    { id:'campfire', name:'Stone campfire', cost:{wood:4,stone:3}, description:'Cook meat. Warmth and a place to recover.' },
    { id:'furnace', name:'Stone furnace', cost:{stone:12,wood:4}, description:'Load sand and wood; smelt glass in 18 seconds.' },
    { id:'generator', name:'Wood-gas generator', cost:{iron:8,wood:6,stone:4}, description:'Workbench required. 1 wood powers nearby lamps for 120 seconds.', bench:true },
    { id:'lamp', name:'Wired glass lamp', cost:{bulb:1,iron:1,wood:2}, description:'Automatic wire connection within 12m of a fueled generator.', bench:true },
    { id:'spikes', name:'Defensive stakes', cost:{wood:5,stone:2}, description:'Damages attackers. Requires a nearby bench.', bench:true },
  ];
  const build = {mode:false,index:0,rotation:0,preview:null,point:null,valid:false,reason:'',placedAt:-1000};
  world.structures=[];world.pois=[];
  state.lore=[];state.claimed=[];state.nightAnnounced=-1;state.saveClock=0;
  const SAVE_KEY='wildwood-run-v2';
  let storageTarget=null,poiCell='',interactionClock=0,firstCamp=true,lastNight=false,ambienceClock=4;
  const wood=new THREE.MeshStandardMaterial({map:TEX.wood,color:0xd8c7ac,roughness:.88,normalMap:TEX.woodNormal,normalScale:new THREE.Vector2(.55,.55)});
  const plank=new THREE.MeshStandardMaterial({map:TEX.wood,color:0xebdcc3,roughness:.84,normalMap:TEX.woodNormal,normalScale:new THREE.Vector2(.4,.4)});
  const metal=new THREE.MeshStandardMaterial({color:0x545a60,metalness:.65,roughness:.6});
  const roofMat=new THREE.MeshStandardMaterial({map:TEX.rock,color:0x565355,roughness:.96});
  const previewMat=new THREE.MeshBasicMaterial({color:0x98ceaf,transparent:true,opacity:.32,depthWrite:false});
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const cylinderGeo=new THREE.CylinderGeometry(1,1,1,8);
  const coneGeo=new THREE.ConeGeometry(1,1,7);
  function box(group,x,y,z,w,h,d,material=wood) {
    const mesh=new THREE.Mesh(boxGeo,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  function post(group,x,y,z,r,h,material=wood) {
    const mesh=new THREE.Mesh(cylinderGeo,material);mesh.position.set(x,y,z);mesh.scale.set(r,h,r);mesh.castShadow=true;group.add(mesh);return mesh;
  }
  function makePiece(kind,preview=false) {
    const group=new THREE.Group();
    if(['furnace','generator','lamp'].includes(kind)){const model=industry.makePiece(kind);group.add(model);group.userData.heat=model.userData.heat;}
    else if(kind==='floor') {
      for(let i=0;i<8;i++)box(group,-1.31+i*.375,.14,0,.355,.24,3,plank);
      for(const x of [-1.25,1.25])for(const z of [-1.25,1.25])post(group,x,-.26,z,.13,.8);
      box(group,0,-.08,1.25,3,.18,.15);box(group,0,-.08,-1.25,3,.18,.15);
    } else if(kind==='wall') {
      for(let i=0;i<9;i++){const log=post(group,0,.15+i*.3,0,.16,3);log.rotation.z=Math.PI/2;}
      box(group,-1.38,1.3,.14,.12,2.7,.1,plank);box(group,1.38,1.3,.14,.12,2.7,.1,plank);
    } else if(kind==='door') {
      box(group,-1.1,1.35,0,.8,2.7,.24);box(group,1.1,1.35,0,.8,2.7,.24);box(group,0,2.5,0,1.5,.4,.24);
      const hinge=new THREE.Group();hinge.position.set(-.68,0,0);group.add(hinge);group.userData.hinge=hinge;
      for(let i=0;i<5;i++)box(hinge,.136+i*.27,1.12,0,.252,2.2,.1,plank);
      box(hinge,.66,.4,.07,1.3,.12,.05,metal);box(hinge,.66,1.9,.07,1.3,.12,.05,metal);box(hinge,1.16,1.15,.13,.08,.08,.12,metal);
    } else if(kind==='roof') {
      for(let i=0;i<8;i++){const m=box(group,-1.31+i*.375,.08,0,.355,.16,3.24,roofMat);m.rotation.z=(i<4?1:-1)*.07;}
      box(group,0,-.08,-1.35,3.2,.2,.15);box(group,0,-.08,1.35,3.2,.2,.15);
    } else if(kind==='chest') {
      box(group,0,.43,0,1.22,.78,.75,plank);box(group,0,.87,0,1.3,.14,.82);
      for(const x of [-.43,.43]){box(group,x,.48,.39,.08,.88,.04,metal);box(group,x,.48,-.39,.08,.88,.04,metal);}box(group,0,.61,.41,.17,.15,.06,metal);
    } else if(kind==='workbench') {
      box(group,0,1.05,0,1.8,.18,.85,plank);for(const x of [-.7,.7])for(const z of [-.3,.3])box(group,x,.5,z,.12,1,.12);
      box(group,0,.3,0,1.6,.1,.65);box(group,.5,1.21,0,.45,.15,.32,metal);post(group,-.4,1.15,.1,.12,.15,metal);
    } else if(kind==='campfire') {
      for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const stone=new THREE.Mesh(cylinderGeo,MAT.rock);stone.position.set(Math.sin(a)*.65,.14,Math.cos(a)*.65);stone.scale.set(.23,.25,.22);group.add(stone);}
      for(let i=0;i<3;i++){const log=post(group,0,.15,0,.13,1.15);log.rotation.set(Math.PI/2,0,i*Math.PI/3);}
      const flame=new THREE.Mesh(coneGeo,new THREE.MeshStandardMaterial({color:0xffc478,emissive:0xff7720,emissiveIntensity:1.8,transparent:true,opacity:.84}));flame.position.y=.48;flame.scale.set(.27,.7,.27);group.add(flame);group.userData.flame=flame;
    } else if(kind==='spikes') {
      box(group,0,.13,0,2.8,.18,.7);
      for(let i=0;i<7;i++){const spike=new THREE.Mesh(coneGeo,plank);spike.position.set(-1.2+i*.4,.58,0);spike.scale.set(.11,1.1,.11);spike.rotation.x=-.25;spike.castShadow=true;group.add(spike);}
    }
    if (['chest','workbench','campfire'].includes(kind)) {
      const model=ART.instance(kind,kind==='chest'?.9:kind==='workbench'?1.14:.4);
      if(model){const flame=group.userData.flame;group.clear();group.add(model);if(flame)group.add(flame);}
    }
    if(preview)group.traverse(o=>{if(o.isMesh){o.material=previewMat;o.castShadow=false;}});
    return group;
  }
  const costText=cost=>Object.entries(cost).map(([k,v])=>`${v} ${k}`).join(' · ');
  const affordable=part=>Object.entries(part.cost).every(([k,v])=>(state.inv[k]||0)>=v);
  function nearStructure(kind,radius=4){return world.structures.find(s=>s.kind===kind&&dist2D(s.x,s.z,player.pos.x,player.pos.z)<radius&&Math.abs(s.y-player.pos.y)<3);}
  function showOverlay(id){state.paused=true;releaseInput();g.resetFeedback();AudioFX.setUnderwater(false);$(id).classList.remove('hidden');}
  function hideOverlay(id){if(id==='inventory-overlay')inventoryUI.closePreview();$(id).classList.add('hidden');state.paused=false;AudioFX.resume();lockPointer();}
  function closeCampOverlay(){for(const id of ['build-overlay','storage-overlay','journal-overlay','inventory-overlay','furnace-overlay'])if(!$(id).classList.contains('hidden')){hideOverlay(id);return true;}return false;}
  function toggleBuild(){
    if(!state.started||state.dead)return;
    if(build.mode){cancelBuild();return;}
    if(!state.paused){renderBuildList();showOverlay('build-overlay');}else if(!$('build-overlay').classList.contains('hidden'))hideOverlay('build-overlay');
  }
  function renderBuildList(){
    $('build-list').replaceChildren();
    BUILD_PARTS.forEach((part,index)=>{const b=document.createElement('button');b.className='build-choice';b.innerHTML=`${inventoryUI.icon(part.id)} <b>${part.name}</b><small>${costText(part.cost)}${part.bench?' · workbench':''}</small><small>${part.description}</small>`;b.onclick=()=>{hideOverlay('build-overlay');chooseBuild(index);};$('build-list').append(b);});
  }
  function chooseBuild(index){
    if(build.preview){build.preview.removeFromParent();}
    build.index=index;build.mode=true;build.preview=makePiece(BUILD_PARTS[index].id,true);scene.add(build.preview);updateBuildPreview();
  }
  function cancelBuild(){if(build.preview)build.preview.removeFromParent();build.preview=null;build.mode=false;build.point=null;}
  function foundationAt(x,z){return world.structures.find(s=>s.kind==='floor'&&Math.abs(s.x-x)<1.55&&Math.abs(s.z-z)<1.55);}
  function updateBuildPreview(){
    if(!build.mode||!build.preview)return;
    const part=BUILD_PARTS[build.index],dir=new THREE.Vector3();camera.getWorldDirection(dir);
    const reach=clamp(3.5+player.pitch*2,2.4,5.5);
    let x=Math.round((player.pos.x-Math.sin(player.yaw)*reach)/3)*3,z=Math.round((player.pos.z-Math.cos(player.yaw)*reach)/3)*3;
    const rot=build.rotation*Math.PI/2;let floor=foundationAt(x,z);let y=terrainHeight(x,z);
    if(part.id==='wall'||part.id==='door'){
      if(build.rotation%2===0)z+=dir.z>0?-1.5:1.5;else x+=dir.x>0?-1.5:1.5;
      floor=world.structures.find(s=>s.kind==='floor'&&Math.abs(s.x-x)<=1.55&&Math.abs(s.z-z)<=1.55);y=floor?floor.y+.26:y;
    }else if(part.id==='roof'){y=floor?floor.y+2.96:y+2.96;}else if(part.id!=='floor'&&floor)y=floor.y+.26;
    if(part.id==='floor')y=Math.max(...[[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4],[0,0]].map(([a,b])=>terrainHeight(x+a,z+b)));
    const samples=[[-1.3,-1.3],[1.3,1.3],[1.3,-1.3],[-1.3,1.3]].map(([a,b])=>terrainHeight(x+a,z+b));
    let reason='';
    if(!affordable(part))reason='Not enough resources';
    else if(part.bench&&!nearStructure('workbench',7) )reason='Build near your workbench';
    else if(g.caveReserved(x,z,2))reason='Keep the cave approach clear';
    else if(y<CFG.waterLevel+.6)reason='Find dry ground';
    else if(part.id==='floor'&&Math.max(...samples)-Math.min(...samples)>1.35)reason='Ground is too steep';
    else if(['wall','door','roof'].includes(part.id)&&!floor)reason='Needs a foundation';
    else if(dist2D(x,z,player.pos.x,player.pos.z)<(part.id==='floor'?1.7:.85))reason='Step away from the preview';
    else if(world.structures.some(s=>dist2D(s.x,s.z,x,z)<.5&&Math.abs(s.y-y)<.5&&!(s.kind==='floor'&&['chest','workbench','campfire','spikes'].includes(part.id))))reason='Space already occupied';
    else if(!['wall','door','roof'].includes(part.id)&&world.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+(part.id==='floor'?1.8:.8)&&(c.minY===undefined||Math.abs(c.minY-y)<4)))reason='Clear trees or rocks first';
    build.point={x,y,z,rotation:rot};build.reason=reason;build.valid=!reason;
    build.preview.position.set(x,y,z);build.preview.rotation.y=rot;previewMat.color.setHex(reason?0xe16c61:0x94d1aa);
  }
  function normalizeChest(data){if(data?.slots)return{slots:data.slots.map(s=>s?{...s}:null)};const slots=[];for(const[id,n]of Object.entries(data||{})){if(!items.defs[id]||!Number.isFinite(n)||n<=0)continue;let count=Math.floor(n);while(count){const qty=Math.min(count,items.defs[id].maxStack);slots.push({id,qty,uid:'chest-'+crypto.randomUUID()});count-=qty;}}while(slots.length<27)slots.push(null);return{slots};}
  function addStructure(data){
    const s={kind:data.kind,x:data.x,y:data.y,z:data.z,rotation:data.rotation||0,hp:data.hp??100,open:!!data.open,inventory:normalizeChest(data.inventory),fuel:data.fuel??90,cook:0,group:makePiece(data.kind)};
    industry.init(s,data);g.patchSnow(s.group);
    s.group.position.set(s.x,s.y,s.z);s.group.rotation.y=s.rotation;
    if(s.kind==='door'&&s.open&&s.group.userData.hinge)s.group.userData.hinge.rotation.y=-Math.PI/2;
    if(s.kind==='campfire'){s.light=allocLight(LIGHTING.warm,LIGHTING.campfireIntensity,LIGHTING.campfireRange,.05);if(s.light)s.light.light.position.set(s.x,s.y+1,s.z);}
    scene.add(s.group);world.structures.push(s);return s;
  }
  function confirmBuild(){
    if(performance.now()-build.placedAt<350)return;updateBuildPreview();
    if(!build.valid){showToast(build.reason,1500);return;}
    if(world.structures.length>=180){showToast('Camp limit reached · dismantle an unused piece',2000);return;}
    const part=BUILD_PARTS[build.index];if(!items.transaction(part.cost,{}))return;
    addStructure({kind:part.id,...build.point});build.placedAt=performance.now();AudioFX.play('craft');spawnBurst(new THREE.Vector3(build.point.x,build.point.y+.5,build.point.z),0xc7a273);
    if(firstCamp){firstCamp=false;showToast('Your camp begins here · walls need a foundation · <b>B</b> exits placement',3500);}
    saveGame(false);updateBuildPreview();
  }
  function localPoint(s,pos){const dx=pos.x-s.x,dz=pos.z-s.z,c=Math.cos(s.rotation),sn=Math.sin(s.rotation);return{x:dx*c-dz*sn,z:dx*sn+dz*c};}
  function solidRects(s){
    if(s.kind==='wall')return [[0,0,1.5,.16]];
    if(s.kind==='door')return s.open?[[-1.1,0,.4,.15],[1.1,0,.4,.15]]:[[0,0,1.5,.16]];
    if(['chest','workbench','furnace','generator','lamp'].includes(s.kind))return [[0,0,s.kind==='lamp'?.3:s.kind==='chest'?.65:.9,.5]];
    if(s.kind==='spikes')return [[0,0,1.4,.35]];
    return [];
  }
  function pushFromStructure(s,pos,radius){
    if(pos.y>s.y+2.65||pos.y+CFG.playerHeight<s.y)return false;
    let collided=false;const q=localPoint(s,pos);
    for(const [cx,cz,hx,hz] of solidRects(s)){
      const dx=q.x-cx,dz=q.z-cz,ox=hx+radius-Math.abs(dx),oz=hz+radius-Math.abs(dz);
      if(ox>0&&oz>0){collided=true;if(ox<oz)q.x+=Math.sign(dx||1)*ox;else q.z+=Math.sign(dz||1)*oz;}
    }
    if(collided){const c=Math.cos(s.rotation),sn=Math.sin(s.rotation);pos.x=s.x+q.x*c+q.z*sn;pos.z=s.z-q.x*sn+q.z*c;}
    return collided;
  }
  // Solid collision boxes for POI scenery (POIs never rotate): [cx, cz, halfW, halfD, top]
  const POI_RECTS={
    0:[[-1.4,0,.12,1.55,2.6],[0,1.4,1.55,.12,2.2],[1.4,.5,.12,1.05,1.2],[.4,-1,.7,.45,1.0]],
    1:[[-1.8,0,1.4,.3,.55],[.4,-1,.7,.45,1.0]],
    2:[[-0.48,0,1.26,.68,1.75],[.4,-1,.7,.45,1.0]],
  };
  function pushFromPOI(p,pos,radius){
    const rects=POI_RECTS[p.type%3];if(!rects)return false;
    const base=p.y-2; // surrounding terrain may sit slightly below the POI anchor
    if(pos.y>p.y+3||pos.y+CFG.playerHeight<base)return false;
    let collided=false;
    for(const [cx,cz,hx,hz,top] of rects){
      if(pos.y>p.y+top||pos.y+CFG.playerHeight<base)continue;
      const dx=pos.x-(p.x+cx),dz=pos.z-(p.z+cz);
      const ox=hx+radius-Math.abs(dx),oz=hz+radius-Math.abs(dz);
      if(ox>0&&oz>0){collided=true;if(ox<oz)pos.x+=Math.sign(dx||1)*ox;else pos.z+=Math.sign(dz||1)*oz;}
    }
    return collided;
  }
  function resolveBuildCollision(pos,radius){for(const s of world.structures)pushFromStructure(s,pos,radius);for(const p of world.pois)pushFromPOI(p,pos,radius);}
  function aimedStructure(){
    const dir=new THREE.Vector3();camera.getWorldDirection(dir);let best=null,score=Infinity;
    for(const s of world.structures){const target=new THREE.Vector3(s.x,s.y+(s.kind==='roof'?0:1),s.z).sub(camera.position),d=target.length();if(d<4.8&&d<score&&target.normalize().dot(dir)>.70){best=s;score=d;}}
    return best;
  }
  function removeStructure(s,refund=false){
    if(!world.structures.includes(s))return false;
    s.group.removeFromParent();freeLight(s.light);
    if(s.group.userData.flame)s.group.userData.flame.material.dispose();
    if(['furnace','generator','lamp'].includes(s.kind))s.group.traverse(o=>{o.geometry?.dispose();if(o===s.group.userData.heat)o.material.dispose();});
    world.structures.splice(world.structures.indexOf(s),1);
    if(refund)industry.refund(s);
    if(refund){const part=BUILD_PARTS.find(p=>p.id===s.kind);for(const [k,v]of Object.entries(part.cost))state.inv[k]=(state.inv[k]||0)+Math.floor(v/2);for(const item of s.inventory.slots||[])if(item)items.add(item.id,item.qty);}
  }
  function dismantleStructure(){const s=aimedStructure();if(!s)return;if(build.mode)cancelBuild();removeStructure(s,true);AudioFX.play('chop');showToast('Dismantled · half the materials recovered',1500);saveGame(false);}
  function renderStorage(){
    const root=$('storage-list');root.replaceChildren();if(!storageTarget)return;
    for(const put of [true,false]){
      const title=document.createElement('h3');title.textContent=put?'YOUR PACK · CLICK TO STORE':'CHEST · CLICK TO TAKE';root.append(title);
      const grid=document.createElement('div');grid.className='storage-grid';root.append(grid);
      const slots=put?items.slots:storageTarget.inventory.slots;
      slots.forEach((s,i)=>{if(!s)return;const b=document.createElement('button');b.className='item-slot';b.innerHTML=inventoryUI.icon(s.id)+`<span class="stack-count">${s.qty}</span>`;b.title=items.defs[s.id].name+' · transfer 5 / Shift all';b.onclick=e=>{if(items.transfer(storageTarget.inventory,i,put,e.shiftKey)){AudioFX.play('pickup');renderStorage();saveGame(false);}};grid.append(b);});
      if(!grid.childElementCount)grid.textContent='Empty';
    }
  }
  const fragments=[
    ['The last camp','Day 4. The radio keeps saying our names. Pearl said the station had been abandoned for thirty years. Tonight I saw his coat between the trees. He was still wearing it when we buried him.'],
    ['Survey marker 17','Iron below the ridge. A chamber beneath it. Do not take the gold. The sound does not come from the radio anymore. It comes from the rock.'],
    ['The empty shack','We built a door. We shut it. Something outside asked to be let in. It sounded like Tom. In the morning every nail in the wall had turned to gold.'],
    ['A broken transmission','... keep the fire alive ... it follows the signal, not the light ... second night ... Pearl is not a man ... [carrier lost]'],
    ['The cairn','No footprints arrive at this place. Every print leads away. Someone left a single sentence scratched into the stone: “A name is a door.”'],
  ];
  function openJournal(index=null){
    if(index===null){$('journal-tag').textContent='FIELD JOURNAL';$('journal-title').textContent='What remains';$('journal-text').replaceChildren();const p=document.createElement('p');p.textContent=state.lore.length?'Fragments recovered from the abandoned camps:':'Find amber landmarks on your map. Someone was here before you.';$('journal-text').append(p);for(const i of state.lore){const h=document.createElement('h4'),text=document.createElement('p');h.textContent=fragments[i][0];text.textContent=fragments[i][1];h.style.marginTop='16px';$('journal-text').append(h,text);}}
    else {$('journal-title').textContent=fragments[index][0];$('journal-tag').textContent='RECOVERED FIELD NOTE';$('journal-text').textContent=fragments[index][1];if(!state.lore.includes(index))state.lore.push(index);AudioFX.play('lore');}
    showOverlay('journal-overlay');saveGame(false);
  }
  function poiModel(p){
    const group=new THREE.Group();
    if(p.type%3===0){box(group,0,.06,0,3,.12,3,plank);box(group,-1.4,1.3,0,.15,2.6,3);box(group,0,1.1,1.4,3,2.2,.15);box(group,1.4,.6,.5,.15,1.2,2);const beam=box(group,0,2.6,0,3.2,.16,3.3,roofMat);beam.rotation.z=.13;}
    else if(p.type%3===1){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const rock=new THREE.Mesh(cylinderGeo,MAT.rock);rock.position.set(Math.cos(a)*.85,.12,Math.sin(a)*.85);rock.scale.set(.24,.22,.23);group.add(rock);}const log=post(group,-1.8,.24,0,.23,2.7);log.rotation.z=Math.PI/2;box(group,1.4,.03,0,1.7,.04,2.5,roofMat);}
    else {for(let i=0;i<4;i++){const stone=new THREE.Mesh(cylinderGeo,MAT.rock);stone.position.set(0,.35+i*.35,0);stone.scale.set(.8-i*.16,.42,.7-i*.12);group.add(stone);}post(group,-1.6,1.2,0,.07,2.4);box(group,-1.6,2.1,0,.7,.4,.05,plank);}
    const cache=makePiece('chest');cache.position.set(.4,0,-1);group.add(cache);
    for(const [id,x,z,h] of p.type%3===1?[['bedroll',1.4,0,.12],['barrel',-2.2,1,1]]:[['barrel',2,1,1]]){
      const prop=ART.instance(id,h);if(prop){prop.position.set(x,0,z);group.add(prop);}
    }
    const note=box(group,.4,.99,-1,.32,.02,.24,new THREE.MeshStandardMaterial({color:0xedd9a4,roughness:1}));note.rotation.y=.2;
    const supplies=new THREE.Group();
    for(const [id,x,z,h]of [['woodPickup',.8,-1.8,.28],['stonePickup',-.2,-1.6,.22]]){const prop=ART.instance(id,h);if(prop){prop.position.set(x,0,z);supplies.add(prop);}}
    supplies.visible=!p.claimed;group.add(supplies);p.supplies=supplies;
    group.position.set(p.x,p.y,p.z);scene.add(group);p.group=group;
  }
  function spawnPOIs(){
    const cell=Math.floor(player.pos.x/90)+','+Math.floor(player.pos.z/90);if(cell===poiCell)return;poiCell=cell;
    const [cx,cz]=cell.split(',').map(Number);
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
      const ix=cx+dx,iz=cz+dz,id=`${ix},${iz}`;if(world.pois.some(p=>p.id===id))continue;
      const r=g.hash2(ix,iz,CFG.seed+812);const x=ix*90+20+r*45,z=iz*90+20+g.hash2(ix,iz,CFG.seed+915)*45,y=g.baseHeight(x,z);
      if(y<CFG.waterLevel+1||Math.abs(g.baseHeight(x+3,z+3)-y)>1.7||g.caveReserved(x,z,4))continue;
      const p={id,x,y,z,type:Math.floor(r*5),claimed:state.claimed.includes(id)};poiModel(p);world.pois.push(p);
    }
    for(let i=world.pois.length-1;i>=0;i--)if(dist2D(world.pois[i].x,world.pois[i].z,player.pos.x,player.pos.z)>210){world.pois[i].group.removeFromParent();world.pois.splice(i,1);}
  }
  function nearbyPOI(){return world.pois.find(p=>!p.claimed&&dist2D(p.x,p.z,player.pos.x,player.pos.z)<3.5&&Math.abs(p.y-player.pos.y)<3);}
  function useWorldObject(){
    const poi=nearbyPOI();if(poi){poi.claimed=true;if(poi.supplies)poi.supplies.visible=false;state.claimed.push(poi.id);state.inv.wood+=6;state.inv.stone+=4;state.inv.berries+=3;if(poi.type===1)state.inv.iron+=3;showToast('Recovered supplies · +6 wood / +4 stone / +3 berries',3200);openJournal(poi.type);return true;}
    const s=aimedStructure();if(!s)return false;
    if(industry.interact(s))return true;
    if(s.kind==='door'){s.open=!s.open;s.group.userData.hinge.rotation.y=s.open?-Math.PI/2:0;AudioFX.play('chop');return true;}
    if(s.kind==='chest'){storageTarget=s;renderStorage();showOverlay('storage-overlay');return true;}
    if(s.kind==='workbench'){g.openCraft('bench');return true;}
    if(s.kind==='campfire'){
      if(s.fuel<10){if(state.inv.wood<=0){showToast('Add wood to rekindle the fire',1800);return true;}state.inv.wood--;s.fuel+=90;showToast('Fire rekindled · +90 seconds',1800);}
      if(state.inv.meat>0){items.transaction({meat:1},{cooked:1});s.fuel=Math.max(0,s.fuel-8);AudioFX.play('craft');showToast('Cooked meat · <b>F</b> eat · +55 food / +14 health',2000);}
      else if(state.inv.wood>0&&s.fuel<160){state.inv.wood--;s.fuel+=60;showToast('Added wood · +60 seconds of warmth',1600);}else showToast('A moment of warmth · bring raw meat to cook',1800);
      saveGame(false);return true;
    }
    return false;
  }
  function sheltered(){const floor=foundationAt(player.pos.x,player.pos.z);return !!floor&&world.structures.some(s=>s.kind==='roof'&&Math.abs(s.x-floor.x)<.1&&Math.abs(s.z-floor.z)<.1)&&world.structures.filter(s=>['wall','door'].includes(s.kind)&&dist2D(s.x,s.z,floor.x,floor.z)<2.2).length>=3;}
  function enemyStructures(dt){
    for(const enemy of [...world.husks,...world.crawlers,...(world.tomPearl?[world.tomPearl]:[])]){
      if(enemy.alive===false)continue;
      g.resolveCollision(enemy.group.position,.48);
      for(const p of world.pois)pushFromPOI(p,enemy.group.position,.48);
      enemy.buildCooldown=Math.max(0,(enemy.buildCooldown||0)-dt);
      for(const s of [...world.structures]){
        const q=localPoint(s,enemy.group.position);
        if(s.kind==='spikes'&&Math.abs(q.x)<1.8&&Math.abs(q.z)<1.1&&enemy.buildCooldown===0){enemy.buildCooldown=.8;g.hitEnemy(enemy,5);s.hp-=5;spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0,.5,0)),0xbb9972);}
        if((pushFromStructure(s,enemy.group.position,.48)||solidRects(s).some(([cx,cz,hx,hz])=>Math.abs(q.x-cx)<hx+.6&&Math.abs(q.z-cz)<hz+.6))&&enemy.buildCooldown===0){enemy.buildCooldown=1.8;s.hp-=enemy===world.tomPearl?28:8;AudioFX.play('chop');}
        if(s.hp<=0){removeStructure(s);showToast('A camp structure was destroyed',2000);}
      }
    }
  }
  function updateCamp(dt){
    industry.update(dt);updateBuildPreview();spawnPOIs();enemyStructures(dt);
    const shelter=sheltered();
    for(const s of world.structures){
      if(s.kind!=='campfire')continue;s.fuel=Math.max(0,s.fuel-dt);const burning=s.fuel>0;
      const nearFire = dist2D(s.x,s.z,player.pos.x,player.pos.z)<28;
      if(!s.light && burning && nearFire){s.light=allocLight(LIGHTING.warm,LIGHTING.campfireIntensity,LIGHTING.campfireRange,.05);if(s.light)s.light.light.position.set(s.x,s.y+1,s.z);}
      if(s.light && !nearFire){freeLight(s.light);s.light=null;}
      if(s.light)s.light.base=burning?LIGHTING.campfireIntensity:0;
      if(s.group.userData.flame){s.group.userData.flame.visible=burning;s.group.userData.flame.scale.y=.65+Math.sin(state.time*7+s.x)*.07;}
      if(burning&&dist2D(s.x,s.z,player.pos.x,player.pos.z)<4&&state.hunger>20)state.hp=clamp(state.hp+dt*.45,0,100);
    }
    if(state.night&&!lastNight){showToast(state.days===0?'Night one · keep the fire close. The woods are listening.':`Night ${state.days+1} · barricade your camp. They are coming.`,4500);hordeClock=state.days>0?14:35;}
    if(state.night&&state.days>0){hordeClock-=dt;if(hordeClock<=0){hordeClock=80;const alive=world.husks.filter(e=>e.alive).length;const n=Math.min(2+Math.floor(state.days/2),Math.max(0,7-alive));for(let i=0;i<n;i++){const a=player.yaw+Math.PI+(i-.5)*.5,x=player.pos.x+Math.sin(a)*36,z=player.pos.z+Math.cos(a)*36;if(!g.waterColumnAt(x,z))g.spawnHusk(x,z);}if(n)showToast('Branches snap beyond the firelight',2600);}}
    if(!state.night&&lastNight){state.inv.berries+=2;showToast('Dawn · another night survived · +2 berries',3000);}
    lastNight=state.night;
    ambienceClock-=dt;if(ambienceClock<=0){ambienceClock=9+Math.random()*7;AudioFX.environment();}
    if(AudioFX.ambientGain&&AudioFX.ctx)AudioFX.ambientGain.gain.setTargetAtTime(state.paused?.015:state.night?.05:.025,AudioFX.ctx.currentTime,.8);
    state.saveClock+=dt;if(state.saveClock>35){state.saveClock=0;saveGame(false);}
  }
  let hordeClock=35;
  function playAtmosphere(){
    if(!AudioFX.ctx||AudioFX.ctx.state!=='running')return;
    const cave=world.caves.some(c=>c.breached&&dist2D(c.x,c.z,player.pos.x,player.pos.z)<c.r&&player.pos.y<c.y+5);
    const chord=state.night?[65.41,98,130.81]:[146.83,220,293.66];
    // Sparse original sine-pad voicings. No copied music or third-party license dependency.
    for(let i=0;i<chord.length;i++)AudioFX._tone(chord[i]*(cave?.5:1),5+i*.6,'sine',.035,state.night?chord[i]*.99:null,i*.45);
    if(weatherRain())AudioFX._noise(2,.035,1800);
    else if(!state.night&&!cave){AudioFX._tone(1600+Math.random()*200,.13,'sine',.016,2100);AudioFX._tone(2200,.12,'sine',.012,1800,.22);}
    if(nearStructure('campfire',6))AudioFX._noise(.4,.04,700);
  }
  const weatherRain=()=>g.weather.type==='rain'||g.weather.type==='storm';
  function updateCampHUD(){
    let objective='Gather wood · C craft an axe · B build a camp';
    if(world.structures.some(s=>s.kind==='floor'))objective='Add walls + door + roof · make a workbench';
    if(nearStructure('workbench',100))objective='Craft better equipment · explore amber landmarks';
    if(state.night)objective=sheltered()?'SHELTERED · keep the door shut and the fire alive':`NIGHT ${state.days+1} · return to your camp`;
    $('objective').textContent=objective;
    const w=activeWeapon();
    $('mode-label').textContent=build.mode?`BUILDING · ${BUILD_PARTS[build.index].name} · ${costText(BUILD_PARTS[build.index].cost)} · ${build.reason||'VALID: Click / E place'} · R rotate · Wheel select · B exit`:`${items.defs[items.slots[state.sel]?.id]?.name||'UNARMED'}${w.torch?' · TORCH PLACEMENT · 1 wood each':''} · Cooked meat ${state.inv.cooked||0}${sheltered()?' · SHELTERED':''}`;
  }
  function interactionText(){
    if(build.mode)return build.reason||'[ CLICK / E ] PLACE · R ROTATE · B CANCEL';
    if(nearbyPOI())return '[ E ] RECOVER SUPPLIES / FIELD NOTE';
    const s=aimedStructure();if(s){if(s.kind==='furnace')return '[ E ] FURNACE · LOAD SAND / FUEL · X DISMANTLE';if(s.kind==='generator')return `[ E ] ${s.fuel>0?'TOGGLE':'FUEL'} GENERATOR · ${Math.ceil(s.fuel)}s · X DISMANTLE`;if(s.kind==='lamp')return `[ E ] SWITCH LAMP · ${s.powered?'POWERED':s.enabled?'NEEDS GENERATOR WITHIN 12m':'OFF'}`;if(s.kind==='door')return `[ E ] ${s.open?'CLOSE':'OPEN'} DOOR · X DISMANTLE`;if(s.kind==='chest')return '[ E ] STORAGE · X DISMANTLE';    if(s.kind==='workbench')return '[ E ] WORKBENCH · ADVANCED GEAR · C FIELD CRAFTING';if(s.kind==='campfire')return `[ E ] COOK / ADD WOOD · FIRE ${Math.ceil(s.fuel)}s`;}
    return '';
  }
  function minimapExtras(ctx,toMap){
    for(const c of world.caveState.values()){if(!c.discovered)continue;const q=toMap(c.entranceX,c.entranceZ);ctx.strokeStyle='#c7c8bc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,4,Math.PI,Math.PI*2);ctx.stroke();}
    for(const p of world.pois){const q=toMap(p.x,p.z);ctx.fillStyle=p.claimed?'#8b857b':'#e5be7f';ctx.fillRect(q.x-3,q.y-3,6,6);}
    for(const s of world.structures){if(s.kind!=='floor'&&s.kind!=='campfire')continue;const q=toMap(s.x,s.z);ctx.fillStyle='#9dc8d7';ctx.fillRect(q.x-2,q.y-2,4,4);}
  }
  function initCamp(){
    firstCamp=true;lastNight=false;poiCell='';spawnPOIs();
    const x=player.pos.x+8,z=player.pos.z-12,y=terrainHeight(x,z);
    if(y>CFG.waterLevel+.6&&!g.caveReserved(x,z,4)&&!world.pois.some(p=>p.id==='first-camp')){const p={id:'first-camp',x,y,z,type:3,claimed:state.claimed.includes('first-camp')};poiModel(p);world.pois.push(p);}
    $('objective').textContent='Follow the amber camp marker · recover the abandoned pack';
    showToast('Empty pack · gather loose supplies nearby or use your hands · <b>C</b> craft',4000);
  }
  function clearCamp(){
    cancelBuild();for(const s of [...world.structures])removeStructure(s);
    for(const p of world.pois)p.group.removeFromParent();world.pois.length=0;
    state.lore=[];state.claimed=[];state.saveClock=0;poiCell='';storageTarget=null;firstCamp=true;lastNight=false;
    for(const id of ['build-overlay','storage-overlay','journal-overlay','inventory-overlay','furnace-overlay'])$(id).classList.add('hidden');
  }
  function serialize(){return {version:4,extensionsVersion:1,snow:g.serializeSnow(),caveState:[...world.caveState],items:items.serialize(),physical:g.serializePhysical(),harvestState:[...world.harvestState],terrainVersion:CFG.terrainVersion||1,seed:CFG.seed,position:player.pos.toArray(),yaw:player.yaw,pitch:player.pitch,hp:state.hp,hunger:state.hunger,stamina:state.stamina,sel:state.sel,days:state.days,phase:state.cyclePhase,time:state.time,lastTomDay:state.lastTomDay,lore:state.lore,claimed:state.claimed,structures:world.structures.map(s=>({kind:s.kind,x:s.x,y:s.y,z:s.z,rotation:s.rotation,hp:s.hp,open:s.open,inventory:s.inventory,fuel:s.fuel,enabled:s.enabled,smelting:s.smelting})),torches:world.torches.map(t=>({x:t.group.position.x,y:t.group.position.y,z:t.group.position.z})),digs:world.digs.map(d=>({...d})),chopped:[...world.chopped].slice(-4000),oreTaken:[...world.oreTaken].slice(-4000),oreShown:[...world.oreShown].slice(-4000),weather:{type:g.weather.type,next:g.weather.next,intensity:g.weather.intensity,timer:g.weather.timer}};}
  function saveGame(notify=true){
    if(!state.started||state.dead)return false;
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize()));$('continue-button').hidden=false;if(notify)showToast('Camp saved on this browser',2000);return true;}
    catch(error){console.warn('Save unavailable:',error.message);if(notify)showToast('Save unavailable · browser storage is full or disabled',3000);return false;}
  }
  function readSave(){
    try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;const d=JSON.parse(raw);
      if(![2,3,4].includes(d.version)||!Number.isFinite(d.seed)||!Array.isArray(d.position)||d.position.length!==3||!d.position.every(Number.isFinite)||(d.version<4&&(!d.inv||!Array.isArray(d.crafted)))||!Array.isArray(d.structures)||d.structures.length>180||!Number.isFinite(d.hp)||!Number.isFinite(d.phase))return null;
      if(d.version===4&&d.structures.some(s=>s.inventory?.slots&&s.inventory.slots.some(q=>q&&(!items.defs[q.id]||!Number.isInteger(q.qty)||q.qty<1||q.qty>items.defs[q.id].maxStack))))return null;
      if(d.structures.some(s=>!BUILD_PARTS.some(p=>p.id===s.kind)||![s.x,s.y,s.z,s.rotation].every(Number.isFinite)))return null;
      const cleanInventory=inv=>Object.fromEntries(['wood','stone','soil','iron','gold','berries','meat','cooked'].map(k=>[k,Number.isFinite(inv?.[k])?Math.max(0,Math.min(999999,Math.floor(inv[k]))):0]));
      if(d.version===4){items.validate(d.items);const ids=new Set(d.items.slots.filter(Boolean).map(s=>s.uid));for(const s of Object.values(d.items.equipment||{}))if(s)ids.add(s.uid);for(const s of d.structures)for(const q of s.inventory?.slots||[])if(q){if(typeof q.uid!=='string'||ids.has(q.uid))throw Error('Duplicate stored item identity');ids.add(q.uid);}}else d.inv=cleanInventory(d.inv);
      d.structures=d.structures.map(s=>({...s,hp:Number.isFinite(s.hp)?clamp(s.hp,1,100):100,fuel:Number.isFinite(s.fuel)?clamp(s.fuel,0,1000):90,inventory:d.version===4?normalizeChest(s.inventory):normalizeChest(cleanInventory(s.inventory))}));
      d.digs=(Array.isArray(d.digs)?d.digs:[]).slice(0,2000).filter(q=>q&&[q.x,q.z,q.r,q.depth].every(Number.isFinite)&&q.r>0&&q.r<=12&&q.depth>0&&q.depth<=30);
      d.torches=(Array.isArray(d.torches)?d.torches:[]).filter(t=>t&&[t.x,t.z].every(Number.isFinite)).slice(0,8);
      for(const key of ['chopped','oreTaken','oreShown','claimed'])d[key]=(Array.isArray(d[key])?d[key]:[]).filter(k=>typeof k==='string').slice(0,4000);
      d.lore=(Array.isArray(d.lore)?d.lore:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<fragments.length);
      for(const [key,defaultValue,min,max]of [['hunger',100,0,100],['stamina',100,0,100],['days',0,0,10000],['time',0,0,1e8],['yaw',0,-1e6,1e6],['pitch',0,-1.5,1.5],['lastTomDay',-1,-1,10000],['sel',0,0,d.version===4?8:g.WEAPONS.length-1]])d[key]=Number.isFinite(d[key])?clamp(d[key],min,max):defaultValue;
      d.sel=Math.floor(d.sel);d.days=Math.floor(d.days);
      const w=d.weather||{};d.weather={type:['clear','rain','storm','fog','snow'].includes(w.type)?w.type:'clear',next:['clear','rain','storm','fog','snow'].includes(w.next)?w.next:'clear',intensity:Number.isFinite(w.intensity)?clamp(w.intensity,0,1):0,timer:Number.isFinite(w.timer)?clamp(w.timer,0,1000):100};
      d.sel=d.version===2&&d.sel===8?10:d.sel;
      d.terrainVersion=d.terrainVersion===2?2:1;
      d.harvestState=(Array.isArray(d.harvestState)?d.harvestState:[]).filter(q=>Array.isArray(q)&&typeof q[0]==='string'&&q[1]&&Number.isFinite(q[1].hp)).slice(0,20000);
      return d;
    }catch(error){console.warn('Saved camp could not be read:',error.message);return null;}
  }
  function loadGame(){
    if(state.started) return;const d=readSave();if(!d){showToast('No valid camp save found',2000);return;}
    releaseInput();g.resetFeedback();clearCamp();g.clearEntities();for(const key of [...world.chunks.keys()])g.unloadChunk(key);
    world.digs.length=0;world.digCells.clear();CFG.seed=d.seed;CFG.terrainVersion=d.terrainVersion;
    world.caveState=new Map((Array.isArray(d.caveState)?d.caveState:[]).filter(q=>Array.isArray(q)&&typeof q[0]==='string'&&q[1]&&[q[1].entranceX,q[1].entranceZ].every(Number.isFinite)).map(([id,c])=>[id,{...c,mobs:clamp(Math.floor(c.mobs||0),0,3),mobTimer:Number.isFinite(c.mobTimer)?clamp(c.mobTimer,0,30):5}]));g.restoreSnow(d.snow);
    for(const q of d.digs||[])if([q.x,q.z,q.r,q.depth].every(Number.isFinite)){const edit=g.addDig(q.x,q.z,q.r,q.depth,q.soilUnits===1?1:0);if(edit)edit.material=q.material==='sand'?'sand':'soil';}
    world.harvestState=new Map(d.harvestState||[]);
    world.chopped=new Set(d.chopped||[]);world.oreTaken=new Set(d.oreTaken||[]);world.oreShown=new Set(d.oreShown||[]);
    Object.assign(state,{started:true,dead:false,paused:false,hp:clamp(d.hp,1,100),hunger:clamp(d.hunger??100,0,100),stamina:clamp(d.stamina??100,0,100),breath:100,sel:d.version===4?clamp(d.sel||0,0,8):0,days:d.days||0,cyclePhase:clamp(d.phase,0,1),time:d.time||0,lastTomDay:d.lastTomDay??-1,lore:(d.lore||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<fragments.length),claimed:d.claimed||[],toolCooldown:0});
    if(d.version===4)items.restore(d.items);else {
      const legacyIndex=d.sel,legacyId=['hand','club','axe','pick','stoneAxe','sword','iron','gold','shovel','knife','torch'][legacyIndex];
      items.restore(items.migrate(d));
      const index=items.slots.findIndex(s=>items.defs[s?.id]?.weaponId===legacyId);if(index>=0){const quick=items.wield(index,0);state.sel=quick===false?0:quick;}
      // Preserve the original valid input before the first migrated autosave.
      try{localStorage.setItem(SAVE_KEY+'-legacy-backup',localStorage.getItem(SAVE_KEY));}catch(e){console.warn('Legacy backup unavailable',e.message);}
    }
    Object.assign(g.weather,d.weather||{});player.pos.fromArray(d.position);player.vel.set(0,0,0);player.yaw=d.yaw||0;player.pitch=clamp(d.pitch||0,-1.5,1.5);
    for(const s of d.structures)addStructure(s);g.updateChunks(player.pos.x,player.pos.z);g.updateCaveStream();player.pos.y=Math.max(player.pos.y,groundHeightAt(player.pos.x,player.pos.z));g.resolveCollision(player.pos,player.radius);resolveBuildCollision(player.pos,player.radius);
    camera.position.set(player.pos.x,player.pos.y+CFG.playerHeight,player.pos.z);camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
    for(const t of (d.torches||[]).slice(-8))g.placeTorch(t,true);
    g.restorePhysical(d.physical);
    g.updateHotbar();g.updateToolView();dom.story.classList.add('hidden');AudioFX.resume();lockPointer();spawnPOIs();showToast('Your camp remains · welcome back',2500);
  }
  function renderExtraRecipes(scope){
    for(const recipe of Object.values(items.defs).filter(d=>d.cost&&!d.weaponId&&(scope==='bench'?d.bench:!d.bench))){
      const row=document.createElement('div');row.className='recipe';row.innerHTML=`<div><div class="r-name">${inventoryUI.icon(recipe.id)} ${recipe.name}${recipe.output?' ×'+recipe.output:''}</div><div class="r-cost">${Object.entries(recipe.cost).map(([k,v])=>`${inventoryUI.icon(k)} ${items.count(k)} / ${v}`).join(' · ')}</div><div class="r-desc">${recipe.description}${recipe.bench?' · WORKBENCH REQUIRED':''}</div></div>`;
      const b=document.createElement('button');b.className='r-btn';const allowed=affordable(recipe)&&(!recipe.bench||nearStructure('workbench',5));b.disabled=!allowed;b.textContent=allowed?'CRAFT':'NEED MATERIALS';b.onclick=()=>{if(!state.started||state.dead||dom.craft.classList.contains('hidden')||recipe.bench&&(scope!=='bench'||!nearStructure('workbench',5)))return;if(!items.transaction(recipe.cost,{[recipe.id]:recipe.output||1}))return;AudioFX.play('craft');showToast(recipe.name+' crafted',1600);g.renderCraftList();saveGame(false);};row.append(b);dom.craftList.append(row);
    }
  }
  $('build-close').onclick=()=>hideOverlay('build-overlay');$('journal-close').onclick=()=>hideOverlay('journal-overlay');$('storage-close').onclick=()=>hideOverlay('storage-overlay');$('save-button').onclick=()=>saveGame(true);$('continue-button').onclick=loadGame;
  $('continue-button').hidden=!readSave();window.addEventListener('pagehide',()=>saveGame(false));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame(false);});
  return {industry,build,BUILD_PARTS,nearStructure,toggleBuild,chooseBuild,cancelBuild,confirmBuild,updateBuildPreview,resolveBuildCollision,dismantleStructure,useWorldObject,openJournal,closeCampOverlay,clearCamp,initCamp,updateCamp,updateCampHUD,interactionText,minimapExtras,renderExtraRecipes,saveGame,loadGame,serialize,readSave,addStructure,removeStructure,aimedStructure,pushFromPOI,sheltered,renderStorage,get storageTarget(){return storageTarget;}};
}
