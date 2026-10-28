import {mkdtemp,rm,readdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encrypt,decrypt} from './backup.mjs';
import {randomBytes} from 'node:crypto';
const key=randomBytes(32),encrypted=encrypt({test:'integrity'},key);
if(decrypt(encrypted,key).test!=='integrity')throw Error('Encryption round-trip failed');
for(const [value,k] of [[encrypted,randomBytes(32)],[encrypted.replace('"data":"','"data":"A'),key]]){
 let rejected=false;try{decrypt(value,k);}catch{rejected=true;}if(!rejected)throw Error('Tampered backup accepted');
}
const dir=await mkdtemp(join(tmpdir(),'parivaar-recovery-'));let started=false;
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:4e6});if(r.status!==0)throw Error(cmd+' failed');return r.stdout;}
try{
 run('initdb',['-D',dir+'/data','--auth=trust','--no-locale','--encoding=UTF8']);
 run('pg_ctl',['-D',dir+'/data','-l',dir+'/server.log','-o',`-F -k ${dir} -h '' -p 55439`,'start']);started=true;
 const files=(await readdir('backups')).filter(x=>x.endsWith('.encrypted.json')).sort();const file='backups/'+files.at(-1);
 const r=spawnSync(process.execPath,['scripts/operations/backup.mjs','verify',file],{encoding:'utf8',env:{...process.env,RECOVERY_DATABASE_URL:`postgresql:///postgres?host=${encodeURIComponent(dir)}&port=55439`}});
 console.log(r.stdout||r.stderr);if(r.status!==0)throw Error('Recovery drill failed');
 await writeFile('reports/recovery-check.json',JSON.stringify({...JSON.parse(r.stdout),integrityChecksPassed:true,isolatedDatabase:true},null,2));
}finally{if(started)run('pg_ctl',['-D',dir+'/data','stop','-m','fast']);await rm(dir,{recursive:true,force:true});}
