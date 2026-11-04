const {getFirestore,admin}=require('../../lib/admin/firebase');
const {sendReminder,ensureQrToken}=require('../../lib/reminder');
const stages=[
 {id:'r1',date:'2026-11-21',hour:'09:30'},
 {id:'r2',date:'2026-11-27',hour:'09:30'},
 {id:'r3',date:'2026-11-28',hour:'07:30'}
];
function localParts(now){
 const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Chisinau',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const p=Object.fromEntries(f.formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,hour:`${p.hour}:${p.minute}`};
}
async function sendOne(doc,stage){
 const ref=doc.ref,store=getFirestore();
 // Claim the delivery once. If Brevo responds ambiguously, manual review is safer than a duplicate.
 const claimed=await store.runTransaction(async tx=>{
  const snap=await tx.get(ref);if(!snap.exists)return null;
  const data=snap.data(),state=data.emailStages?.[stage.id]?.state;
  if(state||!data.email||!/^\d{4}$/.test(String(data.numericCheckinCode||'')))return null;
  tx.update(ref,{[`emailStages.${stage.id}`]:{state:'sending',claimedAt:new Date().toISOString()}});
  return data;
 });
 if(!claimed)return 'skipped';
 try{
  const r=await ensureQrToken(ref,claimed);
  const out=await sendReminder(r,r.email,`bes-2026-${stage.id}-${doc.id}`,stage.id);
  await ref.update({[`emailStages.${stage.id}`]:{state:'sent',sentAt:new Date().toISOString(),messageId:out.messageId||null}});
  return 'sent';
 }catch(e){
  await ref.update({[`emailStages.${stage.id}`]:{state:'review',error:String(e.message||e).slice(0,300),at:new Date().toISOString()}}).catch(()=>{});
  return 'error';
 }
}
module.exports=async(req,res)=>{
 if(!process.env.CRON_SECRET||req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`)return res.status(401).json({error:'UNAUTHORIZED'});
 if(process.env.BES_EMAILS_ENABLED!=='true')return res.status(200).json({paused:true});
 const now=localParts(new Date()),stage=stages.find(x=>x.date===now.date&&x.hour===now.hour);
 if(!stage)return res.status(200).json({skipped:true,localTime:now});
 const snap=await getFirestore().collection('bes_registrations').get();
 const counts={total:snap.size,sent:0,skipped:0,error:0};
 for(const doc of snap.docs){const outcome=await sendOne(doc,stage);counts[outcome]++}
 return res.status(200).json({stage:stage.id,...counts});
};
