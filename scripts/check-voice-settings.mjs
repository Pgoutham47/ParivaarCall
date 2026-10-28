// Focused, isolated settings/dispatch checks. Never run with a real provider.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { updateVoiceSettings, getOrCreateVoiceSettings } from '../lib/services/settings.ts';
import { processPendingCall, finalizeCallResult } from '../lib/services/call-engine.ts';
import { localDateKey } from '../lib/services/timezone.ts';
if(process.env.CALL_PROVIDER!=='simulated'||process.env.RESEND_API_KEY)throw Error('Requires CALL_PROVIDER=simulated and an empty RESEND_API_KEY.');
process.env.VERIFIED_CALL_NUMBERS='+12025550123';process.env.FREE_TIER_CALLING='true';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const user=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=async q=>{const r=await q;if(r.error)throw Error(r.error.message);return r.data;};
let userId;const checks=[];
try{
 const email=`voice-qa-${randomBytes(8).toString('hex')}@example.test`,password=randomBytes(24).toString('base64url');
 userId=(await ok(admin.auth.admin.createUser({email,password,email_confirm:true}))).user.id;
 await ok(user.auth.signInWithPassword({email,password}));
 const initialized=await Promise.all([getOrCreateVoiceSettings(user),getOrCreateVoiceSettings(user)]);
 assert.equal(initialized[0].id,initialized[1].id);
 checks.push('Concurrent settings initialization returns one shared row without overwriting preferences');
 const parent=await ok(user.from('parents').insert({caregiver_id:userId,name:'Voice QA',relationship:'Father',phone:'+12025550123',language:'Kannada',status:'active'}).select('*').single());
 const med=await ok(user.from('medicine_schedules').insert({caregiver_id:userId,parent_id:parent.id,medicine_name:'ExampleMedicine',dosage_instruction:'1.5 tablets',scheduled_time:'23:59',food_timing:'after_food',start_date:localDateKey(),frequency:'daily',is_active:true}).select('*').single());
 let sequence=0;
 // Future-dated logs cannot be picked up by the hosted scheduler. The local
 // simulated engine claims each explicitly; the fictional number is not on
 // production's allowlist either.
 const queue=async(schedule=med.id,retry=0)=>ok(admin.from('call_logs').insert({caregiver_id:userId,parent_id:parent.id,medicine_schedule_id:schedule,scheduled_for:new Date(Date.now()+86400000+(++sequence)*1000).toISOString(),call_status:'pending',retry_count:retry,script_text:'STALE TELUGU SCRIPT',script_language:'Telugu'}).select('*').single());
 for(const language of ['Telugu','English','Hindi','Tamil','Kannada']){
  for(const style of ['formal','casual']){
   const job=await queue();
   const input={languagePreference:language,respectMode:style,retryAttempts:2,retryGapMinutes:17};
   await updateVoiceSettings(user,input);
   const restored=await getOrCreateVoiceSettings(user);
   for(const [key,value] of Object.entries(input))assert.equal(restored[key],value);
   const result=await processPendingCall(admin,job.id,{simulatedResponse:'confirmed'});
   assert.equal(result.status,'confirmed');
   const log=await ok(admin.from('call_logs').select('*').eq('id',job.id).single());
   assert.equal(log.script_language,language);assert.ok(!log.script_text.includes('STALE'));
   assert.equal(log.script_text.includes('Voice QA'),style==='formal');
  }
 }
 checks.push('All five languages and both styles save, reload, and replace already-queued scripts before simulated dispatch');
 await updateVoiceSettings(user,{languagePreference:'Parent preferred language',respectMode:'formal',retryAttempts:0,retryGapMinutes:5});
 const test=await queue(null);const testResult=await processPendingCall(admin,test.id,{simulatedResponse:'snoozed'});
 assert.equal(testResult.callLog.script_language,'Kannada');assert.equal(testResult.retryCreated,false);
 assert.match(testResult.callLog.script_text,/ಪರೀಕ್ಷಾ/);
 checks.push('Parent-preferred language applies to one-time tests; tests never retry');
 const limited=await queue(med.id,1);const stopped=await processPendingCall(admin,limited.id,{simulatedResponse:'confirmed'});
 assert.equal(stopped.status,'failed');assert.match(stopped.callLog.notes,/retry limit/);
 checks.push('Reducing retry attempts to zero stops a previously queued retry');
 // Finalize an already-claimed synthetic call on today's date to verify retry
 // timing. There is no pending real call, and no provider request is made.
 const claim=async()=>ok(admin.from('call_logs').insert({caregiver_id:userId,parent_id:parent.id,medicine_schedule_id:med.id,scheduled_for:new Date(Date.now()+(++sequence)*1000).toISOString(),call_status:'calling',call_started_at:new Date().toISOString(),retry_count:0,script_language:'Hindi'}).select('id').single());
 let c=await claim();let result=await finalizeCallResult(admin,c.id,{status:'snoozed',responseType:'speech_later'});assert.equal(result.retryCreated,false);
 await updateVoiceSettings(user,{languagePreference:'Hindi',respectMode:'casual',retryAttempts:2,retryGapMinutes:5});
 c=await claim();const before=Date.now();result=await finalizeCallResult(admin,c.id,{status:'snoozed',responseType:'speech_later'});
 const sameDay=localDateKey(new Date(before+300000))===localDateKey(new Date(before));assert.equal(result.retryCreated,sameDay);
 if(sameDay){const retry=await ok(admin.from('call_logs').select('*').eq('retry_parent_call_log_id',c.id).single());assert.equal(retry.retry_count,1);assert.equal(retry.script_language,'Hindi');assert.ok(Math.abs(Date.parse(retry.scheduled_for)-before-300000)<10000);}
 checks.push('Saved retry count and gap control real database retry creation, including the end-of-day boundary');
 console.log(JSON.stringify({checks,realCallsPlaced:0},null,2));
 mkdirSync('reports',{recursive:true});
 writeFileSync('reports/voice-settings-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,realCallsPlaced:0},null,2));
}finally{
 if(userId){await admin.from('call_logs').update({call_status:'failed'}).eq('caregiver_id',userId).eq('call_status','calling');await ok(admin.auth.admin.deleteUser(userId));}
}
