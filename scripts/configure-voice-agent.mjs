// Run with node --env-file=.env.local scripts/configure-voice-agent.mjs [--apply]
// Default is a read-only audit. Never places a telephone call.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const spec=JSON.parse(readFileSync(new URL('../config/bolna-conversation.json',import.meta.url)));
const agentId=process.env.BOLNA_AGENT_ID, apiKey=process.env.BOLNA_API_KEY;
if(!agentId||!apiKey)throw Error('Configure BOLNA_AGENT_ID and BOLNA_API_KEY.');
const base=process.env.BOLNA_API_URL??'https://api.bolna.ai';
async function api(path,method='GET',body){
 const response=await fetch(base+path,{method,headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const data=await response.json();
 if(!response.ok)throw Error(`Agent API ${method} ${path} failed (${response.status}): ${JSON.stringify(data).replace(/https?:[^\s"]+/g,'[URL]').slice(0,400)}`);
 return data;
}
const current=await api(`/v2/agent/${agentId}`);
const categories=await api(`/agent/${agentId}/extraction-categories`);
const extraction=categories.categories.flatMap(c=>c.dispositions).find(d=>d.name==='reminder_outcome');
if(!extraction)throw Error('Missing reminder_outcome extraction. Repair it before changing the agent.');
const task=structuredClone(current.tasks[0]);
const {provider, ...voice}=spec.voice;
const synth=code=>({provider,stream:true,caching:true,buffer_size:100,audio_format:'wav',provider_config:{...voice,language:code}});
const transcription=code=>({...task.tools_config.transcriber,...spec.transcriber,language:code,context:'Medicine reminder conversation with an older adult. Distinguish already taken, not taken, later, and requests for help. Preserve negation and uncertainty.'});
const shared=spec.system_prompt.join('\n\n');
task.toolchain={execution:'sequential',pipelines:[['transcriber','llm','synthesizer']]};
task.tools_config.llm_agent.llm_config={...task.tools_config.llm_agent.llm_config,model:spec.model,max_tokens:180,temperature:0.2};
task.tools_config.synthesizer=synth('te');
task.tools_config.transcriber=transcription('te');
task.tools_config.multilingual_config={enabled:true,active_language:'te',language_switch_trigger:'caller_requested',languages:Object.fromEntries(Object.entries(spec.languages).map(([code,l])=>[code,{agent_name:'ParivaarCall',transcriber:transcription(code),synthesizer:synth(code),system_prompt:shared+'\n\n'+l.instruction,handoff_message:l.handoff}]))};
task.task_config={...task.task_config,...spec.task_config,call_cancellation_prompt:spec.hangup_prompt,
 check_user_online_message:Object.fromEntries(Object.entries(spec.languages).map(([code,l])=>[code,l.online])),
 call_hangup_message:Object.fromEntries(Object.entries(spec.languages).map(([code,l])=>[code,l.goodbye]))};
const {id,created_at,updated_at,created_by,agent_prompts,agent_status,composition_by_language,...config}=current;
const payload={agent_config:{...config,agent_name:spec.agent_name,agent_welcome_message:'{reminder_script}',tasks:[task]},agent_prompts:{...agent_prompts,task_1:{...agent_prompts.task_1,system_prompt:shared+'\n\n'+spec.languages.te.instruction}}};
function verify(agent){
 const actual=agent.tasks[0];const multi=actual.tools_config.multilingual_config;
 assert.equal(multi?.enabled,true); assert.equal(multi.language_switch_trigger,'caller_requested');
 assert.deepEqual(Object.keys(multi.languages).sort(),Object.keys(spec.languages).sort());
 for(const [code,language] of Object.entries(spec.languages)){
  const slot=multi.languages[code];assert.ok(slot.system_prompt.includes(language.instruction));
  assert.ok(slot.system_prompt.includes('{respect_mode}'));
  assert.equal(slot.synthesizer.provider_config.voice_id,spec.voice.voice_id);
  assert.equal(slot.synthesizer.provider_config.model,spec.voice.model);
  assert.equal(slot.synthesizer.provider_config.speed,spec.voice.speed);
  assert.ok(slot.transcriber.language.startsWith(code));
  assert.ok(slot.synthesizer.provider_config.language.startsWith(code));
  assert.equal(actual.task_config.call_hangup_message[code],language.goodbye);
  assert.equal(actual.task_config.check_user_online_message[code],language.online);
 }
 for(const [key,value] of Object.entries(spec.task_config))assert.deepEqual(actual.task_config[key],value,key);
 assert.equal(actual.task_config.call_cancellation_prompt,spec.hangup_prompt);
 assert.equal(agent.webhook_url,current.webhook_url,'Webhook changed');
 assert.equal(actual.tools_config.input.provider,current.tasks[0].tools_config.input.provider);
 assert.equal(actual.tools_config.llm_agent.llm_config.model,spec.model);
 assert.equal(agent.agent_welcome_message,'{reminder_script}');
}
if(process.argv.includes('--apply')){
 const folder=join('backups','voice-agent-'+new Date().toISOString().replace(/[:.]/g,'-'));
 mkdirSync(folder,{recursive:true,mode:0o700});
 writeFileSync(join(folder,'agent-before.json'),JSON.stringify(current,null,2),{mode:0o600});
 writeFileSync(join(folder,'extractions-before.json'),JSON.stringify(categories,null,2),{mode:0o600});
 writeFileSync(join(folder,'requested-agent.json'),JSON.stringify(payload,null,2),{mode:0o600});
 await api(`/v2/agent/${agentId}`,'PUT',payload);
 const saved=await api(`/v2/agent/${agentId}`);verify(saved);
 await api(`/dispositions/${extraction.id}`,'PUT',{agent_id:agentId,is_objective:true,is_subjective:false,question:spec.extraction_question,objective_options:spec.objective_options});
 const confirmed=await api(`/agent/${agentId}/extraction-categories`);
 const field=confirmed.categories.flatMap(c=>c.dispositions).find(d=>d.name==='reminder_outcome');
 assert.equal(field.question,spec.extraction_question);
 assert.deepEqual(field.objective_options.map(({value,condition})=>({value,condition})),spec.objective_options);
 writeFileSync(join(folder,'agent-after.json'),JSON.stringify(saved,null,2),{mode:0o600});
 console.log(JSON.stringify({updated:true,verifiedLanguages:Object.keys(spec.languages),backup:folder,realCallsPlaced:0}));
}else{
 verify(current);
 assert.equal(extraction.question,spec.extraction_question);
 console.log(JSON.stringify({verified:true,languages:Object.keys(spec.languages),hangup:current.tasks[0].task_config.hangup_after_LLMCall,realCallsPlaced:0}));
}
