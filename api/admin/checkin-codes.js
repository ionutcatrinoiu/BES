const crypto=require('crypto');
const {readSession,noStore}=require('../../lib/admin/auth');
const {getFirestore}=require('../../lib/admin/firebase');
module.exports=async(req,res)=>{
 noStore(res);
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});
 const store=getFirestore();let updated=0,existing=0;
 try{
  const snap=await store.collection('bes_registrations').get();
  for(const doc of snap.docs){
   if(/^\d{4}$/.test(String(doc.data().numericCheckinCode||''))){existing++;continue}
   let done=false;
   for(let attempt=0;attempt<90&&!done;attempt++){
    const code=String(crypto.randomInt(1000,10000));
    const ref=store.collection('bes_checkin_codes').doc(code);
    done=await store.runTransaction(async tx=>{
     const [reg,occupied]=await Promise.all([tx.get(doc.ref),tx.get(ref)]);
     if(!reg.exists)return true;
     if(/^\d{4}$/.test(String(reg.data().numericCheckinCode||'')))return true;
     if(occupied.exists)return false;
     tx.set(ref,{registrationId:doc.id,createdAt:new Date()});
     tx.update(doc.ref,{numericCheckinCode:code});return true;
    });
    if(done)updated++;
   }
   if(!done)return res.status(503).json({error:'NO_AVAILABLE_CODES',updated,existing});
  }
  return res.status(200).json({ok:true,updated,existing});
 }catch(e){console.error('checkin code migration failed',e.message);return res.status(500).json({error:'MIGRATION_FAILED'});}
};
