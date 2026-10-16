from pathlib import Path
p=Path('index.html');s=p.read_text(encoding='utf-8')
a=s.index('  // ceiling dome + walls (BackSide: seen from inside)');b=s.index('  // rich ore veins on the cave floor',a)
s=s[:a]+'''  caveTopology.build(c,g,MAT.rock);
  c.light=null;
'''+s[b:]
a=s.index('function nearbyCaveEntrance(){');b=s.index('function disposeCave(c)',a)
s=s[:a]+'''function nearbyCaveEntrance(){return world.caves.find(c=>dist2D(player.pos.x,player.pos.z,c.entranceX,c.entranceZ)<8||caveTopology.inside(player.pos)===c);}
function caveEntranceText(){const c=nearbyCaveEntrance();return c?'SURVEY RIDGE · WALK THROUGH THE ROCK ARCH · FOLLOW THE RAMP':'';}
function useCaveEntrance(){return false;} // Access is continuous movement, never a teleport.
'''+s[b:]
a=s.index('const AudioFX = {');b=s.index('// ---- day / night ----',a)
s=s[:a]+'''const AudioFX=createAudio({state,world,player,weather:()=>weather,surfaceMaterialAt,cave:()=>!!caveTopology?.inside(player.pos),sheltered:()=>survival.sheltered()});

'''+s[b:]
p.write_text(s,encoding='utf-8')
