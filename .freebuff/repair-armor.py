from pathlib import Path
p=Path('items.js');s=p.read_text(encoding='utf-8');a=s.index(' function syncPreview(){');b=s.index(' function closePreview()',a)
s=s[:a]+''' function syncPreview(){if(!preview)return;const p=preview;
  for(const o of [...p.equipment.children]){o.removeFromParent();o.traverse(m=>{if(m.geometry&&!ART.sharedGeometry.has(m.geometry))m.geometry.dispose();if(m.material&&!ART.sharedMaterials.has(m.material))m.material.dispose();});}
  const body=p.body;if(!body)return;const base=p.bodyGeometry,pos=base.attributes.position,normal=base.attributes.normal,skin=base.attributes.skinIndex,weights=base.attributes.skinWeight;
  const indices=base.index?Array.from(base.index.array):Array.from({length:pos.count},(_,i)=>i),regions={head:[],chest:[],legs:[]},keep=[];
  // Region ownership follows the authored rig's actual skin weights, not guessed world-space heights.
  const region=i=>{let best=0,bone='';for(let k=0;k<4;k++){const w=weights.array[i*4+k];if(w>best){best=w;bone=body.skeleton.bones[skin.array[i*4+k]]?.name||'';}}
    if(/Head/.test(bone))return 'head';if(/Spine|Chest/.test(bone))return 'chest';if(/UpLeg|^LeftLeg$|^RightLeg$/.test(bone))return 'legs';return '';};
  for(let i=0;i<indices.length;i+=3){const tri=indices.slice(i,i+3),r=region(tri[0]);if(r&&tri.every(v=>region(v)===r)&&items.equipment[r])regions[r].push(...tri);else keep.push(...tri);}
  body.geometry.setIndex(keep);
  for(const slot of ['head','chest','legs']){const item=items.equipment[slot];if(!item||!regions[slot].length)continue;
    const iron=item.id.startsWith('iron'),pearl=item.id.startsWith('pearl'),geo=base.clone();geo.setIndex(regions[slot]);const pp=geo.attributes.position;
    // Millimetre-scale surface offset, identical original proportions and joint weighting. Covered body triangles are masked.
    const unitScale=new THREE.Vector3();body.getWorldScale(unitScale);const offset=.007/Math.max(.001,unitScale.x);
    const used=new Set(regions[slot]);for(const i of used)pp.setXYZ(i,pos.getX(i)+normal.getX(i)*offset,pos.getY(i)+normal.getY(i)*offset,pos.getZ(i)+normal.getZ(i)*offset);pp.needsUpdate=true;
    const mat=new THREE.MeshStandardMaterial({map:iron||pearl?g.TEX.rock:g.TEX.wood,color:pearl?0xd1ba80:iron?0x89928f:0x9b7752,roughness:iron?.68:.94,metalness:iron||pearl?.25:0,side:THREE.DoubleSide});
    const armor=new THREE.SkinnedMesh(geo,mat);armor.name='armor-'+slot;armor.position.copy(body.position);armor.quaternion.copy(body.quaternion);armor.scale.copy(body.scale);armor.bind(body.skeleton,body.bindMatrix);armor.castShadow=armor.receiveShadow=true;armor.frustumCulled=false;p.equipment.add(armor);
  }
  const active=items.defs[items.slots[state.sel]?.id];if(active?.model){const model=ART.instance(active.model,.65);if(model){const hand=p.character.visual.getObjectByName('RightHand');if(hand){const anchor=new THREE.Group();anchor.name='held-equipment';hand.add(anchor);const scale=new THREE.Vector3();hand.getWorldScale(scale);anchor.scale.setScalar(1/scale.x);anchor.add(model);model.rotation.z=-.2;p.handAttachment=anchor;}else p.equipment.add(model);}}
 }
'''+s[b:]
s=s.replace('const p=preview;\n  for(const o','const p=preview;\n  if(p.handAttachment){p.handAttachment.removeFromParent();p.handAttachment=null;}\n  for(const o')
s=s.replace('const p=preview;ART.cleanup(p.character);','const p=preview;if(p.handAttachment)p.handAttachment.removeFromParent();if(p.body)p.body.geometry.dispose();ART.cleanup(p.character);')
p.write_text(s,encoding='utf-8')
