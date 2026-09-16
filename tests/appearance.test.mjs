import test from 'node:test';import assert from 'node:assert/strict';
import {validateProfile,newOffice,snapshot} from '../domain/office.mjs';
import {species,outfits,hats} from '../domain/appearance.mjs';
import {guidance} from '../server/guidance.mjs';
const profile={name:'Your agent',role:'Collaborative problem solver',persona:'Curious',interests:'Explore clearer product navigation'};
test('appearance choices persist independently of role and personality',()=>{
 for(const animal of species)for(const outfit of outfits)for(const hat of hats){const s=snapshot(newOffice({...profile,species:animal,outfit,hat}));assert.equal(s.agents[0].species,animal);assert.equal(s.agents[0].outfit,outfit);assert.equal(s.agents[0].hat,hat);assert.equal(s.agents[0].persona,'Curious')}
});
test('old profiles and invalid appearance values fall back to safe defaults',()=>{
 const p=validateProfile({...profile,species:'<script>',hat:{bad:true},outfit:'unknown'});assert.equal(p.species,'fox');assert.equal(p.hat,'none');assert.equal(p.outfit,'hoodie');
});
test('initial demo review begins without mandatory confirmation',async()=>{
 const s=newOffice(profile);let calls=0;const r=await guidance({mode:'demo'},s,{},async()=>calls++);assert.equal(r.needsInput,false);assert.equal(r.question,'');assert.equal(calls,1);
});
