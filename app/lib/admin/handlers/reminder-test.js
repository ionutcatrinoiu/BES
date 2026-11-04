const {readSession,noStore}=require('../admin/auth');
const {getFirestore}=require('../admin/firebase');
const {ensureQrToken,sendReminder}=require('../reminder');
module.exports=async(req,res)=>{
  noStore(res);
  if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});
  const action=req.body&&req.body.action;
  if(action==='retry-rejected'){
    const id=req.body.registrationId;
    if(typeof id!=='string'||!/^[-a-zA-Z0-9_]{1,150}$/.test(id))return res.status(400).json({error:'INVALID_REGISTRATION_ID'});
    try{
      const {retryRejectedReminder}=require('../reminder-recovery');
      return res.status(200).json({ok:true,...await retryRejectedReminder(id)});
    }catch(e){console.error('reminder recovery failed',e.message);return res.status(502).json({error:'REMINDER_RECOVERY_FAILED',message:'Verificarea sau retrimiterea nu a putut fi confirmată. Verifică logurile Brevo înainte de o nouă încercare.'})}
  }
  if(action!==undefined)return res.status(400).json({error:'INVALID_ACTION'});
  const email=String(req.body&&req.body.email||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'INVALID_EMAIL'});
  try{
    const snap=await getFirestore().collection('bes_registrations').get();
    const doc=snap.docs.find(d=>String(d.data().email||'').trim().toLowerCase()===email);
    if(!doc)return res.status(404).json({error:'PARTICIPANT_NOT_FOUND'});
    let participant=await ensureQrToken(doc.ref,doc.data());
    const key=`snoo-2026-reminder-test/${doc.id}/${Date.now()}`;
    const out=await sendReminder(participant,email,key);
    return res.status(200).json({ok:true,messageId:out&&out.messageId||null});
  }catch(e){
    console.error('reminder test failed',e);
    return res.status(500).json({error:'REMINDER_TEST_FAILED',message:String(e.message||e).slice(0,300)});
  }
};
