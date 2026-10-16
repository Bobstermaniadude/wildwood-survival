const {chromium}=require(process.env.APPDATA+'/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:8087/?qa=manual',{waitUntil:'networkidle',timeout:45000});
  await page.waitForFunction(()=>!!window.gameQA&&document.getElementById('boot').classList.contains('hidden'));
  await page.click('#start-button');
  const checks=await page.evaluate(()=>{
   const g=gameQA,s=g.survival,checks=[],check=(name,ok,data)=>checks.push({name,ok:!!ok,data});
   g.openPause();check('dry plains spawn',g.player.pos.y>g.CFG.waterLevel+1&&g.biomeAt(g.player.pos.x,g.player.pos.z,g.player.pos.y)==='plains');
   const p=g.player.pos.clone();g.player.yaw=0;g.player.pitch=-.1;g.camera.rotation.set(-.1,0,0,'YXZ');g.state.paused=false;
   for(const [name,spawn,get,hp] of [['animal',()=>g.spawnMob(p.x,p.z-2,'pig'),()=>g.world.mobs.at(-1),8],['crawler',()=>g.spawnCrawler(p.x,p.y,p.z-2),()=>g.world.crawlers.at(-1),6],['husk',()=>g.spawnHusk(p.x,p.z-2),()=>g.world.husks.at(-1),14],['boss',()=>g.spawnTomPearl(p.x,p.z-2),()=>g.world.tomPearl,178]]){
    spawn();const e=get();e.group.position.y=p.y;g.state.toolCooldown=0;g.swingWeapon();check(name+' weapon dispatch',e.hp===hp,e.hp);
    if(name==='animal'){const dir=e.dir;g.updateMobs(.01);check('stable flee heading',Math.abs(e.dir-dir)<.01);}
    e.group.removeFromParent();if(name==='animal')g.world.mobs.length=0;if(name==='crawler')g.world.crawlers.length=0;if(name==='husk')g.world.husks.length=0;if(name==='boss')g.world.tomPearl=null;
   }
   g.updateFeedback(.3);check('transient feedback expires',g.feedback.impacts.size===0&&g.feedback.hit===0);
   g.openPause();g.state.inv.wood=80;g.state.inv.stone=40;
   for(let i=0;i<24;i++){g.player.yaw=i*Math.PI/12;s.chooseBuild(0);if(s.build.valid)break;}
   const wood=g.state.inv.wood;s.confirmBuild();check('foundation exact cost',g.world.structures.length===1&&wood-g.state.inv.wood===4);const f=g.world.structures[0];s.cancelBuild();
   check('workbench gate enforced',!g.canCraft({bench:true,cost:{wood:1}}));
   s.addStructure({kind:'workbench',x:p.x+2,y:p.y,z:p.z});check('workbench unlock',g.canCraft({bench:true,cost:{wood:1}}));g.craftWeapon(4);check('advanced tool craft',g.state.crafted.has('stoneAxe'));
   const door=s.addStructure({kind:'door',x:f.x,y:f.y+.26,z:f.z-1.5});const q=p.clone().set(door.x,door.y,door.z);g.resolveBuildCollision(q,.55);check('closed door collision',Math.abs(q.z-door.z)>.5);door.open=true;q.set(door.x,door.y,door.z);g.resolveBuildCollision(q,.55);check('open door passage',Math.abs(q.z-door.z)<.01);
   s.addStructure({kind:'chest',x:p.x,y:p.y,z:p.z-2});
   g.state.paused=false;g.state.hp=50;g.state.hunger=40;g.state.inv.cooked=1;g.eatFood();check('cooked food restores vitals',g.state.hp===64&&g.state.hunger===95);
   g.state.crafted.add('torch');const before=g.state.inv.wood;g.placeTorch({x:p.x+3,z:p.z});check('torch consumes one wood',g.world.torches.length===1&&g.state.inv.wood===before-1);
   s.openJournal(3);check('journal discovery',g.state.lore.includes(3));s.closeCampOverlay();g.openPause();s.saveGame(false);check('bounded save schema',s.readSave().structures.length===4&&localStorage.getItem('wildwood-run-v2').length<20000);
   g.state.paused=false;const yaw=g.player.yaw;document.querySelector('#scene-container canvas').dispatchEvent(new MouseEvent('mousedown',{button:2,clientX:100,clientY:100,bubbles:true}));document.dispatchEvent(new MouseEvent('mousemove',{clientX:140,clientY:100}));document.dispatchEvent(new MouseEvent('mouseup',{button:2}));check('drag look uses real mouse coordinates',Math.abs(g.player.yaw-yaw+.088)<.001);
   window.dispatchEvent(new Event('blur'));check('blur pauses input',g.state.paused&&g.input.keys.size===0);return checks;
  });
  await page.reload({waitUntil:'networkidle'});await page.click('#continue-button');
  checks.push(await page.evaluate(()=>({name:'continue restores camp/lore/torches/tools',ok:gameQA.world.structures.length===4&&gameQA.world.torches.length===1&&gameQA.state.lore.includes(3)&&gameQA.state.crafted.has('stoneAxe')})));
  await page.evaluate(()=>{const g=gameQA;g.state.paused=false;g.state.cyclePhase=.25;g.updateCycle(0);g.updateAll(.01);g.renderer.render(g.scene,g.camera);});
  await page.screenshot({path:'.freebuff/final-game.png'});
  await page.evaluate(()=>{gameQA.openPause();});
  const report={checks,errors};fs.writeFileSync('.freebuff/qa-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(checks.some(c=>!c.ok)||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
