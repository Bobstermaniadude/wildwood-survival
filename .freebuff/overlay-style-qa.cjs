const {chromium}=require(process.env.APPDATA+'/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('http://127.0.0.1:8087/?qa=manual',{waitUntil:'networkidle',timeout:45000});
  await p.waitForFunction(()=>!!window.gameQA&&document.getElementById('boot').classList.contains('hidden'));
  await p.click('#start-button');
  // CSS animations are frame-driven; pump rAF so a no-loop QA page advances them
  const settle=()=>p.evaluate(()=>new Promise(res=>{let n=0;const f=()=>{if(++n>60)res();else requestAnimationFrame(f);};requestAnimationFrame(f);}));
  const style=sel=>p.evaluate(s=>{const el=document.getElementById(s);const cs=getComputedStyle(el);const r=el.getBoundingClientRect();const inner=el.firstElementChild;const innerCs=inner?getComputedStyle(inner):null;return{hidden:el.classList.contains('hidden'),display:cs.display,opacity:cs.opacity,z:cs.zIndex,w:r.width,h:r.height,innerOpacity:innerCs?innerCs.opacity:null,visible:r.width>100&&r.height>100};},sel);
  const closeAll=()=>p.evaluate(()=>{for(const o of document.querySelectorAll('.overlay'))if(o.id!=='story-overlay')o.classList.add('hidden');gameQA.state.paused=false;});
  const checks=[],check=(name,ok,data)=>checks.push({name,ok:!!ok,data});
  await closeAll();
  await p.evaluate(()=>gameQA.openCraft());
  await settle();
  const s1=await style('craft-overlay');
  const title1=await p.evaluate(()=>({tag:document.getElementById('craft-tag').textContent,title:document.getElementById('craft-title').textContent,rows:[...document.querySelectorAll('#craft-list .r-name')].map(e=>e.textContent)}));
  check('field overlay painted',s1.visible&&s1.display==='flex'&&+s1.opacity>=0.99&&+s1.innerOpacity>=0.99,s1);
  check('field title+rows correct',title1.tag.includes('FIELD')&&title1.title.includes('FIELD')&&!title1.rows.some(t=>t.includes('STONE AXE')),title1.rows);
  await closeAll();
  await p.evaluate(()=>{const g=gameQA,pl=g.player.pos;g.survival.addStructure({kind:'workbench',x:pl.x+2,y:g.groundHeightAt(pl.x+2,pl.z),z:pl.z});g.openCraft('bench');});
  await settle();
  const s2=await style('craft-overlay');
  const title2=await p.evaluate(()=>({tag:document.getElementById('craft-tag').textContent,rows:[...document.querySelectorAll('#craft-list .r-name')].map(e=>e.textContent),section:!!document.querySelector('.craft-section')}));
  check('bench overlay painted',s2.visible&&s2.display==='flex'&&+s2.opacity>=0.99&&+s2.innerOpacity>=0.99,s2);
  check('bench title+advanced correct',title2.tag.includes('WORKBENCH')&&title2.section&&title2.rows.some(t=>t.includes('IRON BLADE')),title2.rows);
  await closeAll();
  await p.keyboard.press('i');
  await settle();
  const s3=await style('inventory-overlay');
  const invTitle=await p.evaluate(()=>({title:document.getElementById('inventory-title').textContent,rows:document.querySelectorAll('#inventory-list .inv-row').length}));
  check('inventory overlay painted',s3.visible&&s3.display==='flex'&&+s3.opacity>=0.99&&+s3.innerOpacity>=0.99,s3);
  check('inventory title+7 rows',invTitle.title.includes('CARRY')&&invTitle.rows===7,invTitle);
  const r={checks,errors};
  fs.writeFileSync('.freebuff/overlay-style-qa-results.json',JSON.stringify(r,null,2));
  console.log(JSON.stringify(r,null,2));
  if(checks.some(c=>!c.ok)||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
