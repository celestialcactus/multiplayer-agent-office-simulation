import {build} from 'esbuild';import {mkdir,readFile,writeFile} from 'node:fs/promises';import {deflateRawSync} from 'node:zlib';
await mkdir('infra/generated',{recursive:true});
await build({entryPoints:['server/gateway.mjs'],outfile:'infra/generated/gateway.mjs',bundle:true,platform:'node',target:'node22',format:'esm',banner:{js:"import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);"}});
// Single-file ZIP: avoids platform-specific shell archiving and contains no credentials.
const source=await readFile('infra/generated/gateway.mjs'),compressed=deflateRawSync(source),name=Buffer.from('gateway.mjs');let crc=0xffffffff;for(const byte of source){crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0;
const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(source.length,22);local.writeUInt16LE(name.length,26);
const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(source.length,24);central.writeUInt16LE(name.length,28);
const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+name.length,12);end.writeUInt32LE(local.length+name.length+compressed.length,16);
await writeFile('infra/generated/gateway.zip',Buffer.concat([local,name,compressed,central,name,end]));console.log(`Gateway packaged (${compressed.length} compressed bytes).`);
