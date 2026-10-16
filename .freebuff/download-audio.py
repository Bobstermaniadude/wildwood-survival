import urllib.request, pathlib, zipfile, json
root=pathlib.Path('assets/audio');root.mkdir(exist_ok=True)
assets=[('forest.mp3','https://opengameart.org/sites/default/files/Forest_Ambience.mp3'),('cave.ogg','https://opengameart.org/sites/default/files/cave%20themeb4.ogg'),('night.ogg','https://opengameart.org/sites/default/files/Dark_Rainy_Night%28ambience%29.ogg'),('boss.wav','https://opengameart.org/sites/default/files/Juhani%20Junkala%20-%20Epic%20Boss%20Battle%20%5BSeamlessly%20Looping%5D.wav'),('world.zip','https://opengameart.org/sites/default/files/sfx_100_v2.zip'),('ui.zip','https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip')]
for name,url in assets:
 p=root/name
 if not p.exists():
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=45) as r:p.write_bytes(r.read())
 print(name,p.stat().st_size,flush=True)
 if name.endswith('.zip'):
  with zipfile.ZipFile(p) as z:
   dest=pathlib.Path('.freebuff/downloads/audio')/name[:-4];dest.mkdir(parents=True,exist_ok=True)
   z.extractall(dest)
   print('\n'.join(z.namelist()),flush=True)
