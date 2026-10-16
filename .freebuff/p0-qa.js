async page => {
 const failures=[]; const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const result=await page.evaluate(()=>{
  const g=gameQA, checks=[]; const check=(name,ok,details)=>checks.push({name,ok,details});
  g.openPause(); g.resetGame(); g.openPause();
  check('dry spawn',g.player.pos.y>g.CFG.waterLevel+1);
  check('reset clears transients',g.feedback.impacts.size===0 && g.feedback.hit===0);
  const base=g.player.pos.clone(); g.player.yaw=0; g.player.pitch=-0.1; g.camera.rotation.set(-0.1,0,0,'YXZ');
  g.camera.position.set(base.x,base.y+1.7,base.z);
  g.world.mobs.length=0; g.world.crawlers.length=0; g.world.husks.length=0;
  g.spawnMob(base.x,base.z-2,'deer');const m=g.world.mobs[0];m.group.position.y=base.y;
  g.state.paused=false;g.swingWeapon();
  check('animal weapon hit',m.hp===8,m.hp); const dir=m.dir;g.updateMobs(0.01);g.updateMobs(0.01);
  check('stable flee',Math.abs(m.dir-dir)<0.01);check('correct animal heading',Math.abs(m.group.rotation.y-(m.dir-Math.PI/2))<0.001);
  g.world.mobs.forEach(e=>e.group.removeFromParent());g.world.mobs.length=0;
  g.spawnCrawler(base.x,base.y,base.z-2);const cr=g.world.crawlers[0];g.state.toolCooldown=0;g.swingWeapon();
  check('crawler weapon hit',cr.hp===6,cr.hp);
  g.world.crawlers.forEach(e=>e.group.removeFromParent());g.world.crawlers.length=0;
  g.spawnHusk(base.x,base.z-2);const h=g.world.husks[0];h.group.position.y=base.y;g.state.toolCooldown=0;g.swingWeapon();check('husk weapon hit',h.hp===10,h.hp);
  g.world.husks.forEach(e=>e.group.removeFromParent());g.world.husks.length=0;
  g.spawnTomPearl(base.x,base.z-2);const t=g.world.tomPearl;t.group.position.y=base.y;g.state.toolCooldown=0;g.swingWeapon();check('boss weapon hit',t.hp===178,t.hp);
  for(let i=0;i<30;i++)g.updateAll(0.01);
  check('damage flash restores',g.feedback.impacts.size===0);
  g.openPause();const hp=g.state.hp;g.updateAll(1);check('pause freezes survival',g.state.hp===hp);
  g.resetGame();g.resetGame();check('double restart clean',g.world.husks.length===0&&g.world.crawlers.length===0&&g.world.torches.length===0);
  g.openPause();return checks;
 });
 for(const r of result)if(!r.ok)failures.push(r.name+': '+r.details);
 console.log(JSON.stringify({checks:result,errors},null,2));
 if(failures.length||errors.length)throw Error([...failures,...errors].join('\n'));
}
