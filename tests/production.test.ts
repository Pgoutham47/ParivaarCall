import assert from 'node:assert/strict';
import test from 'node:test';
import { scheduleIsDue } from '../lib/schedule-rules';
import { validateMedicine, validateParent, validateSettings } from '../lib/validation';
import { canCallNumber } from '../lib/calling-access';
import { callDescription } from '../lib/call-display';
import { localDateKey, zonedDateTimeToUtc } from '../lib/services/timezone';
import type { MedicineScheduleInput, ParentInput } from '../lib/types';

const medicine: MedicineScheduleInput = { parentId:'parent', medicineName:'Test', dosageInstruction:null, time:'21:45', mealTiming:'after_food', frequency:'daily', importanceLevel:'routine', startDate:'2026-10-28',endDate:null };
const parent: ParentInput = { name:'Parent', relationship:'Mother',phoneNumber:'9876543210',age:null,preferredLanguage:'Telugu',city:null,emergencyContactName:null,emergencyContactPhone:null };
test('weekly reminders run only on the start weekday and respect pause/end dates',()=>{
  const schedule={is_active:true,start_date:'2026-10-28',end_date:'2026-11-04',frequency:'weekly'};
  assert.equal(scheduleIsDue(schedule,'2026-10-28'),true);
  assert.equal(scheduleIsDue(schedule,'2026-10-29'),false);
  assert.equal(scheduleIsDue(schedule,'2026-11-04'),true);
  assert.equal(scheduleIsDue(schedule,'2026-11-11'),false);
  assert.equal(scheduleIsDue({...schedule,is_active:false},'2026-10-28'),false);
  assert.equal(scheduleIsDue({...schedule,frequency:'custom'},'2026-10-28'),false);
});
test('form validation rejects invalid dates, times, empty names and unsupported schedules',()=>{
  validateMedicine(medicine); validateParent(parent);
  for(const edit of [{endDate:'2026-10-27'},{startDate:'2026-02-30'},{time:'24:01'},{medicineName:' '},{frequency:'custom'}]) assert.throws(()=>validateMedicine({...medicine,...edit} as MedicineScheduleInput));
  for(const edit of [{name:' '},{age:-1},{age:150},{phoneNumber:'123'},{preferredLanguage:'Unsupported'}]) assert.throws(()=>validateParent({...parent,...edit}));
  assert.throws(()=>validateSettings({languagePreference:'Telugu',respectMode:'formal',retryAttempts:100,retryGapMinutes:1}));
});
test('free-tier access fails closed and accepts only explicitly verified numbers',()=>{
  const prior={tier:process.env.FREE_TIER_CALLING,numbers:process.env.VERIFIED_CALL_NUMBERS};
  try {
    process.env.FREE_TIER_CALLING='true'; process.env.VERIFIED_CALL_NUMBERS='';
    assert.equal(canCallNumber('9876543210'),false);
    process.env.VERIFIED_CALL_NUMBERS=JSON.stringify({caregiver:['+919876543210']});
    assert.equal(canCallNumber('9876543210','caregiver'),true);
    assert.equal(canCallNumber('9876543211','caregiver'),false);
    assert.equal(canCallNumber('9876543210','different-account'),false);
    assert.equal(canCallNumber('invalid'),false);
  } finally { for(const [key,value] of Object.entries({FREE_TIER_CALLING:prior.tier,VERIFIED_CALL_NUMBERS:prior.numbers})) { if(value===undefined)delete process.env[key];else process.env[key]=value; } }
});
test('customer status text never echoes raw service failures or credentials',()=>{
  const raw='Bolna request failed: secret-token private-provider-body';
  for(const state of ['pending','calling','confirmed','failed']) {const message=callDescription(state,raw);assert.doesNotMatch(message,/bolna|secret-token|private-provider/i);}
  assert.match(callDescription('failed','Trial accounts can only make calls to verified phone numbers.'),/verified/);
});
test('India-day scheduling works across UTC midnight',()=>{
  assert.equal(localDateKey(new Date('2026-10-28T20:00:00Z')),'2026-10-29');
  assert.equal(zonedDateTimeToUtc('2026-10-29','00:01:00').toISOString(),'2026-10-28T18:31:00.000Z');
});
