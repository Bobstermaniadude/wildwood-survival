const {chromium}=require(process.env.APPDATA+'/npm/node_modules/@playwright/cli/node_modules/playwright-core');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}});
  await p.goto('http://127.0.0.1:8087/?qa=manual',{waitUntil:'networkidle',timeout:45000});
  await p.waitForFunction(()=>!!window.gameQA&&document.getElementById('boot').classList.contains('hidden'));
  await p.click('#start-button');
  const closeAll=()=>p.evaluate(()=>{for(const o of document.querySelectorAll('.overlay'))if(o.id!=='story-overlay')o.classList.add('hidden');gameQA.state.paused=false;});
  const render=()=>p.evaluate(()=>{const g=gameQA;g.renderer.render(g.scene,g.camera);});
  // CSS animations need frames on this no-rAF QA page; pump rAF then render
  const settle=()=>p.evaluate(()=>new Promise(res=>{let n=0;const f=()=>{if(++n>60)res();else requestAnimationFrame(f);};requestAnimationFrame(f);})).then(render);
  await closeAll();await render();
  await p.evaluate(()=>gameQA.openCraft());
  await settle();
  await p.screenshot({path:'.freebuff/menu-field.jpg',type:'jpeg',quality:85});
  await closeAll();await render();
  await p.evaluate(()=>{const g=gameQA,pl=g.player.pos;g.survival.addStructure({kind:'workbench',x:pl.x+2,y:g.groundHeightAt(pl.x+2,pl.z),z:pl.z});g.state.inv.wood=12;g.state.inv.stone=8;g.state.inv.iron=10;g.openCraft('bench');});
  await settle();
  await p.screenshot({path:'.freebuff/menu-bench.jpg',type:'jpeg',quality:85});
  await closeAll();await render();
  await p.evaluate(()=>{gameQA.state.inv.wood=24;gameQA.state.inv.stone=11;});
  await p.keyboard.press('i');
  await settle();
  await p.screenshot({path:'.freebuff/menu-inventory.jpg',type:'jpeg',quality:85});
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
