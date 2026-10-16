from pathlib import Path
import shutil,wave,math,random,struct
root=Path('assets/audio');w=Path('.freebuff/downloads/audio/world');ui=Path('.freebuff/downloads/audio/ui/Audio')
selected={'step-grass-1':'footstep_01','step-grass-2':'footstep_02','step-wood-1':'footstep_wood_01','step-wood-2':'footstep_wood_02','wood-hit-1':'wood_hit_01','wood-hit-2':'wood_hit_02','stone-1':'stones_01','metal-hit-1':'metal_hit_01','metal-1':'metal_01','hit-1':'hit_01','hit-2':'hit_02','swing':'air_01','thunder':'thunder_01'}
for dest,src in selected.items():shutil.copyfile(w/('sfx100v2_'+src+'.ogg'),root/(dest+'.ogg'))
for dest,src in {'ui':'click_001','pickup':'drop_001','craft':'confirmation_002','equip':'select_002','lore':'confirmation_001','empty':'error_001','power':'switch_001','smelt':'glass_001'}.items():shutil.copyfile(ui/(src+'.ogg'),root/(dest+'.ogg'))
# Original CC0 layered noise/foley synthesis. Distinct resonances, envelopes, grit and granular pulses,
# not identical oscillators used as impacts. These supplement downloaded actual impact/footstep samples.
random.seed(1337);rate=22050
spec={}
for surface,freq,decay,grit in [('soil',380,9,.7),('sand',1300,7,.85),('stone',1900,20,.4),('snow',2600,8,.95),('cave',760,6,.5)]:
 for i in (1,2):spec[f'step-{surface}-{i}']=(.27,freq*(1+.06*i),decay,grit)
spec.update({'dig-soil':(.5,340,5,.9),'dig-sand':(.55,1500,4,.95),'fill':(.7,450,3,.9),'bow':(.3,180,15,.35),'draw':(.45,1700,4,.5),'arrow-impact':(.23,1800,18,.3),'hurt':(.35,160,7,.65),'death':(1.4,100,2,.7),'husk':(.85,85,2,.65),'husk-death':(1.1,65,3,.7),'crawler':(.6,2900,5,.85),'crawler-death':(.75,1600,4,.9),'pig':(.45,230,5,.75),'deer':(.55,440,4,.6),'animal-death':(.7,180,4,.7),'boss-cue':(1.6,48,1.6,.55),'boss-death':(2.7,62,1.2,.65),'eat':(.35,1000,8,.9),'furnace':(.55,280,5,.8),'land':(.4,130,10,.85),'jump':(.18,700,12,.9),'heart':(.35,65,14,.1),'tree-fall':(1.7,240,2,.95),'berry':(.4,1900,7,.9),'wind':(8,160,0,1),'rain':(8,2500,0,1),'cave-air':(8,90,0,1),'fire':(8,1200,0,1)})
for name,(dur,freq,decay,grit) in spec.items():
 n=int(rate*dur);values=[];low=0
 for i in range(n):
  t=i/rate;noise=random.uniform(-1,1);low+=(noise-low)*min(.9,freq/rate*4);env=math.exp(-decay*t)*(min(1,t/.012))
  if decay==0:env=min(1,t/.4,(dur-t)/.4)*(.65+.2*math.sin(t*.7))
  pulse=1
  if name.startswith('crawler'):pulse=.2+.8*max(0,math.sin(t*80))**8
  voiced=math.sin(2*math.pi*freq*t*(1-.12*t/dur))*(.55+.2*math.sin(t*24))
  value=(low*grit+voiced*(1-grit))*env*pulse
  if name=='fire' and random.random()<.0008:value+=random.uniform(-.5,.5)
  values.append(max(-1,min(1,value*.6)))
 with wave.open(str(root/(name+'.wav')),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(b''.join(struct.pack('<h',int(v*32767)) for v in values))
# Archives are development resources, not runtime assets.
for name in ('world.zip','ui.zip'):shutil.move(str(root/name),str(Path('.freebuff/downloads/audio')/name))
print('Runtime audio files:',len(list(root.iterdir())))
