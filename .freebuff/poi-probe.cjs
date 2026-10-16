const {chromium}=require(process.env.APPDATA+'/npm/node_modules/@playwright/cli/node_modules/playwright-core');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('http://127.0.0.1:8087/?qa=manual',{waitUntil:'networkidle',timeout:45000});
  await p.waitForFunction(()=>!!window.gameQA&&document.getElementById('boot').classList.contains('hidden'));
  await p.click('#start-button');
  const out=await p.evaluate(()=>{
   const g=gameQA;g.openPause();
   for(let tries=0;tries<6&&!g.world.pois.some(q=>q.type%3===2);tries++){g.player.pos.x+=170;g.player.pos.z+=170;g.survival.updateCamp(0);}
   const res=[];
   for(const type of [0,1,2]){
    const poi=g.world.pois.find(q=>q.type%3===type);
    if(!poi){res.push({type,found:false});continue;}
    // push an interior point straight out of the POI anchor
    const pos={x:poi.x,z:poi.z,y:poi.y+0.5};
    g.resolveBuildCollision(pos,0.55);
    const d=Math.hypot(pos.x-poi.x,pos.z-poi.z);
    const expected=[2.07,1.7,1.33][type]; // wall(1.4+.12+.55), log(1.8-? see below), cairn(.78+.55)
    const exp=type===0?2.07:type===1?1.75:1.33;
    res.push({type,found:true,pushedDist:+d.toFixed(3),expected:exp,ok:Math.abs(d-exp)<0.06});
   }
   return {res,errors:[]};
  });
   console.log(JSON.stringify({...out,errors},null,2));
   if(out.res.some(r=>r.found===false||!r.ok)||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
