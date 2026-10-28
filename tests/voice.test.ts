import assert from 'node:assert/strict';
import test from 'node:test';
import { generateMedicineReminderScript } from '../lib/call-scripts';
import { callLanguageCodes, resolveCallLanguage, testCallScripts } from '../lib/voice-languages';
import { selectableCallLanguages, type CallJob } from '../lib/types';
import { validateSettings, validateParent } from '../lib/validation';
import { createBolnaCallProvider } from '../lib/call-providers/bolna';
import { toCallResult } from '../lib/call-providers/bolna-results';
import spec from '../config/bolna-conversation.json';

test('every selectable language has a real voice slot, native script, and distinct speaking styles',()=>{
  for(const language of selectableCallLanguages){
    const code=callLanguageCodes[language];
    assert.ok(code in spec.languages);
    assert.equal(resolveCallLanguage('Parent preferred language',language),language);
    assert.equal(resolveCallLanguage(language,'Telugu'),language);
    validateSettings({languagePreference:language,respectMode:'formal',retryAttempts:0,retryGapMinutes:5});
    validateParent({name:'Test',phoneNumber:'+12025550123',relationship:'Father',preferredLanguage:language,age:null,city:null,emergencyContactName:null,emergencyContactPhone:null});
    const base={parentName:'Test parent',relationship:'Father',language,medicineName:'ExampleMedicine',dosageInstruction:'1.5 tablets, 2.5 ml',foodTiming:'after_food',scheduledTime:'09:00',retryCount:0};
    const formal=generateMedicineReminderScript({...base,respectMode:'formal'});
    const familiar=generateMedicineReminderScript({...base,respectMode:'casual'});
    assert.notEqual(formal.scriptText,familiar.scriptText);
    assert.ok(formal.scriptText.includes('Test parent'));
    assert.match(formal.scriptText,/1\.5/);assert.match(formal.scriptText,/2\.5 ml/);
    assert.equal((formal.scriptText.match(/\?/g)??[]).length,1);
    const writing={Telugu:/[\u0c00-\u0c7f]/,Hindi:/[\u0900-\u097f]/,Tamil:/[\u0b80-\u0bff]/,Kannada:/[\u0c80-\u0cff]/,English:/test call/};
    assert.match(testCallScripts[language],writing[language]);
  }
  assert.throws(()=>resolveCallLanguage('French','English'));
});

test('outbound requests select the actual multilingual slot and carry current settings',async()=>{
  const previousFetch=global.fetch;
  const previous={BOLNA_API_KEY:process.env.BOLNA_API_KEY,BOLNA_AGENT_ID:process.env.BOLNA_AGENT_ID,BOLNA_FROM_PHONE_NUMBER:process.env.BOLNA_FROM_PHONE_NUMBER};
  try{
    process.env.BOLNA_API_KEY='unit-test-key';process.env.BOLNA_AGENT_ID='unit-test-agent';delete process.env.BOLNA_FROM_PHONE_NUMBER;
    for(const language of selectableCallLanguages){
      let sent: Record<string, unknown>={};
      global.fetch=async(_url,init)=>{sent=JSON.parse(String(init?.body));return new Response(JSON.stringify({execution_id:'mock-execution'}),{status:200});};
      const job:CallJob={callLog:{id:'test',caregiver_id:'caregiver',parent_id:'parent',medicine_schedule_id:'medicine',scheduled_for:null,retry_count:1},parent:{id:'parent',name:'Test',phone:'+12025550123'},medicineSchedule:{id:'medicine',medicine_name:'Test',dosage_instruction:null,scheduled_time:'09:00'},script:{text:'Saved script',language},voiceSettings:{respectMode:'casual',retryDelayMinutes:17,retriesRemaining:1}};
      const result=await createBolnaCallProvider().placeCall(job);
      assert.equal(result.kind,'initiated');assert.deepEqual(sent.agent_data,{language:callLanguageCodes[language]});
      assert.deepEqual(sent.retry_config,{enabled:false});
      assert.deepEqual(sent.user_data,{call_log_id:'test',parent_name:'Test',medicine_name:'Test',dosage_instruction:'',scheduled_time:'09:00',script_language:language,reminder_script:'Saved script',retry_count:1,respect_mode:'casual',retry_delay_minutes:17,retries_remaining:1,call_kind:'medicine_reminder'});
      await assert.rejects(()=>createBolnaCallProvider().placeCall({...job,script:{...job.script,language:'unknown'}}));
    }
  }finally{global.fetch=previousFetch;for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});

test('multilingual result fallback respects clear confirmations, negation, later and help',()=>{
  for(const phrase of ['दवा ले ली है','மருந்து எடுத்துக்கொண்டேன்','ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ','మందు వేసుకున్నాను','I have taken it']){
    assert.equal(toCallResult({status:'completed',transcript:'user: '+phrase}).status,'confirmed',phrase);
  }
  for(const phrase of ['दवा नहीं ली','மருந்து எடுக்கவில்லை','ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿಲ್ಲ','మందు వేసుకోలేదు','I have not taken it']){
    assert.equal(toCallResult({status:'completed',transcript:'assistant: I have taken it user: '+phrase}).status,'missed',phrase);
  }
  for(const phrase of ['बाद में याद दिलाना','பிறகு அழைக்கவும்','ಆಮೇಲೆ ಕರೆ ಮಾಡಿ'])assert.equal(toCallResult({status:'completed',transcript:'user: '+phrase}).status,'snoozed');
  for(const phrase of ['मदद चाहिए','உதவி வேண்டும்','ಸಹಾಯ ಬೇಕು'])assert.equal(toCallResult({status:'completed',transcript:'user: '+phrase}).status,'need_help');
  for(const phrase of ['हाँ','சரி','ಹೌದು','అవును','yes'])assert.equal(toCallResult({status:'completed',transcript:'user: '+phrase}).status,'missed');
});
