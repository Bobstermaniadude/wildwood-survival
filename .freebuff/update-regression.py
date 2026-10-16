from pathlib import Path
p=Path('.freebuff/overhaul-regression.cjs');s=p.read_text(encoding='utf-8')
s=s.replace("ck('cave entrance works',g.useCaveEntrance()&&g.player.pos.y<c.y+5);", "g.player.yaw=Math.PI;g.input.forward=true;for(let n=0;n<400;n++)g.updatePlayer(.016);g.input.forward=false;ck('walk-in cave entrance works',g.player.pos.y<c.y+5&&g.player.pos.z>c.endZ);")
s=s.replace("ck('ladder returns to surface',g.useCaveEntrance()&&g.player.pos.y>c.y+5);", "g.player.yaw=0;g.input.forward=true;for(let n=0;n<500;n++)g.updatePlayer(.016);g.input.forward=false;ck('walkable ramp returns to surface',g.player.pos.y>c.y+5&&g.player.pos.z<c.entranceZ);")
p.write_text(s,encoding='utf-8')
