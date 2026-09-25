import {createAvatar} from './avatar.js';
import {activitySignals} from './activity-signals.js';
import './office-signals.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export const colors=['#b9f47a','#f3ba77','#ad9ef2','#70c6e4','#ef94ac','#f0dc85'];
export function createOffice(host,onSelect){
 const scene=new THREE.Scene();const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
 const camera=new THREE.OrthographicCamera(-14,14,12,-12,.1,100);camera.position.set(19,21,23);camera.lookAt(0,0,0);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,0);controls.enablePan=false;controls.minPolarAngle=.3;controls.maxPolarAngle=1.15;controls.minZoom=.7;controls.maxZoom=1.7;controls.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xe4f5ff,0x496674,2.4));const sun=new THREE.DirectionalLight(0xffefd3,3.8);sun.position.set(-8,20,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16});sun.shadow.bias=-.001;scene.add(sun);
 const mats=new Map();function mat(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.85}));return mats.get(color)}
 function box(x,y,z,w,h,d,color,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 box(0,-.42,0,20,.75,15,'#466171');box(0,-.04,0,19.8,.12,14.8,'#c6c5b2');
 for(let x=-9.5;x<10;x++)for(let z=-7;z<7.5;z+=1.5)box(x,0,z,.97,.02,1.47,((Math.round(x*2)+Math.round(z*2))%4===0)?'#d4d0bc':'#c9c7b4');
 box(0,1.5,-7.35,20,3,.25,'#7292a2');box(-9.85,1.5,0,.25,3,15,'#829f9f');box(0,3.1,-7.35,20,.2,.35,'#dae2d8');
 for(const x of [-6,-1,4]){box(x,2,-7.15,3.8,1.5,.12,'#bfe3e7');box(x,2,-7.03,.1,1.55,.12,'#e6eee2');box(x,1.2,-7,4,.13,.5,'#e9ece1')}
 function plant(x,z,scale=1){box(x,.25,z,.6,.5,.6,'#dca877');box(x,.9,z,.12,1,.12,'#648c57');box(x-.22,1.2,z,.6,.55,.6,'#6ca77d');box(x+.15,1.65,z,.55,.55,.55,'#84b77e');box(x+.28,1.05,z+.15,.5,.4,.6,'#4e9168')}
 plant(-8.7,-6);plant(8.7,-6);plant(8.8,6);plant(-8.8,5.8);
 const desks=[[-5,2],[-5,-3],[0,-3],[0,2],[5,2]];
 desks.forEach(([x,z],i)=>{box(x,.95,z,2.9,.16,1.4,'#b78b61');for(const dx of [-1.2,1.2])for(const dz of [-.5,.5])box(x+dx,.45,z+dz,.1,.9,.1,'#405560');box(x,1.45,z-.18,1.1,.7,.1,'#283f4a');box(x,1.44,z-.11,.94,.52,.03,'#81adbb');box(x,1.15,z-.2,.13,.3,.15,'#344d57');box(x,1.065,z+.35,.85,.04,.3,'#e0e8dd');box(x+.9,1.14,z+.27,.2,.23,.2,colors[i]);box(x,.5,z+1,.7,.12,.65,'#354b60');box(x,1.13,z+1.34,.75,.38,.12,'#354b60');for(const dx of [-.3,.3])box(x+dx,.75,z+1.37,.055,.4,.05,'#354b60')});
 // Meeting corner and coffee counter.
 box(5.4,.035,-3.55,5.5,.035,4.5,'#729789');box(5.4,.95,-3.7,3.1,.18,1.5,'#dfb88a');for(const x of [4.25,6.55])box(x,.45,-3.7,.14,.9,1,'#516769');for(const x of [4.2,5.4,6.6])for(const z of [-5,-2.4]){box(x,.47,z,.65,.12,.65,'#385363');box(x,1.13,z+(z<-3?-.34:.34),.65,.38,.12,'#385363');for(const dx of [-.3,.3])box(x+dx,.75,z+(z<-3?-.37:.37),.055,.4,.05,'#385363')}
 box(-8.4,.63,-1.9,1.4,1.25,3.8,'#477980');box(-8.4,1.29,-1.9,1.55,.12,4,'#e1d9c2');box(-8.4,1.65,-2.8,.75,.65,.65,'#263f4b');box(-8.37,1.67,-2.42,.42,.3,.05,'#b4c2be');box(-8.4,1.48,-1.3,.28,.28,.28,'#fff0d4');box(-8.4,1.4,-.8,.6,.1,.5,'#dba365');box(6.3,.4,5.4,3.4,.65,1.15,'#d19767');box(6.3,.9,5.85,3.4,.6,.25,'#e3ac79');
 const agents=[];
 const looks=[{species:'fox',outfit:'hoodie'},{species:'rabbit',outfit:'casual',hat:'beanie'},{species:'otter',outfit:'suit'},{species:'frog',outfit:'hoodie',hat:'cap'},{species:'dog',outfit:'polo'}];
 function dress(a,profile){const key=JSON.stringify([profile.species,profile.outfit,profile.hat,profile.color]);if(a.key===key)return;const old=a.avatar;const next=createAvatar(profile);if(old){next.g.position.copy(old.g.position);next.g.rotation.copy(old.g.rotation);scene.remove(old.g);old.dispose()}else next.g.position.copy(a.target);next.g.userData.agentId=a.index;scene.add(next.g);a.avatar=next;a.g=next.g;a.legs=next.legs;a.key=key;a.label.style.color=profile.color;}
 for(let i=0;i<5;i++){const label=document.createElement('div');label.className='scene-label'+(i===0?' you':'');host.append(label);const a={index:i,label,target:new THREE.Vector3(desks[i][0],0,desks[i][1]+1)};dress(a,{...looks[i],color:colors[i]});agents.push(a)}
 function paint(profile){dress(agents[0],typeof profile==='string'?{...looks[0],color:profile}:profile)}
 let state=null,signals=[];const names=['Your agent','Maya · Design','Ellis · Credit','Jules · Frontend','Theo · Backend'];
 function update(s){state=s;signals=activitySignals(s);agents.forEach((a,i)=>{const ag=s?.agents?.[i];a.label.textContent=ag?.name||names[i];if(i===0&&ag?.color)paint(ag);let [x,z]=desks[i];z+=1;if(ag?.activity==='Coffee break'||ag?.activity==='Encounter'){x=-7;z=-2+i*.65}if(ag?.activity==='Meeting'){x=4.2+(i%3)*1.2;z=i<3?-2.4:-5}if(ag?.activity==='Break'){x=5.3+i*.45;z=4.7}a.seated=!['Coffee break','Encounter','Break'].includes(ag?.activity);a.facing=ag?.activity==='Meeting'&&i>=3?0:Math.PI;a.target.set(x,0,z)})}
 const signalButtons=[0,1].map(()=>{const button=document.createElement('button');button.className='scene-signal';button.hidden=true;button.type='button';host.append(button);button.onclick=e=>{e.stopPropagation();window.dispatchEvent(new CustomEvent('office-activity',{detail:button.signal}));};return button;});
 let lastSignals='';
 function placeSignals(){
  const signature=JSON.stringify(signals);
  if(signature!==lastSignals){lastSignals=signature;signalButtons.forEach((button,index)=>{const signal=signals[index];button.signal=signal;button.hidden=!signal;if(!signal)return;button.className='scene-signal signal-'+signal.kind;const name=state.agents.find(a=>a.id===signal.agentId)?.name||'Agent';button.replaceChildren();const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=name+' · '+signal.label;detail.textContent=signal.detail;button.append(title,detail);button.setAttribute('aria-label',name+': '+signal.label+'. '+signal.detail+'. Open '+(signal.kind==='exchange'?'exchange':'work thread'));});}
  const placed=[];
  signalButtons.forEach(button=>{if(button.hidden)return;const a=agents[state.agents.findIndex(a=>a.id===button.signal.agentId)];if(!a)return;const p=a.g.position.clone().add(new THREE.Vector3(0,3.6,0)).project(camera);const half=Math.min(95,host.clientWidth/2);let x=Math.max(half,Math.min(host.clientWidth-half,(p.x*.5+.5)*host.clientWidth)),y=Math.max(95,(-p.y*.5+.5)*host.clientHeight);if(placed.some(q=>Math.abs(q.x-x)<190&&Math.abs(q.y-y)<85))y=Math.max(80,y-95);placed.push({x,y});button.style.left=x+'px';button.style.top=y+'px';});
 }
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const span=Math.max(12.5,13.3/(w/h));camera.left=-span*w/h;camera.right=span*w/h;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();renderer.setSize(w,h)}new ResizeObserver(resize).observe(host);resize();update(null);
 const raycaster=new THREE.Raycaster();let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=raycaster.intersectObjects(agents.map(a=>a.g),true)[0];if(hit){let g=hit.object;while(g.parent!==scene)g=g.parent;onSelect(g.userData.agentId)}});
 const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;agents.forEach((a,i)=>{const distance=a.g.position.distanceTo(a.target);if(distance>.04){a.avatar.setSeated(false);const dir=a.target.clone().sub(a.g.position).normalize();a.g.position.addScaledVector(dir,Math.min(distance,dt*2.8));a.g.rotation.y=Math.atan2(dir.x,dir.z);a.legs.forEach((l,j)=>l.rotation.x=Math.sin(t*12+j*Math.PI)*.45)}else{a.legs.forEach(l=>l.rotation.x=0);a.avatar.setSeated(a.seated);a.g.rotation.y=a.facing}const p=a.g.position.clone().add(new THREE.Vector3(0,2.65,0)).project(camera);a.label.style.left=`${(p.x*.5+.5)*host.clientWidth}px`;a.label.style.top=`${(-p.y*.5+.5)*host.clientHeight}px`});controls.update();placeSignals();renderer.render(scene,camera)});
 return {update,preview:paint};
}
