const {readSession,noStore}=require('../../lib/admin/auth');
const {getFirestore}=require('../../lib/admin/firebase');
const generate=require('../../lib/admin/handlers/export');
const iso=v=>v&&typeof v.toDate==='function'?v.toDate().toISOString():v||null;
module.exports=async(req,res)=>{
 noStore(res);
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});
 try{
  const snap=await getFirestore().collection('bes_registrations').get();
  req.body={rows:snap.docs.map(d=>{const x=d.data();return {
   participationCode:x.participationCode||'',numericCheckinCode:x.numericCheckinCode||'',
   firstName:x.firstName||'',lastName:x.lastName||'',phone:x.phoneNormalized||x.phone||'',
   email:x.email||'',opticalStore:x.opticalStore||'',role:x.role||'',city:x.city||'',
   county:x.county||'',country:x.country||'MD',streetAddress:x.streetAddress||'',
   avveroMyopia:x.avveroMyopia||'',avveroPractice:x.avveroPractice||'',
   avveroPrevention:x.avveroPrevention||'',partnerAnswers:x.partnerAnswers||{},
   registeredAt:iso(x.registeredAt),giftDelivered:x.giftDelivered===true,
   checkedIn:x.checkedIn===true||!!x.checkedInAt,checkedInAt:iso(x.checkedInAt),
   confirmationEmailSent:x.confirmationEmailSent===true,
   confirmationEmailError:x.confirmationEmailError||'',emailStages:x.emailStages||{}
  }}).sort((a,b)=>String(b.registeredAt||'').localeCompare(String(a.registeredAt||'')))};
  return generate(req,res);
 }catch(e){console.error('admin export failed',e.message);return res.status(500).json({error:'EXPORT_FAILED'})}
};
