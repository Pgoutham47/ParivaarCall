import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export function encrypt(value,key) {
  const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key,iv);
  const bytes=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);
  return JSON.stringify({version:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:bytes.toString('base64')});
}
export function decrypt(value,key) {
  const file=JSON.parse(value);if(file.version!==1)throw Error('Unsupported backup version');
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(file.iv,'base64'));decipher.setAuthTag(Buffer.from(file.tag,'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(file.data,'base64')),decipher.final()]));
}
function key() {const value=Buffer.from(process.env.BACKUP_ENCRYPTION_KEY??'','base64');if(value.length!==32)throw Error('A 32-byte backup encryption key is required');return value;}
async function rpc(name) {
  const r=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',signal:AbortSignal.timeout(30000),headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:'{}'});
  if(!r.ok)throw Error(`Snapshot request failed (HTTP ${r.status})`);return r.json();
}
const qi=s=>'"'+s.replaceAll('"','""')+'"';
const qn=s=>s.split('.').map(qi).join('.');
const literal=s=>"'"+s.replaceAll("'","''")+"'";
function psql(sql) {
  const r=spawnSync('psql',['--no-psqlrc','--quiet','--tuples-only','--no-align','--set','ON_ERROR_STOP=1',process.env.RECOVERY_DATABASE_URL],{input:sql,encoding:'utf8',maxBuffer:32*1024*1024,env:{...process.env,PGOPTIONS:'-c timezone=UTC -c datestyle=ISO,YMD'}});
  if(r.status!==0)throw Error('Restore database command failed; no sensitive row content was logged.');return r.stdout.trim();
}
export function restoreAndVerify(snapshot) {
  if(!process.env.RECOVERY_DATABASE_URL)throw Error('Set RECOVERY_DATABASE_URL to an EMPTY, isolated PostgreSQL database');
  if(Number(psql("select count(*) from information_schema.tables where table_schema not in ('pg_catalog','information_schema')"))!==0)throw Error('Refusing recovery into a non-empty database');
  const parts=['begin;','create schema if not exists auth;create schema if not exists private;'];
  for(const [table,rows] of Object.entries(snapshot.tables)) {
    if(!/^(public|auth|private)\.[a-z_]+$/.test(table))throw Error('Invalid table');
    const columns=snapshot.columns[table];
    if(!columns?.length)throw Error('Missing schema metadata');
    for(const c of columns)if(!/^[a-zA-Z0-9_\s.,()[\]"]+$/.test(c.type))throw Error('Unexpected column type');
    parts.push(`create table ${qn(table)} (${columns.map(c=>`${qi(c.name)} ${c.type}`).join(',')});`);
    parts.push(`insert into ${qn(table)} select * from jsonb_populate_recordset(null::${qn(table)},${literal(JSON.stringify(rows))}::jsonb);`);
  }
  parts.push('commit;');psql(parts.join('\n'));
  // Compare every stored value, not just the number of rows.
  for(const [table,rows] of Object.entries(snapshot.tables)) {
    const same=psql(`select coalesce((select jsonb_agg(value order by value::text) from jsonb_array_elements(${literal(JSON.stringify(rows))}::jsonb)),'[]'::jsonb)=coalesce((select jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text) from ${qn(table)} t),'[]'::jsonb);`);
    if(same!=='t')throw Error(`Restored data differs: ${table}`);
  }
  const orphanChecks=[
    'select count(*) from public.profiles p left join auth.users u on u.id=p.id where u.id is null',
    'select count(*) from auth.identities i left join auth.users u on u.id=i.user_id where u.id is null',
    'select count(*) from public.parents p left join public.profiles u on u.id=p.caregiver_id where u.id is null',
    'select count(*) from public.medicine_schedules m left join public.parents p on p.id=m.parent_id and p.caregiver_id=m.caregiver_id where p.id is null'
  ];
  for(const query of orphanChecks)if(Number(psql(query))!==0)throw Error('Recovery contains broken account relationships');
  // A disaster recovery must never replay old queued medicine calls.
  psql("update public.call_logs set call_status='failed',notes='Stopped during disaster recovery; review before rescheduling.' where call_status in ('pending','calling');");
  if(Number(psql("select count(*) from public.call_logs where call_status in ('pending','calling')")))throw Error('Unsafe outstanding calls after recovery');
  return {tablesVerified:Object.keys(snapshot.tables).length,rowsVerified:Object.values(snapshot.tables).reduce((n,rows)=>n+rows.length,0),valuesMatched:true,oldCallsCannotReplay:true};
}
async function main(){
 const action=process.argv[2];
 if(action==='create'){
  const snapshot=await rpc('export_recovery_snapshot');snapshot.source={};
  for(const file of await readdir('supabase/migrations'))if(file.endsWith('.sql'))snapshot.source[file]=await readFile(join('supabase/migrations',file),'utf8');
  snapshot.configuration=JSON.parse(process.env.OPS_RECOVERY_CONFIGURATION??'{}');
  for(const name of ['APP_URL','APP_TIMEZONE','CALL_PROVIDER','BOLNA_AGENT_ID','BOLNA_API_KEY','BOLNA_WEBHOOK_SECRET','CRON_SECRET','FREE_TIER_CALLING','VERIFIED_CALL_NUMBERS'])if(process.env[name])snapshot.configuration[name]=process.env[name];
  const encrypted=encrypt(snapshot,key());
  const dir=resolve(process.env.BACKUP_DIR??'backups');await mkdir(dir,{recursive:true,mode:0o700});
  const path=join(dir,`parivaar-${new Date().toISOString().replaceAll(':','-')}.encrypted.json`);
  await writeFile(path,encrypted,{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({ok:true,path,sha256:createHash('sha256').update(encrypted).digest('hex'),tableCount:Object.keys(snapshot.tables).length,createdAt:snapshot.createdAt}));
 }else if(action==='verify'){
  const file=process.argv[3];if(!file)throw Error('Choose an encrypted backup file');
  const snapshot=decrypt(await readFile(file,'utf8'),key());console.log(JSON.stringify({ok:true,createdAt:snapshot.createdAt,...restoreAndVerify(snapshot)}));
 }else throw Error('Usage: backup.mjs create | verify <encrypted-file>');
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))main().catch(e=>{console.error(e.message);process.exitCode=1;});
