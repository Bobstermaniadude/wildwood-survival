const {chromium}=require(process.env.APPDATA+'/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}}),checks=[],errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('http://127.0.0.1:8087/?qa=manual',{waitUntil:'networkidle',timeout:45000});
  await p.waitForFunction(()=>!!window.gameQA&&document.getElementById('boot').classList.contains('hidden'));
  await p.click('#start-button');
  const results=await p.evaluate(()=>{
   const g=gameQA,checks=[],check=(name,ok,data)=>checks.push({name,ok:!!ok,data});
   g.openPause();g.state.paused=false;
   check('POIs spawned',g.world.pois.length>0,g.world.pois.length);
   // visit fresh cells until a cairn (type 2) POI has spawned, so every type is covered
   for(let tries=0;tries<5&&!g.world.pois.some(q=>q.type%3===2);tries++){
    g.player.pos.x+=170;g.player.pos.z+=170;
    g.player.pos.y=g.groundHeightAt(g.player.pos.x,g.player.pos.z);
    g.survival.updateCamp(0);
   }
   const rects={0:[[-1.4,0,.12,1.55,2.6],[0,1.4,1.55,.12,2.2]],1:[[-1.8,0,1.4,.3,.55]],2:[[0,0,.78,.68,1.75]]};
   // approach each distinct POI type head-on at its main solid rect
   for(const type of [0,1,2]){
    const poi=g.world.pois.find(q=>q.type%3===type);
    if(!poi){checks.push({name:'POI type '+type+' present',ok:false,data:'missing'});continue;}
    const [cx,cz,hx,hz,top]=rects[type][0];
    const startX=poi.x+cx-(hx+g.CFG.playerRadius+0.35);
    g.player.pos.set(startX,g.groundHeightAt(startX,poi.z+cz),poi.z+cz);
    g.player.vel.set(0,0,0);
    g.player.yaw=-Math.PI/2;g.player.pitch=0; // facing +X
    g.camera.position.set(g.player.pos.x,g.player.pos.y+g.CFG.playerHeight,g.player.pos.z);
    g.camera.rotation.set(0,g.player.yaw,0,'YXZ');
    g.input.keys.add('KeyW');g.input.forward=true;
    for(let i=0;i<60;i++)g.updatePlayer(0.033);
    g.input.keys.delete('KeyW');g.input.forward=false;
    const plane=poi.x+cx; // far face of the obstacle
    const blocked=g.player.pos.x<plane+hx-0.05;
    check('blocks player: '+['shack wall','camp log','cairn'][type],blocked,{x:g.player.pos.x,plane});
    const reach=Math.hypot(g.player.pos.x-poi.x,g.player.pos.z-poi.z);
    // walkable standing spot on the open side must satisfy the claim radius
    g.player.pos.set(poi.x+2.2,g.groundHeightAt(poi.x+2.2,poi.z),poi.z);
    const reachOpen=Math.hypot(g.player.pos.x-poi.x,g.player.pos.z-poi.z);
    check('memo reachable after blocking: '+type,reachOpen<3.5,{blockedSide:reach,openSide:reachOpen});
   }
   // regression: player-built wall still blocks
   g.player.yaw=0;g.state.inv.wood=20;
   const s=g.survival;
   const savedStructures=g.world.structures.length;
   const wall=s.addStructure({kind:'wall',x:g.player.pos.x,g:0,z:g.player.pos.z-2,y:g.player.pos.y,rotation:0});
   g.input.keys.add('KeyW');g.input.forward=true;
   for(let i=0;i<40;i++)g.updatePlayer(0.033);
   g.input.keys.delete('KeyW');g.input.forward=false;
   check('built wall still blocks',g.player.pos.z>wall.z-0.1,{z:g.player.pos.z,wallZ:wall.z});
   // claiming a POI still works from blocked distance
   const poi=g.world.pois.find(q=>!q.claimed&&q.type%3===0);
   if(poi){
    g.player.pos.set(poi.x-2.2,g.groundHeightAt(poi.x-2.2,poi.z),poi.z);
    g.player.yaw=0;g.player.pitch=-0.2;g.camera.position.set(g.player.pos.x,g.player.pos.y+g.CFG.playerHeight,g.player.pos.z);g.camera.rotation.set(-0.2,0,0,'YXZ');
    const used=s.useWorldObject();
    check('POI claim + journal opens',used&&g.state.lore.includes(poi.type)&&!document.getElementById('journal-overlay').classList.contains('hidden'));
    s.closeCampOverlay();
   }
   return checks;
  });
  const r={checks:results,errors};
  fs.writeFileSync('.freebuff/poi-qa-results.json',JSON.stringify(r,null,2));
  console.log(JSON.stringify(r,null,2));
  if(results.some(c=>!c.ok)||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
