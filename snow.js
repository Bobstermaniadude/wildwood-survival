export function installSnow(g){
 const {THREE,world,weather,state,biomeAt,baseHeight,clamp}=g;
 const uniforms={warm:{value:0},cold:{value:0}};let warm=0,cold=0;
 function coverageAt(x,z,h=baseHeight(x,z)){if(h<g.CFG.waterLevel+.1)return 0;const b=biomeAt(x,z,h),amount=b==='snow'||h>9.5?cold:warm;return amount*(.88+.12*Math.sin(x*.13)*Math.cos(z*.11));}
 function patchMaterial(mat,terrain=false){if(!mat||!mat.isMeshStandardMaterial||mat.userData.snow)return;mat.userData.snow=true;const previous=mat.onBeforeCompile;
  mat.onBeforeCompile=shader=>{previous?.(shader);shader.uniforms.snowWarm=uniforms.warm;shader.uniforms.snowCold=uniforms.cold;
   shader.vertexShader='varying vec3 snowWorld; varying vec3 snowNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n snowWorld=(modelMatrix*vec4(transformed,1.0)).xyz; snowNormal=normalize(mat3(modelMatrix)*objectNormal);');
   shader.fragmentShader='uniform float snowWarm; uniform float snowCold; varying vec3 snowWorld; varying vec3 snowNormal;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float snowAmount=mix(snowWarm,snowCold,smoothstep(8.0,17.0,snowWorld.y));
    float exposure=smoothstep(0.35,0.85,snowNormal.y);
    float grain=0.88+0.12*sin(snowWorld.x*0.13)*cos(snowWorld.z*0.11);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.77,0.83,0.86),snowAmount*exposure*grain);`);
  };mat.customProgramCacheKey=()=>terrain?'wildwood-snow-terrain-v1':'wildwood-snow-prop-v1';mat.needsUpdate=true;
 }
 function patchGroup(group){group.traverse(o=>{if(o.userData?.noSnow)return;if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m.userData.noSnow)patchMaterial(m);}});}
 function update(dt){if(weather.type==='snow'){warm=clamp(warm+dt*.006*weather.intensity,0,.9);cold=clamp(cold+dt*.007*weather.intensity,0,.95);}else{const rain=['rain','storm'].includes(weather.type);warm=clamp(warm-dt*(rain?.006:.0018),0,1);cold=clamp(cold-dt*(rain?.0012:.00025),0,1);}uniforms.warm.value=warm;uniforms.cold.value=cold;}
 function restore(d){warm=Number.isFinite(d?.warm)?clamp(d.warm,0,1):0;cold=Number.isFinite(d?.cold)?clamp(d.cold,0,1):0;uniforms.warm.value=warm;uniforms.cold.value=cold;}
 return {patchMaterial,patchGroup,coverageAt,update,serialize:()=>({warm,cold}),restore,reset:()=>restore(null),uniforms};
}
