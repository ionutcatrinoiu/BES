const admin=require('firebase-admin');
function db(){
 if(!admin.apps.length){
  const raw=process.env.BES_FIREBASE_ADMIN_CONFIG;
  if(!raw)throw new Error('BES_FIREBASE_ADMIN_CONFIG is not configured');
  admin.initializeApp({credential:admin.credential.cert(JSON.parse(raw))});
 }
 return admin.firestore();
}
function normalizePhone(v=''){
 let x=String(v).replace(/[^\d+]/g,'');
 if(x.startsWith('0040'))x='+40'+x.slice(4);else if(x.startsWith('40'))x='+40'+x.slice(2);else if(/^07\d{8}$/.test(x))x='+40'+x.slice(1);
 if(x.startsWith('00373'))x='+373'+x.slice(5);else if(x.startsWith('373'))x='+373'+x.slice(3);
 if(!/^\+407\d{8}$/.test(x)&&!/^\+373[67]\d{7}$/.test(x))throw new Error('INVALID_PHONE');
 return x;
}
function phoneKeys(phone){return phone.startsWith('+40')?[phone,'0'+phone.slice(3)]:[phone]}
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 try{
  const phone=normalizePhone((req.body||{}).phone);
  const snaps=await Promise.all(phoneKeys(phone).map(k=>db().collection('bes_phone_keys').doc(k).get()));
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({exists:snaps.some(s=>s.exists)});
 }catch(e){
  if(e.message==='INVALID_PHONE')return res.status(400).json({error:'INVALID_PHONE'});
  console.error(e);return res.status(500).json({error:'CHECK_FAILED'});
 }
};
