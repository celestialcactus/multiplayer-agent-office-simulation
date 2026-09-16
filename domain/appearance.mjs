export const species=['fox','rabbit','cat','dog','otter','frog'];
export const outfits=['hoodie','suit','polo','casual'];
export const hats=['none','beanie','cap','bucket'];
export function appearance(profile={}){
 return {species:species.includes(profile.species)?profile.species:'fox',outfit:outfits.includes(profile.outfit)?profile.outfit:'hoodie',hat:hats.includes(profile.hat)?profile.hat:'none',color:/^#[0-9a-f]{6}$/i.test(profile.color||'')?profile.color:'#b9f47a'};
}
