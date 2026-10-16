from pathlib import Path
out=Path('assets/icons');out.mkdir(exist_ok=True)
shapes={
'wood':'<path fill="#94714d" d="M12 19l29-7 12 25-29 12z"/><ellipse fill="#c4a278" cx="21" cy="35" rx="11" ry="14" transform="rotate(-22 21 35)"/><path d="M17 28q14-4 11 12M34 18l10 23M40 16l10 24"/>',
'stone':'<path fill="#87918c" d="M10 42l6-22 22-8 17 20-8 19H23z"/><path d="M16 20l15 15 24-3M31 35l-8 16M38 12l-7 23"/>',
'soil':'<path fill="#806348" d="M9 46l11-14 7 3 10-16 18 27z"/><path d="M18 45l8-4m8-7l9 9m-18-17l-5-6"/>',
'iron':'<path fill="#a6b3b6" d="M9 36l15-20h26l5 21-16 14H15z"/><path d="M9 36h30l11-20M39 36v15M24 16l-9 35"/>',
'gold':'<path fill="#c6a65c" d="M9 36l15-20h26l5 21-16 14H15z"/><path d="M9 36h30l11-20M39 36v15M24 16l-9 35"/>',
'berries':'<path fill="#70815a" d="M28 24q-13-4-12-17 16-2 18 15Q39 9 52 12q-2 13-17 15"/><circle fill="#a96069" cx="22" cy="34" r="11"/><circle fill="#a96069" cx="42" cy="34" r="11"/><circle fill="#944e59" cx="32" cy="47" r="10"/>',
'meat':'<path fill="#a6685f" d="M15 18q15-10 29 0t8 21q-9 17-28 10T15 18z"/><path fill="#ceaa8d" d="M24 25q11-5 15 5t-5 11q-10-1-10-16z"/><path d="M16 27q-4 13 8 16"/>',
'cooked':'<path fill="#906043" d="M15 18q15-10 29 0t8 21q-9 17-28 10T15 18z"/><path fill="#ccb99a" d="M25 25q10-5 13 6t-6 10q-9-1-7-16z"/><path d="M13 26l10 4m-8 6l9 3m17-19l6 8"/>',
'hide':'<path fill="#a28a63" d="M14 12l14 5 8-1 14-5-4 16 9 13-9 13-12-7-13 7L9 40l11-14z"/><path d="M25 22l-3 15 11 5 10-10M33 18v22"/>',
'fiber':'<path fill="#b2a184" d="M18 16l7-5 8 10 8-8 7 3-10 23-2 14H22l2-16z"/><path d="M21 18l9 20 6-14m-12 15h14m-15 7h13"/>',
'dressing':'<path fill="#c4bca3" d="M10 26l27-13 18 25-30 15z"/><path fill="#975b50" d="M25 28l7-4 4 6 7-4 4 6-7 4 4 6-7 4-4-6-7 4-4-6 7-4z"/>',
'arrow':'<path d="M15 50L46 17" stroke="#bdab84" stroke-width="4"/><path fill="#939e9a" d="M40 16l14-7-4 16z"/><path fill="#b4b49a" d="M12 37l12 1-2 12-12 4z"/><path d="M12 37l10 13"/>',
'bow':'<path fill="none" stroke="#a2865e" stroke-width="6" d="M17 10Q57 32 17 54"/><path stroke="#c0b9a0" d="M17 10v44"/><path d="M39 26v12" stroke="#c0b9a0" stroke-width="6"/>',
'club':'<path fill="#937449" d="M15 53l7-21-1-16 13-9 15 8-1 15-13 11-10 16z"/><path d="M29 16l5 13m7-10l-3 12M21 45l10 4"/>',
'axe':'<path stroke="#a68a62" stroke-width="7" d="M17 54l22-40"/><path fill="#91978d" d="M30 14l6-7 21 10-9 18-17-13z"/><path d="M48 15l-7 17"/>',
'pick':'<path stroke="#a68a62" stroke-width="7" d="M16 53l23-35"/><path fill="#a5ada3" d="M11 15q25-9 46 16l-20-9-13-2z"/>',
'shovel':'<path stroke="#a68a62" stroke-width="6" d="M22 15l17 28"/><path fill="none" d="M15 10l14 1-5 9-9-10z"/><path fill="#929e99" d="M31 37l16-9 10 16-5 13-15-5z"/>',
'knife':'<path fill="#aeb5a7" d="M28 33L49 9l-1 20-14 13z"/><path fill="#886f50" d="M13 49l15-17 8 8-15 17z"/><path d="M24 33l14 11"/>',
'sword':'<path fill="#91988a" d="M28 38L44 9l9-3-1 11-17 27z"/><path fill="#947346" d="M14 52l10-16 11 6-10 16z"/><path d="M19 31l22 14" stroke="#b2a184" stroke-width="5"/>',
'ironBlade':'<path fill="#b5bfbb" d="M28 38L44 9l9-3-1 11-17 27z"/><path fill="#77634c" d="M14 52l10-16 11 6-10 16z"/><path d="M19 31l22 14" stroke="#a9a189" stroke-width="5"/>',
'goldBlade':'<path fill="#c7ac62" d="M28 38L44 9l9-3-1 11-17 27z"/><path fill="#77634c" d="M14 52l10-16 11 6-10 16z"/><path d="M19 31l22 14" stroke="#c7ac62" stroke-width="5"/>',
'hand':'<path fill="#ad916d" d="M19 49l-8-15 7-5 7 7V15q5-7 7 1v15-17q6-4 7 2v18-15q6-4 7 3v16l3-10q7-2 7 5l-5 18z"/>',
' torch':'',
'pearlCore':'<circle fill="#d6ccb1" cx="32" cy="32" r="14"/><ellipse fill="none" stroke="#c5a65c" cx="32" cy="32" rx="24" ry="10" transform="rotate(-40 32 32)"/><ellipse fill="none" stroke="#c5a65c" cx="32" cy="32" rx="24" ry="10" transform="rotate(40 32 32)"/><path stroke="#fff2c9" d="M27 24l6-2"/>',
'headSlot':'<path fill="#9b9683" d="M18 42V24q0-17 14-17t14 17v18l-9 9H26z"/><path d="M22 28h20m-16 8h12"/>',
'chestSlot':'<path fill="#9b9683" d="M18 10l14 6 14-6 9 15-11 7v20H20V32l-11-7z"/><path d="M32 18v32M20 32h24"/>',
'legsSlot':'<path fill="#9b9683" d="M18 10h28l5 43H37l-5-25-5 25H13z"/><path d="M18 18h28M32 18v10"/>',
'floor':'<path fill="#a58c61" d="M7 30l27-18 23 16-27 23z"/><path d="M15 34l27-16M22 40l27-17M30 46l26-18"/>',
'wall':'<path fill="#a58c61" d="M12 16l36-6v39l-36 7z"/><path d="M12 24l36-6M12 33l36-6M12 42l36-6M12 51l36-6"/>',
'door':'<path fill="#a58c61" d="M16 10h32v46H16z"/><path d="M24 16v34m8-34v34m8-34v34"/><circle fill="#bbb7a3" cx="40" cy="32" r="3"/>',
'roof':'<path fill="#9c9d92" d="M7 42l25-31 25 31-8 8-17-23-17 23z"/><path d="M18 30l8 7M24 22l8 7m6-6l-7 8"/>',
'chest':'<path fill="#9a7c56" d="M10 25l11-12h32v33L42 53H10z"/><path d="M10 25h32v28m0-28l11-12M10 35h32l11-8"/><path fill="#b6b3a1" d="M27 29h9v13h-9z"/>',
'workbench':'<path fill="#a58c61" d="M7 24l13-9 38 7-13 10z"/><path d="M13 29v23m31-20v23m9-28v18M17 43l26 5" stroke="#a58c61" stroke-width="5"/>',
'campfire':'<path fill="#b89955" d="M30 8q9 11 2 18 15-7 14 6 2 15-15 15T18 29l12-21z"/><path stroke="#978063" stroke-width="7" d="M12 48l40 7M13 55l39-8"/>',
'spikes':'<path fill="#ac956b" d="M9 51l4-32 8 32 10-42 11 42 8-32 5 32z"/><path d="M8 52h49"/>',
'unknown':'<path fill="#899284" d="M11 21l21-12 21 12v25L32 57 11 46z"/><path d="M11 21l21 12 21-12M32 33v24"/>',
'use':'<path fill="#9eaf95" d="M14 34l12 13 27-31-8-7-19 23-6-7z"/>',
'swap':'<path d="M10 23h42l-9-9M54 41H12l9 9" stroke="#bdac80" stroke-width="5"/>',
'close':'<path d="M16 16l32 32m0-32L16 48" stroke="#bdac80" stroke-width="5"/>',
}
shapes.pop(' torch');shapes['torch']='<path stroke="#a68a62" stroke-width="8" d="M21 55l13-31"/><path fill="#c5a564" d="M30 30q-13-6-5-17 1 8 6 5L40 6q3 12 9 18-3 13-19 6z"/>'
shapes['stoneAxe']=shapes['axe']
for target,base in [('hideHood','headSlot'),('ironHood','headSlot'),('hideVest','chestSlot'),('linedVest','chestSlot'),('ironVest','chestSlot'),('pearlVest','chestSlot'),('hideLegs','legsSlot')]:
 shapes[target]=shapes[base].replace('#9b9683','#a58c61' if target.startswith('hide') else '#c5ac67' if target.startswith('pearl') else '#a8b4ad')
for id,shape in shapes.items():
 (out/(id+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"><title>{id}</title><g stroke="#343d38" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">{shape}</g></svg>')
print(len(shapes),'original SVG icons')
