import assert from 'node:assert/strict';
// Shared by API smoke tests: the new workday requires initial human confirmation.
export async function confirmBrief(read,command){
 for(let i=0;i<60;i++){
  const s=await read();
  if(s.project?.waiting){
   await command('message',{text:'Yes, proceed with the stated problem. This is a synthetic prototype exercise: no internal baseline is available. Research public guidance and draft a small experiment; label assumptions and leave success thresholds for human agreement.'});
   return;
  }
  assert(s.calls<12,'Initial review exhausted the smoke test budget.');
  await new Promise(r=>setTimeout(r,1000));
 }
 throw new Error('Initial brief confirmation timed out.');
}
