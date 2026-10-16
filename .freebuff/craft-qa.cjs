const {chromium}=require(process.env.APPDATA+'/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('http://127.0.0.1:8087/?qa=manual',{waitUntil:'networkidle',timeout:45000});
  await p.waitForFunction(()=>!!window.gameQA&&document.getElementById('boot').classList.contains('hidden'));
  await p.click('#start-button');
  const checks=await p.evaluate(()=>{
   const g=gameQA,checks=[],check=(name,ok,data)=>checks.push({name,ok:!!ok,data});
   const closeAll=()=>{for(const o of document.querySelectorAll('.overlay'))if(o.id!=='story-overlay')o.classList.add('hidden');g.state.paused=false;};
   const rows=()=>[...document.querySelectorAll('#craft-list .recipe .r-name')].map(e=>e.textContent);
   const key=(code,up)=>window.dispatchEvent(new KeyboardEvent(up?'keyup':'keydown',{code}));
   // --- field crafting menu (no workbench nearby) ---
   closeAll();g.openCraft();
   check('field menu opens via C path',!document.getElementById('craft-overlay').classList.contains('hidden')&&g.state.paused);
   check('field menu hides advanced recipes',!rows().some(t=>t.includes('STONE AXE'))&&!rows().some(t=>t.includes('STONE SWORD'))&&!rows().some(t=>t.includes('IRON BLADE')),rows());
   check('field menu shows basics',rows().some(t=>t.includes('WOOD CLUB'))&&rows().some(t=>t.includes('WOOD AXE'))&&rows().some(t=>t.includes('STONE PICKAXE'))&&rows().some(t=>t.includes('TORCH')));
   check('field menu shows dressing, not armor',rows().some(t=>t.includes('Field dressing'))&&!rows().some(t=>t.includes('Hide-lined armor')));
   check('field menu explains bench lock',document.querySelector('#craft-list .craft-note')?.textContent.includes('WORKBENCH ONLY'));
   check('field menu title',document.getElementById('craft-tag').textContent.includes('FIELD'));
   // craft a basic item from the field menu via its button
   closeAll();g.state.inv.wood=20;g.openCraft();
   const club=[...document.querySelectorAll('#craft-list .recipe')].find(r=>r.textContent.includes('WOOD CLUB'));
   club.querySelector('.r-btn').click();
   check('field crafting deducts resources',g.state.crafted.has('club')&&g.state.inv.wood===17,{wood:g.state.inv.wood,crafted:g.state.crafted.has('club')});
   // --- bench menu ---
   closeAll();
   const pl=g.player.pos;
   g.survival.addStructure({kind:'workbench',x:pl.x+2,y:g.groundHeightAt(pl.x+2,pl.z),z:pl.z});
   g.openCraft('bench');
   check('bench menu shows advanced recipes',rows().some(t=>t.includes('STONE AXE'))&&rows().some(t=>t.includes('STONE SWORD'))&&rows().some(t=>t.includes('IRON BLADE'))&&rows().some(t=>t.includes('GOLD BLADE')));
   check('bench menu shows armor',rows().some(t=>t.includes('Hide-lined armor')));
   check('bench menu has advanced section',!!document.querySelector('#craft-list .craft-section'));
   check('bench menu keeps basics',rows().some(t=>t.includes('WOOD CLUB')));
   check('bench menu title',document.getElementById('craft-tag').textContent.includes('WORKBENCH'));
   closeAll();g.openCraft();
   check('C near bench auto-opens bench menu',document.getElementById('craft-tag').textContent.includes('WORKBENCH'),document.getElementById('craft-tag').textContent);
   // advanced craft actually possible at bench
   closeAll();g.state.inv.wood=20;g.state.inv.stone=20;g.openCraft('bench');
   const axe=[...document.querySelectorAll('#craft-list .recipe')].find(r=>r.textContent.includes('STONE AXE'));
   const axeBtn=axe.querySelector('.r-btn');const couldCraft=!axeBtn.disabled;axeBtn.click();
   check('bench craft unlocks stone axe',couldCraft&&g.state.crafted.has('stoneAxe'),{couldCraft});
   // --- inventory keybind ---
   closeAll();
   key('KeyI');const inv=document.getElementById('inventory-overlay');
   check('I opens inventory and pauses',!inv.classList.contains('hidden')&&g.state.paused);
   const invRows=[...document.querySelectorAll('#inventory-list .inv-row')];
   check('inventory lists all 7 resources',invRows.length===7,invRows.length);
   const woodRow=invRows.find(r=>r.textContent.includes('WOOD'));
   check('inventory shows live wood count',woodRow?.querySelector('i').textContent===String(g.state.inv.wood),{shown:woodRow?.querySelector('i').textContent,actual:g.state.inv.wood});
   key('KeyI',false);key('KeyI',true);
   check('second I closes inventory',inv.classList.contains('hidden')&&!g.state.paused);
   // Esc closes it too (simulate released pointer)
   key('KeyI');g.input.pointerLocked=false;g.input.unlockedAt=-1000;
   key('Escape');
   check('Esc closes inventory',inv.classList.contains('hidden')&&!g.state.paused);
   key('KeyI',true);key('Escape',true);
   // death hides inventory
   closeAll();key('KeyI');g.state.paused=false;g.state.hp=1;g.damagePlayer(5,'QA');
   check('death closes inventory',g.state.dead&&inv.classList.contains('hidden'));
   g.resetGame();
   check('restart clean',!g.state.dead&&inv.classList.contains('hidden'));
   return checks;
  });
  const r={checks,errors};
  fs.writeFileSync('.freebuff/craft-qa-results.json',JSON.stringify(r,null,2));
  console.log(JSON.stringify(r,null,2));
  if(checks.some(c=>!c.ok)||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
