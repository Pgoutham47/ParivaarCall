import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
const base=process.env.APP_URL??'https://parivaar-call.vercel.app';
const started=Date.now(),results=[],problems=[];
async function check(path,expected,options={}){const t=Date.now();try{const r=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(15000),...options});results.push({path,status:r.status,ms:Date.now()-t});if(!expected.includes(r.status))problems.push(`${path}: unexpected HTTP ${r.status}`);return r;}catch{problems.push(`${path}: request failed or timed out`);}}
await check('/',[200]);await check('/login',[200]);await check('/dashboard',[307,302]);
await check('/api/calls/test',[401],{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
try{
 const r=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/operations_health`,{method:'POST',signal:AbortSignal.timeout(15000),headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:'{}'});
 if(!r.ok)throw Error();const h=await r.json();results.push({database:h});
 if(!h.schedulerEnabled)problems.push('One or more calling schedules are disabled');
 if(!h.lastWorkerSuccess||Date.now()-Date.parse(h.lastWorkerSuccess)>300000)problems.push('No successful calling-worker check in the last five minutes');
 if(h.overdueCalls)problems.push(`${h.overdueCalls} overdue reminder calls`);
 if(h.stuckCalls)problems.push(`${h.stuckCalls} calls waiting too long for a result`);
 if(h.recentWorkerFailures)problems.push(`${h.recentWorkerFailures} worker HTTP failures in the last ten minutes`);
}catch{problems.push('Database health check failed');}
if(results.some(r=>r.path&&r.ms>5000))problems.push('At least one website response exceeded five seconds');
const output={checkedAt:new Date().toISOString(),ok:problems.length===0,problems,results,durationMs:Date.now()-started};
const file=process.env.MONITOR_REPORT??'reports/health-latest.json';await mkdir(dirname(file),{recursive:true});await writeFile(file,JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));if(!output.ok)process.exitCode=1;
