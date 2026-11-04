const admin=require('firebase-admin');
const crypto=require('crypto');
const {normalizeLanguage}=require('../lib/language');
const {normalizeEmail,emailKey,emailExists}=require('../lib/email');
const QRCode=require('qrcode');
const {sendRegistrationConfirmation}=require('../lib/reminder');

function db(){
 if(!admin.apps.length){
  const raw=process.env.BES_FIREBASE_ADMIN_CONFIG;
  if(!raw) throw new Error('BES_FIREBASE_ADMIN_CONFIG is not configured');
  const serviceAccount=JSON.parse(raw);
  admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
 }
 return admin.firestore();
}
function normalizePhone(v=''){
 let x=String(v).replace(/[^\d+]/g,'');
 if(x.startsWith('0040'))x='+40'+x.slice(4);else if(x.startsWith('40'))x='+40'+x.slice(2);else if(/^07\d{8}$/.test(x))x='+40'+x.slice(1);
 if(x.startsWith('00373'))x='+373'+x.slice(5);else if(x.startsWith('373'))x='+373'+x.slice(3);
 if(!/^\+373[67]\d{7}$/.test(x))throw new Error('INVALID_PHONE');
 return x;
}
function phoneKeys(phone){return phone.startsWith('+40')?[phone,'0'+phone.slice(3)]:[phone]}
module.exports=async function handler(req,res){
 if(req.method==='GET' && req.query && req.query.qr){
  const token=String(req.query.qr||'').trim();
  if(!/^[a-f0-9]{48}$/.test(token))return res.status(400).send('INVALID_QR_TOKEN');
  try{
   const payload=`BES:${token}`;
   const png=await QRCode.toBuffer(payload,{type:'png',width:420,margin:2,errorCorrectionLevel:'M',color:{dark:'#000000FF',light:'#00000000'}});
   res.setHeader('Content-Type','image/png');
   res.setHeader('Cache-Control','public, max-age=31536000, immutable');
   return res.status(200).send(png);
  }catch(e){console.error('qr generation failed',e);return res.status(500).send('QR_FAILED')}
 }
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 try{
  const b=req.body||{};
  if(b.action==='check-email'){
   res.setHeader('Cache-Control','no-store');
   const email=normalizeEmail(b.email);
   return res.status(200).json({exists:await emailExists(db(),email)});
  }
  const required=['firstName','lastName','phone','email','opticalStore','role','city','streetAddress','usesMyopiaManagement','knowsMyoless'];
  if(!b.partnerAnswers||['rooft'].some(k=>!String(b.partnerAnswers[k]||'').trim()))return res.status(400).json({error:'MISSING_PARTNER_ANSWERS'});
  if(!b.gdprConsent||b.imageConsent!==true||required.some(k=>!String(b[k]??'').trim()))return res.status(400).json({error:'MISSING_FIELDS'});
  if(!/^.{3,}\s*,?\s+(?:nr\.?\s*)?\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?$/i.test(String(b.streetAddress||'').trim()))return res.status(400).json({error:'INVALID_STREET_ADDRESS'});
  // Revalidate the street against mapped Moldova street names on the server.
  const streetParts=String(b.streetAddress||'').trim().match(/^(.+?)\s*,?\s+(?:nr\.?\s*)?(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?)$/i);
  if(!streetParts)return res.status(400).json({error:'INVALID_STREET_ADDRESS'});
  try{
   const u=new URL('https://photon.komoot.io/api/');u.searchParams.set('q',streetParts[1]+', '+String(b.city||'')+', Moldova');u.searchParams.set('limit','15');
   const r=await fetch(u,{headers:{'User-Agent':'BES-Event-Registration/1.0 (address validation)'}});
   if(!r.ok)throw new Error('geocoding failed');const result=await r.json();
   const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
   if(!(result.features||[]).some(x=>x.properties?.countrycode==='MD'&&norm(x.properties.street)===norm(streetParts[1])))return res.status(400).json({error:'INVALID_STREET_ADDRESS'});
  }catch(e){console.error('street verification',e.message);return res.status(503).json({error:'STREET_LOOKUP_UNAVAILABLE'})}
  const email=normalizeEmail(b.email);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'INVALID_EMAIL'});
  if(String(b.country||'MD').toUpperCase()!=='MD')return res.status(400).json({error:'MOLDOVA_ONLY'});
  const phone=normalizePhone(b.phone);
  if(!phone.startsWith('+373'))return res.status(400).json({error:'MOLDOVA_ONLY'});
  const store=db();
  const emailRef=store.collection('bes_email_keys').doc(emailKey(email));
  const phoneRef=store.collection('bes_phone_keys').doc(phone);
  const legacyPhoneRef=phone.startsWith('+40')?store.collection('bes_phone_keys').doc('0'+phone.slice(3)):null;
  const counterRef=store.collection('bes_meta').doc('registration_counter');
  const regRef=store.collection('bes_registrations').doc();
  let participationCode='';
  const qrToken=crypto.randomBytes(24).toString('hex');
  await store.runTransaction(async tx=>{
   const phoneSnap=await tx.get(phoneRef);
   const legacyPhoneSnap=legacyPhoneRef?await tx.get(legacyPhoneRef):null;
   const counterSnap=await tx.get(counterRef);
   if(await emailExists(store,email,ref=>tx.get(ref)))throw new Error('DUPLICATE_EMAIL');
   if(phoneSnap.exists||(legacyPhoneSnap&&legacyPhoneSnap.exists))throw new Error('DUPLICATE_PHONE');
   const seq=(counterSnap.exists?Number(counterSnap.data().value)||0:0)+1;
   participationCode='BES-'+String(seq).padStart(4,'0');
   const now=admin.firestore.FieldValue.serverTimestamp();
   tx.set(counterRef,{value:seq},{merge:true});
   tx.set(phoneRef,{registrationId:regRef.id,createdAt:now});
   tx.set(emailRef,{registrationId:regRef.id,createdAt:now});
   tx.set(regRef,{
    participationCode,firstName:String(b.firstName).trim(),lastName:String(b.lastName).trim(),
    phoneNormalized:phone,email,
    opticalStore:String(b.opticalStore).trim(),role:String(b.role).trim(),
    city:String(b.city).trim(),county:String(b.county||'').trim(),country:'MD',
    streetAddress:String(b.streetAddress).trim(),
    partnerAnswers:b.partnerAnswers,
    gdprConsent:true,gdprConsentAt:now,imageConsent:true,imageConsentAt:now,language:normalizeLanguage(b.language),qrToken,event:'Brand Experience Summit 2026',giftDelivered:false,confirmationEmailSent:false,reminderSent:false,registeredAt:now
   });
  });
  await sendRegistrationConfirmation(regRef).catch(e=>console.error('confirmation email failed',e.message));
  return res.status(201).json({ok:true,participationCode});
 }catch(e){
  if(e.message==='DUPLICATE_EMAIL')return res.status(409).json({error:'DUPLICATE_EMAIL'});
  if(e.message==='INVALID_EMAIL')return res.status(400).json({error:'INVALID_EMAIL'});
  if(e.message==='DUPLICATE_PHONE')return res.status(409).json({error:'DUPLICATE_PHONE'});
  if(e.message==='INVALID_PHONE')return res.status(400).json({error:'INVALID_PHONE'});
  console.error('BES registration failed:',e);return res.status(500).json({error: e.message==='BES_FIREBASE_ADMIN_CONFIG is not configured'?'DATABASE_NOT_CONFIGURED':'SAVE_FAILED'});
 }
}
