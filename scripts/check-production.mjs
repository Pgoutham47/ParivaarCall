import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
const base='http://localhost:3001';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ids=[],checks=[];
const ok=async q=>{const r=await q;if(r.error)throw Error(r.error.message);return r.data;};
async function account(){const email=`production-qa-${randomBytes(6).toString('hex')}@example.test`,password=randomBytes(24).toString('base64url');const data=await ok(admin.auth.admin.createUser({email,password,email_confirm:true}));ids.push(data.user.id);const jar=new Map();const client=createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:entries=>entries.forEach(c=>jar.set(c.name,c.value))}});await ok(client.auth.signInWithPassword({email,password}));return {id:data.user.id,client,cookie:()=>[...jar].map(([n,v])=>`${n}=${v}`).join('; ')};}
async function request(user,path,body,expected=200,origin=base){const t=performance.now();const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(user?{Cookie:user.cookie()}:{})},body:JSON.stringify(body)});const data=await r.json();if(expected!==null)assert.equal(r.status,expected,JSON.stringify(data));return {status:r.status,data,ms:Math.round(performance.now()-t)};}
const parentInput={name:'Production QA',relationship:'Mother',phoneNumber:'+12025550123',age:null,preferredLanguage:'Telugu',city:null,emergencyContactName:null,emergencyContactPhone:null,status:'active'};
const medicineInput={medicineName:'QA schedule',dosageInstruction:'Test only. No medicine needed.',time:'23:59',mealTiming:'after_food',frequency:'daily',importanceLevel:'routine',startDate:'2099-01-01',endDate:'2099-01-01',isActive:true};
try{
 const a=await account(),b=await account();
 await request(null,'/api/family',{},401);await request(a,'/api/family',{},401,'https://attacker.example');
 await request(null,'/api/calls/test',{},401);checks.push('Unauthenticated and cross-origin mutations blocked');
 await request(a,'/api/family',{resource:'parent',action:'save',input:{...parentInput,phoneNumber:'123'}},400);
 const created=await request(a,'/api/family',{resource:'parent',action:'save',input:parentInput});const p=created.data.item;
 assert.equal(p.callingVerified,true);assert.equal((await ok(b.client.from('parents').select('id').eq('id',p.id))).length,0);
 await request(b,'/api/family',{resource:'parent',action:'delete',id:p.id},404);
 await request(b,'/api/calls/test',{parentId:p.id},404);checks.push('Cross-account reads, deletes and test calls blocked');
 const foreign=await b.client.from('medicine_schedules').insert({caregiver_id:b.id,parent_id:p.id,medicine_name:'Forbidden',scheduled_time:'23:59',start_date:'2099-01-01'});assert.ok(foreign.error);
 const forged=await a.client.from('call_logs').insert({caregiver_id:a.id,parent_id:p.id,call_status:'pending'});assert.ok(forged.error);
 const rpc=await a.client.rpc('claim_pending_call',{p_id:'00000000-0000-0000-0000-000000000000'});assert.ok(rpc.error);checks.push('Database blocks forged jobs, cross-account links and direct call claims');
 const med=(await request(a,'/api/family',{resource:'medicine',action:'save',input:{...medicineInput,parentId:p.id}})).data.item;
 await request(a,'/api/family',{resource:'medicine',action:'save',id:med.id,input:{...medicineInput,parentId:p.id,endDate:'2098-01-01'}},400);
 const queue=()=>ok(admin.from('call_logs').insert({caregiver_id:a.id,parent_id:p.id,medicine_schedule_id:med.id,scheduled_for:'2099-01-01T18:29:00Z',call_status:'pending',retry_count:0}).select('id').single());
 await queue();await request(a,'/api/family',{resource:'medicine',action:'status',id:med.id,active:false});
 assert.equal((await ok(admin.from('call_logs').select('id').eq('caregiver_id',a.id))).length,0);
 const resumed=await request(a,'/api/family',{resource:'medicine',action:'status',id:med.id,active:true});assert.equal(resumed.data.item.isActive,true);
 await queue();await request(a,'/api/family',{resource:'medicine',action:'save',id:med.id,input:{...medicineInput,parentId:p.id,time:'23:58'}});
 assert.equal((await ok(admin.from('call_logs').select('id').eq('caregiver_id',a.id))).length,0);checks.push('Pause/edit cancel queued calls; reactivation and date validation work');
 const job=await queue();const claims=await Promise.all([admin.rpc('claim_pending_call',{p_id:job.id}),admin.rpc('claim_pending_call',{p_id:job.id})]);assert.equal(claims.filter(r=>r.data===true).length,1);
 await request(a,'/api/family',{resource:'parent',action:'delete',id:p.id},409);
 const direct=await a.client.from('parents').update({name:'Blocked'}).eq('id',p.id);assert.ok(direct.error);
 await ok(admin.from('call_logs').update({call_status:'confirmed'}).eq('id',job.id));checks.push('Concurrent claim places only one attempt; in-progress records cannot change');
 const unverified=(await request(a,'/api/family',{resource:'parent',action:'save',input:{...parentInput,name:'Unverified QA',phoneNumber:'+12025550124'}})).data.item;
 await request(a,'/api/calls/test',{parentId:unverified.id},403);checks.push('Unverified numbers rejected before dialing');
 // Remove the earlier synthetic claim so this account can test its one-call slot.
 await ok(admin.from('call_logs').delete().eq('id',job.id));
 const calls=await Promise.all([request(a,'/api/calls/test',{parentId:p.id},null),request(a,'/api/calls/test',{parentId:p.id},null)]);
 assert.deepEqual(calls.map(r=>r.status).sort(),[200,429]);assert.ok(calls.find(r=>r.status===200).data.callLogId);const logs=await ok(admin.from('call_logs').select('*').eq('caregiver_id',a.id));assert.equal(logs.length,1);assert.equal(logs[0].call_status,'no_answer');
 const alert=await ok(admin.from('alerts').select('id').eq('caregiver_id',a.id).single());await request(a,`/api/alerts/${alert.id}/read`,{});checks.push('One-time test call simulated end-to-end; duplicate request blocked; no retries; alert can be read');
 await request(a,'/api/family',{resource:'medicine',action:'delete',id:med.id});
 await request(a,'/api/family',{resource:'parent',action:'delete',id:p.id});
 assert.equal((await ok(admin.from('call_logs').select('id').eq('caregiver_id',a.id))).length,0);checks.push('Medicine deletion and parent cascading cleanup work');
 // Exercise callback idempotency without placing a call.
 const callbackParent=(await request(a,'/api/family',{resource:'parent',action:'save',input:{...parentInput,name:'Callback QA'}})).data.item;
 const providerId='qa-'+randomBytes(8).toString('hex');
 const callbackLog=await ok(admin.from('call_logs').insert({caregiver_id:a.id,parent_id:callbackParent.id,scheduled_for:'2099-01-01T18:00:00Z',call_status:'calling',call_started_at:new Date().toISOString(),provider_call_id:providerId,script_language:'Telugu'}).select('id').single());
 const payload={execution_id:providerId,status:'completed',extracted_data:{Care:{reminder_outcome:{objective:'help'}}},transcript:'user: Please help'};
 for(let i=0;i<2;i++){const r=await fetch(base+'/api/webhooks/bolna',{method:'POST',headers:{'Content-Type':'application/json','x-webhook-secret':process.env.BOLNA_WEBHOOK_SECRET},body:JSON.stringify(payload)});assert.equal(r.status,200);}
 const final=await ok(admin.from('call_logs').select('call_status').eq('id',callbackLog.id).single());assert.equal(final.call_status,'need_help');
 const callbackAlerts=await ok(admin.from('alerts').select('id').eq('parent_id',callbackParent.id));assert.equal(callbackAlerts.length,1);checks.push('Duplicate completion callbacks create one help alert and preserve the final outcome');
 const results={date:new Date().toISOString(),checks,createParentMs:created.ms,mode:'Local production build with simulated calls; no real phone calls'};
 writeFileSync('reports/production-checks-2026-10-28.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{for(const id of ids){await admin.from('call_logs').update({call_status:'failed'}).eq('caregiver_id',id).eq('call_status','calling');const r=await admin.auth.admin.deleteUser(id);if(r.error)console.error('QA cleanup failed:',r.error.message);}}
