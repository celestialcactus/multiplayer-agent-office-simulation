import * as THREE from 'three';
import {appearance} from '../domain/appearance.mjs';

export function createAvatar(profile={}){
 const p=appearance(profile),g=new THREE.Group(),materials=new Map();
 const fur={fox:'#dc873f',rabbit:'#d9d1c6',cat:'#8c99b0',dog:'#b67d52',otter:'#795345',frog:'#78af68'}[p.species];
 const cream=p.species==='frog'?'#d6e6a4':'#f2ddbd',dark='#253444';
 function box(x,y,z,w,h,d,color,parent=g){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.85}));const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.get(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 const standing=new THREE.Group(),seated=new THREE.Group();g.add(standing,seated);seated.visible=false;
 const pants=p.outfit==='suit'?'#354653':'#425d73';
 const legs=[box(-.15,.36,0,.23,.47,.3,pants,standing),box(.15,.36,0,.23,.47,.3,pants,standing)];
 for(const x of [-.15,.15])box(x,.11,.08,.25,.16,.42,dark,standing);
 for(const x of [-.15,.15]){box(x,.58,.22,.23,.22,.6,pants,seated);box(x,.32,.43,.23,.4,.24,pants,seated);box(x,.11,.51,.25,.16,.42,dark,seated)}
 box(0,.88,0,.59,.62,.4,p.color);
 for(const x of [-.39,.39]){box(x,.9,0,.2,p.outfit==='polo'||p.outfit==='casual'?.3:.55,.32,p.color);box(x,.58,.03,.2,.2,.27,fur)}
 if(p.outfit==='hoodie'){box(0,1.17,-.09,.62,.2,.43,p.color);box(0,.75,.214,.31,.17,.035,p.color);for(const x of [-.12,.12])box(x,1.04,.216,.025,.17,.025,cream)}
 if(p.outfit==='suit'){box(0,1.02,.215,.2,.35,.025,'#faf1de');for(const x of [-.16,.16]){const lapel=box(x,1.04,.24,.13,.35,.06,p.color);lapel.rotation.z=x<0?.3:-.3}box(0,.99,.254,.055,.25,.04,'#d8876a');box(.18,.85,.23,.025,.025,.025,cream)}
 if(p.outfit==='polo'){for(const x of [-.1,.1]){const collar=box(x,1.15,.235,.14,.09,.055,cream);collar.rotation.z=x<0?.25:-.25}box(0,1.04,.223,.025,.09,.025,cream)}
 if(p.outfit==='casual'){box(0,.91,.218,.027,.48,.025,cream);box(.17,1.01,.223,.12,.12,.025,cream);for(const y of [.76,.92,1.07])box(0,y,.242,.035,.035,.02,dark)}
 // All animals are upright coworkers; anatomy distinguishes them without changing behavior.
 box(0,1.49,0,.66,.56,.52,fur);
 const ear=(x,y,w,h,color=fur)=>box(x,y,-.01,w,h,.23,color);
 if(p.species==='rabbit'){for(const x of [-.21,.21]){ear(x,2.03,.2,.63);box(x,2.05,.115,.1,.43,.035,'#d79d9d')}}
 if(p.species==='fox'||p.species==='cat'){for(const x of [-.24,.24]){ear(x,1.85,.21,.3);ear(x,2,.12,.09);box(x,1.85,.12,.1,.18,.025,p.species==='fox'?dark:'#d79d9d')}}
 if(p.species==='dog'){for(const x of [-.38,.38])ear(x,1.46,.19,.57,'#694a3c')}
 if(p.species==='otter'){for(const x of [-.35,.35])ear(x,1.72,.19,.2)}
 if(p.species==='frog'){for(const x of [-.23,.23]){box(x,1.82,.08,.25,.25,.28,fur);box(x,1.83,.232,.16,.15,.035,'#fff8df');box(x,1.83,.258,.07,.1,.025,dark)}box(0,1.36,.28,.5,.17,.1,cream);box(0,1.41,.345,.3,.025,.02,dark)}
 else{const muzzleDepth=p.species==='fox'||p.species==='dog'?.26:.12;box(0,1.35,.28,.42,.22,muzzleDepth,cream);box(0,1.43,.3+muzzleDepth/2,.12,.075,.05,dark);for(const x of [-.19,.19]){box(x,1.57,.275,.105,.11,.04,dark);box(x-.018,1.6,.3,.035,.035,.015,'#fff8ed')}}
 const walkingTail=new THREE.Group(),sittingTail=new THREE.Group();g.add(walkingTail,sittingTail);sittingTail.visible=false;
 if(p.species==='fox'){const tail=box(.16,.64,-.49,.32,.38,.68,fur,walkingTail);tail.rotation.x=-.35;box(.16,.78,-.88,.31,.3,.3,cream,walkingTail)}
 if(p.species==='cat'){const tail=box(.26,.57,-.38,.14,.7,.15,fur,walkingTail);tail.rotation.x=-.45;box(.26,.92,-.55,.14,.14,.15,cream,walkingTail)}
 if(p.species==='otter')box(0,.28,-.47,.27,.18,.7,fur,walkingTail);
 if(p.species==='dog'){const tail=box(0,.64,-.37,.14,.4,.17,fur,walkingTail);tail.rotation.x=-.7}
 if(p.species==='rabbit')box(0,.52,-.3,.24,.24,.23,cream,walkingTail);
 // Preserve chair clearance with a box-built seated tail in the original style.
 if(p.species==='rabbit')box(0,.71,-.31,.24,.24,.23,cream,sittingTail);
 else if(p.species!=='frog'){
  const width=p.species==='fox'?.32:p.species==='otter'?.24:.14;
  box(.36,.71,-.19,.72,.13,.13,fur,sittingTail);
  box(.79,.73,-.36,width,.2,.46,fur,sittingTail);
  box(.79,.86,-.64,width,.28,.22,p.species==='fox'?cream:fur,sittingTail);
 }
 function setSeated(value){standing.visible=!value;walkingTail.visible=!value;seated.visible=value;sittingTail.visible=value;}
 const hatBox=(x,y,...rest)=>box(x,y+(p.species==='frog'?.22:0),...rest);
 if(p.hat==='beanie'){hatBox(0,1.8,0,.7,.12,.57,p.color);hatBox(0,1.92,0,.48,.15,.44,p.color);hatBox(0,2.04,0,.15,.12,.15,cream)}
 if(p.hat==='cap'){hatBox(0,1.8,0,.69,.13,.57,dark);hatBox(0,1.77,.38,.57,.065,.34,p.color)}
 if(p.hat==='bucket'){hatBox(0,1.8,0,.81,.08,.69,cream);hatBox(0,1.92,0,.56,.2,.49,cream);hatBox(0,1.88,.253,.56,.045,.02,p.color)}
 return {g,legs,setSeated,sittingTail,dispose(){g.traverse(o=>o.geometry?.dispose());for(const m of materials.values())m.dispose()}};
}

export function avatarPreview(host,profile){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,20);camera.position.set(2.5,2.1,4.3);camera.lookAt(0,1.1,0);
 scene.add(new THREE.HemisphereLight('#f0f9ff','#5a6973',3));const light=new THREE.DirectionalLight('#fff0d5',4);light.position.set(-3,5,4);scene.add(light);
 const a=createAvatar(profile);scene.add(a.g);let dragging=false,lastX;
 renderer.domElement.onpointerdown=e=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)};
 renderer.domElement.onpointermove=e=>{if(dragging){a.g.rotation.y+=(e.clientX-lastX)*.015;lastX=e.clientX;renderer.render(scene,camera)}};
 renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>dragging=false;
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);renderer.render(scene,camera)};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 return ()=>{observer.disconnect();a.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()};
}
