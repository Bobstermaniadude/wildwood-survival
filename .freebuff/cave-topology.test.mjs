import test from 'node:test';import assert from 'node:assert/strict';import {createCaveTopology} from '../caves.js';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const utils=html.slice(html.indexOf('const clamp ='),html.indexOf('// ---- water / ground helpers'));
const terrain=html.slice(html.indexOf('function naturalHeight('),html.indexOf('// biome tint from height'));
const setup=new Function('CFG','THREE',utils+'\n'+terrain+'\nreturn {naturalHeight,hash2,clamp,biomeAt};');
const T={Color:class{}};
for(const seed of [1337,1,2,7,42,100,12345,8675309])test('starter cave deterministic and safely approachable seed '+seed,()=>{
 const CFG={seed,waterLevel:-2.2,terrainVersion:2};const f=setup(CFG,T);
 const findSpawn=()=>{let fallback;for(let r=0;r<240;r+=3)for(let a=0;a<16;a++){const ang=a/16*Math.PI*2,x=Math.cos(ang)*r,z=Math.sin(ang)*r,h=f.naturalHeight(x,z);const slope=Math.max(...[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>Math.abs(f.naturalHeight(x+dx*2,z+dz*2)-h)));if(h>CFG.waterLevel+1.5&&h<14&&slope<.65){const p={x,y:h,z};fallback??=p;if(h>.5&&['forest','plains'].includes(f.biomeAt(x,z,h)))return p;}}return fallback||{x:0,y:2,z:0};};
 const world={caves:[]};const mulberry32=a=>()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};const g={THREE:T,CFG,world,...f,findSpawn,mulberry32};const topology=createCaveTopology(g),c=topology.starter,p=findSpawn();assert.ok(c,'dry starter exists');assert.ok(Math.hypot(c.entranceX-p.x,c.entranceZ-p.z)<=110);assert.ok(c.entranceY>CFG.waterLevel+1);assert.deepEqual(createCaveTopology(g).starter,c);world.caves.push(c);for(let k=0;k<=100;k++){const z=c.entranceZ+(c.endZ-c.entranceZ)*k/100,y=topology.ramp(c,c.x,z);assert.ok(Number.isFinite(y));assert.equal(topology.ground(c.x,z,y),y);assert.ok(Math.abs(topology.ramp(c,c.x,Math.min(c.endZ,z+.05))-y)<.06);}
});
