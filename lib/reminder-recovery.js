const crypto=require('crypto');
const {getFirestore,admin}=require('./admin/firebase');
const {ensureQrToken,sendReminder}=require('./reminder');
const normalize=value=>String(value||'').trim().toLowerCase();
function classifyReminderEvents(events,messageId,email){
 if(!Array.isArray(events)||events.length>=1000)return 'unknown';
 const matching=events.filter(e=>e.messageId===messageId&&normalize(e.email)===normalize(email));
 if(matching.some(e=>['delivered','opened','uniqueOpened','clicks','clicked'].includes(e.event)))return 'delivered';
 if(!matching.length||matching.some(e=>!Number.isFinite(Date.parse(e.date))))return 'unknown';
 matching.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 const latest=matching[0];
 const simultaneous=matching.filter(e=>Date.parse(e.date)===Date.parse(latest.date));
 // Brevo may return Sent and Error with identical timestamps, in either order.
 const senderError=simultaneous.some(e=>e.event==='error'&&/sender/i.test(e.reason||'')&&/not valid|invalid|validat|not verified|not authenticated/i.test(e.reason||''));
 if(senderError&&simultaneous.every(e=>['error','requests','request','sent','deferred'].includes(e.event)))return 'sender_error';
 return ['requests','request','sent','deferred'].includes(latest.event)?'pending':'unknown';
}
async function reminderDeliveryStatus(participant){
 if(!participant.reminderEmailId)return 'unknown';
 if(!process.env.BREVO_API_KEY)throw Error('BREVO_API_KEY_NOT_CONFIGURED');
 const query=new URLSearchParams({messageId:participant.reminderEmailId,email:participant.email,days:'30',limit:'1000',sort:'desc'});
 const response=await fetch('https://api.brevo.com/v3/smtp/statistics/events?'+query,{headers:{accept:'application/json','api-key':process.env.BREVO_API_KEY}});
 if(!response.ok)throw Error('BREVO_STATUS_CHECK_FAILED');
 const data=await response.json();
 return classifyReminderEvents(data.events,participant.reminderEmailId,participant.email);
}
async function retryRejectedReminder(registrationId){
 if(typeof registrationId!=='string'||!/^[-a-zA-Z0-9_]{1,150}$/.test(registrationId))throw Error('INVALID_REGISTRATION_ID');
 const store=getFirestore(),ref=store.collection('bes_registrations').doc(registrationId),snapshot=await ref.get();
 if(!snapshot.exists)throw Error('PARTICIPANT_NOT_FOUND');
 const participant=snapshot.data();
 if(!participant.email)return {status:'unknown'};
 // An interrupted dispatch remains reserved. Its delivery must be checked manually.
 if(participant.reminderRecovery&&participant.reminderRecovery.status==='sending')return {status:'unknown'};
 const status=await reminderDeliveryStatus(participant);
 if(status!=='sender_error'){
  await ref.update({reminderDeliveryStatus:status,reminderDeliveryCheckedAt:admin.firestore.FieldValue.serverTimestamp()});
  return {status};
 }
 const originalMessageId=participant.reminderEmailId;
 const key='bes-2026-reminder-recovery/'+crypto.createHash('sha256').update(registrationId+'\n'+originalMessageId).digest('hex');
 const reserved=await store.runTransaction(async tx=>{
  const current=await tx.get(ref);if(!current.exists)return false;
  const value=current.data();
  if(value.reminderEmailId!==originalMessageId||normalize(value.email)!==normalize(participant.email)||value.reminderRecovery&&value.reminderRecovery.status==='sending')return false;
  tx.update(ref,{reminderRecovery:{status:'sending',key,originalMessageId,startedAt:Date.now()},reminderDeliveryStatus:'sender_error'});
  return true;
 });
 if(!reserved)return {status:'unknown'};
 const prepared=await ensureQrToken(ref,participant);
 // Keep the reservation if delivery or persistence is uncertain, to avoid duplicate sends.
 const out=await sendReminder(prepared,participant.email,key);
 if(!out||!out.messageId)throw Error('BREVO_MESSAGE_ID_MISSING');
 await ref.update({reminderSent:true,reminderSentAt:admin.firestore.FieldValue.serverTimestamp(),reminderEmailId:out.messageId,reminderDeliveryStatus:'accepted',reminderError:admin.firestore.FieldValue.delete(),reminderRecovery:{status:'accepted',key,originalMessageId,messageId:out.messageId}});
 return {status:'accepted',messageId:out.messageId};
}
module.exports={classifyReminderEvents,reminderDeliveryStatus,retryRejectedReminder};
