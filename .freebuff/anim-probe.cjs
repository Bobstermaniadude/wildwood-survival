const {chromium}=require(process.env.APPDATA+'/npm/node_modules/@playwright/cli/node_modules/playwright-core');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}});
  await p.goto('http://127.0.0.1:8087/?qa=manual',{waitUntil:'networkidle',timeout:45000});
  await p.waitForFunction(()=>!!window.gameQA&&document.getElementById('boot').classList.contains('hidden'));
  await p.click('#start-button');
  await p.evaluate(()=>{for(const o of document.querySelectorAll('.overlay'))if(o.id!=='story-overlay')o.classList.add('hidden');gameQA.state.paused=false;gameQA.openCraft();});
  const samples=[];
  for(const ms of [0,200,400,800,1500,2500]){
   if(ms)await p.waitForTimeout(ms-samples.at(-1)?.t||ms);
   const v=await p.evaluate(()=>{const el=document.getElementById('craft-overlay');const cs=getComputedStyle(el);const anims=el.getAnimations().map(a=>({state:a.playState,time:a.currentTime,duration:a.effect.getTiming().duration}));return{opacity:cs.opacity,anims};});
   samples.push({t:ms,...v});
  }
  console.log(JSON.stringify(samples,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
