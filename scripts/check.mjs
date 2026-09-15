import {readdir} from 'node:fs/promises';import {spawnSync} from 'node:child_process';
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())await walk(path);else if(/\.(mjs|js)$/.test(path)){const r=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(r.status)process.exit(r.status)}}}
for(const dir of ['client','domain','server','scripts','infra','tests']){try{await walk(dir)}catch(e){if(e.code!=='ENOENT')throw e}}console.log('JavaScript syntax checks passed.');
