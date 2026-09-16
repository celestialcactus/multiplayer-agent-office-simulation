import * as THREE from 'three';
import {appearance} from '../domain/appearance.mjs';

export function createAvatar(profile={}){
 const p=appearance(profile),g=new THREE.Group(),materials=new Map();
 const fur={fox:'#dc873f',rabbit:'#d9d1c6',cat:'#8c99b0',dog:'#b67d52',otter:'#795345',frog:'#78af68'}[p.species];
 const cream=p.species==='frog'?'#d6e6a4':'#f2ddbd',dark='#253444';
 function box(x,y,z,w,h,d,color,parent=g){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.85,flatShading:true}));const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.get(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 // Triangulated, flat-shaded volumes keep the animals angular at office scale.
 function facet(x,y,z,w,h,d,color,parent=g){const m=box(x,y,z,w,h,d,color,parent);m.geometry.dispose();m.geometry=new THREE.IcosahedronGeometry(1,0);m.scale.set(w/1.7,h/1.7,d/1.7);return m}
 function taper(x,y,z,w,h,d,color){const m=box(x,y,z,w,h,d,color);m.geometry.dispose();m.geometry=new THREE.CylinderGeometry(0,1,1,4,1);m.scale.set(w/2,h,d/2);m.rotation.y=Math.PI/4;return m}
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
 facet(0,1.49,0,.72,.64,.61,fur);
 const ear=(x,y,w,h,color=fur)=>facet(x,y,-.01,w,h,.23,color);
 if(p.species==='rabbit'){for(const x of [-.21,.21]){ear(x,2.03,.2,.63);box(x,2.05,.115,.1,.43,.035,'#d79d9d')}}
 if(p.species==='fox'||p.species==='cat'){for(const x of [-.24,.24]){taper(x,1.87,-.01,.36,.48,.3,fur);taper(x,1.86,.095,.19,.3,.035,p.species==='fox'?dark:'#d79d9d')}}
 if(p.species==='dog'){for(const x of [-.38,.38])ear(x,1.46,.19,.57,'#694a3c')}
 if(p.species==='otter'){for(const x of [-.35,.35])ear(x,1.72,.19,.2)}
 if(p.species==='frog'){for(const x of [-.23,.23]){facet(x,1.82,.08,.29,.29,.32,fur);box(x,1.83,.232,.16,.15,.035,'#fff8df');box(x,1.83,.258,.07,.1,.025,dark)}facet(0,1.36,.28,.55,.22,.17,cream);box(0,1.41,.345,.3,.025,.02,dark)}
 else{const muzzleDepth=p.species==='fox'||p.species==='dog'?.26:.12;facet(0,1.36,.29,.47,.3,muzzleDepth+.16,cream);facet(0,1.4,.34+muzzleDepth/2,.13,.095,.09,dark);for(const x of [-.19,.19]){box(x,1.57,.275,.105,.11,.04,dark);box(x-.018,1.6,.3,.035,.035,.015,'#fff8ed')}}
 const walkingTail=new THREE.Group(),sittingTail=new THREE.Group();g.add(walkingTail,sittingTail);sittingTail.visible=false;
 function tailSegment(parent,from,to,r1,r2,color){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),delta=b.clone().sub(a);const m=box(0,0,0,1,1,1,color,parent);m.geometry.dispose();m.geometry=new THREE.CylinderGeometry(r2,r1,delta.length(),5,1);m.position.copy(a.add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}
 if(p.species==='rabbit'){facet(0,.69,-.31,.26,.25,.26,cream,walkingTail);facet(0,.71,-.31,.26,.25,.26,cream,sittingTail)}
 else if(p.species!=='frog'){
  const thick=p.species==='fox'?.22:p.species==='otter'?.14:.075;
  const long=p.species==='fox'||p.species==='otter';
  tailSegment(walkingTail,[0,.7,-.18],[.16,.65,-.65],.08,thick,fur);
  tailSegment(walkingTail,[.16,.65,-.65],[.2,long?.82:1,-1],thick,.025,p.species==='fox'?cream:fur);
  // Route below the open chair back, then curl outside its right edge.
  tailSegment(sittingTail,[0,.7,-.18],[.72,.72,-.19],.065,.09,fur);
  tailSegment(sittingTail,[.72,.72,-.19],[.93,.77,-.53],.09,thick,fur);
  tailSegment(sittingTail,[.93,.77,-.53],[.96,1.05,-.79],thick,.025,p.species==='fox'?cream:fur);
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
