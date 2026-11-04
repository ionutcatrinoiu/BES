const {FINAL_AT}=require('./final-reminder');
// Read delivery events only. This function never sends or reschedules emails.
async function refreshFinalReminderStatuses(docs,now=new Date()){
 if(now.getTime()<Date.parse(FINAL_AT)||!process.env.BREVO_API_KEY)return;
 const due=docs.map(doc=>({doc,record:doc.data()})).filter(({record:r})=>r.finalReminderEmailId&&r.finalReminderDeliveryStatus!=='delivered'&&now.getTime()-Number(r.finalReminderCheckedAt||0)>=60000);
 if(!due.length)return;
 const events=[];let complete=false;
 try{
  for(let offset=0;offset<5000;offset+=1000){
   const query=new URLSearchParams({days:'2',limit:'1000',offset:String(offset),sort:'desc'});
   const response=await fetch('https://api.brevo.com/v3/smtp/statistics/events?'+query,{headers:{accept:'application/json','api-key':process.env.BREVO_API_KEY},signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw Error('BREVO_STATUS_CHECK_FAILED');
   const data=await response.json();if(!Array.isArray(data.events))throw Error('BREVO_INVALID_EVENTS');
   events.push(...data.events);
   if(data.events.length<1000){complete=true;break}
  }
 }catch(_){return}
 const normalize=v=>String(v||'').trim().toLowerCase();
 await Promise.all(due.map(async({doc,record:r})=>{
  const matching=events.filter(e=>e.messageId===r.finalReminderEmailId&&normalize(e.email)===normalize(r.email)&&Number.isFinite(Date.parse(e.date)));
  const delivered=matching.filter(e=>['delivered','opened','uniqueOpened','clicks','clicked'].includes(e.event)).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))[0];
  const latest=matching.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))[0];
  const rejected=latest&&matching.some(e=>Date.parse(e.date)===Date.parse(latest.date)&&['blocked','hardBounces','softBounces','invalid','error','spam','unsubscribed'].includes(e.event));
  const status=delivered?'delivered':!complete?'unknown':rejected?'error':latest?'pending':'unknown';
  const update={finalReminderDeliveryStatus:status,finalReminderCheckedAt:now.getTime(),...(delivered?{finalReminderSentAt:delivered.date}:{})};
  try{await doc.ref.update(update);Object.assign(r,update);doc.finalReminderStatusUpdate=update}catch(_){}
 }));
}
module.exports={refreshFinalReminderStatuses};
