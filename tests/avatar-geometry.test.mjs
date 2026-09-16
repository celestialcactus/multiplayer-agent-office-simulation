import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAvatar} from '../client/avatar.js';
import {species} from '../domain/appearance.mjs';

test('seated tails clear both desk and meeting chair seats and backs',()=>{
 for(const animal of species){
  const avatar=createAvatar({species:animal});avatar.setSeated(true);avatar.g.updateMatrixWorld(true);
  const obstacles=[new THREE.Box3(new THREE.Vector3(-.375,.94,-.4),new THREE.Vector3(.375,1.32,-.28)),new THREE.Box3(new THREE.Vector3(-.35,.44,-.325),new THREE.Vector3(.35,.56,.325))];
  for(const x of [-.3,.3])obstacles.push(new THREE.Box3(new THREE.Vector3(x-.0275,.55,-.395),new THREE.Vector3(x+.0275,.95,-.345)));
  avatar.sittingTail.traverse(mesh=>{if(mesh.isMesh){const bounds=new THREE.Box3().setFromObject(mesh,true);for(const obstacle of obstacles)assert.equal(bounds.intersectsBox(obstacle),false,`${animal} tail intersects chair`);}});
  avatar.setSeated(false);assert.equal(avatar.sittingTail.visible,false);avatar.dispose();
 }
});

