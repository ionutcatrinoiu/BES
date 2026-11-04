const admin=require('firebase-admin');
const crypto=require('crypto');

const COOKIE='snoo_checkin_session';
const MAX_AGE=12*60*60;
function db(){
  if(!admin.apps.length){
    const raw=process.env.BES_FIREBASE_ADMIN_CONFIG;
    if(!raw) throw new Error('BES_FIREBASE_ADMIN_CONFIG is not configured');
    admin.initializeApp({credential:admin.credential.cert(JSON.parse(raw))});
  }
  return admin.firestore();
}
function secret(){return process.env.SNOO_ADMIN_SESSION_SECRET||''}
function pin(){return String(process.env.SNOO_CHECKIN_PIN||'')}
function sign(v){return crypto.createHmac('sha256',secret()).update(v).digest('hex')}
function safeEq(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function cookieMap(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return i<0?[v,'']:[v.slice(0,i),decodeURIComponent(v.slice(i+1))]}))}
function authorized(req){
  if(!secret()||!pin())return false;
  const raw=cookieMap(req)[COOKIE]||'';const [stamp,sig]=raw.split('.');
  if(!/^\d+$/.test(stamp)||!sig||!safeEq(sig,sign(stamp)))return false;
  const age=Math.floor(Date.now()/1000)-Number(stamp);return age>=0&&age<=MAX_AGE;
}
function setSession(res){const stamp=String(Math.floor(Date.now()/1000));const value=`${stamp}.${sign(stamp)}`;res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`)}
function extractToken(value=''){
  const raw=String(value||'').trim();
  const snoo=raw.match(/^SNOO:([a-f0-9]{48})$/i);if(snoo)return snoo[1].toLowerCase();
  if(/^[a-f0-9]{48}$/i.test(raw)) return raw.toLowerCase();
  try{const u=new URL(raw);const token=String(u.searchParams.get('token')||'').trim();if(/^[a-f0-9]{48}$/i.test(token))return token.toLowerCase()}catch(_e){}
  return '';
}
const iso=v=>v&&typeof v.toDate==='function'?v.toDate().toISOString():v||null;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ro-RO').replace(/\s+/g,' ').trim();
const digits=v=>String(v||'').replace(/\D/g,'');
const maskPhone=v=>{const d=digits(v);return d.length>=4?'••••••'+d.slice(-4):d};
function publicParticipant(doc){const x=doc.data();return {id:doc.id,participationCode:x.participationCode||'',firstName:x.firstName||'',lastName:x.lastName||'',opticalStore:x.opticalStore||'',phoneMasked:maskPhone(x.phoneNormalized||x.phone||''),checkedIn:x.checkedIn===true||!!x.checkedInAt,checkedInAt:iso(x.checkedInAt)}}
async function markPresent(store,ref,method){let result;await store.runTransaction(async tx=>{const fresh=await tx.get(ref);if(!fresh.exists)throw new Error('NOT_FOUND');const x=fresh.data();if(x.checkedInAt){result={already:true,participationCode:x.participationCode||'',firstName:x.firstName||'',lastName:x.lastName||'',checkedInAt:iso(x.checkedInAt)};return}const now=admin.firestore.Timestamp.now();tx.update(ref,{checkedIn:true,checkedInAt:now,checkInMethod:method});result={already:false,participationCode:x.participationCode||'',firstName:x.firstName||'',lastName:x.lastName||'',checkedInAt:now.toDate().toISOString()}});return result}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  try{
    const action=String(req.body&&req.body.action||'scan');
    if(action==='auth-status')return res.status(200).json({ok:true,authorized:authorized(req),configured:/^\d{4}$/.test(pin())&&!!secret()});
    if(action==='login'){
      if(!/^\d{4}$/.test(pin())||!secret())return res.status(503).json({error:'CHECKIN_AUTH_NOT_CONFIGURED'});
      const supplied=String(req.body&&req.body.pin||'');
      if(!/^\d{4}$/.test(supplied))return res.status(401).json({error:'INVALID_PIN'});
      if(!safeEq(supplied,pin()))return res.status(401).json({error:'INVALID_PIN'});
      setSession(res);return res.status(200).json({ok:true,authorized:true});
    }
    if(!authorized(req))return res.status(401).json({error:'CHECKIN_AUTH_REQUIRED'});
    const store=db();
    if(action==='search'){
      const q=String(req.body&&req.body.query||'').trim();
      if(q.length<3)return res.status(200).json({ok:true,results:[]});
      const nq=norm(q),qd=digits(q);const snap=await store.collection('bes_registrations').get();
      const results=snap.docs.filter(doc=>{const x=doc.data();const hay=norm([x.firstName,x.lastName,x.opticalStore,x.participationCode,x.email].join(' '));const ph=digits(x.phoneNormalized||x.phone||'');return hay.includes(nq)||(qd.length>=3&&ph.includes(qd))}).slice(0,8).map(publicParticipant);
      return res.status(200).json({ok:true,results});
    }
    if(action==='manual'){
      const id=String(req.body&&req.body.registrationId||'').trim();if(!id)return res.status(400).json({error:'INVALID_PARTICIPANT'});
      const ref=store.collection('bes_registrations').doc(id);const snap=await ref.get();if(!snap.exists)return res.status(404).json({error:'INVALID_PARTICIPANT'});
      const result=await markPresent(store,ref,'manual');return res.status(200).json({ok:true,...result});
    }
    const token=extractToken(req.body&&req.body.token);if(!token)return res.status(400).json({error:'INVALID_QR'});
    const snap=await store.collection('bes_registrations').where('qrToken','==',token).limit(1).get();if(snap.empty)return res.status(404).json({error:'INVALID_QR'});
    const result=await markPresent(store,snap.docs[0].ref,'qr');return res.status(200).json({ok:true,...result});
  }catch(e){console.error('checkin failed',e.message);return res.status(500).json({error:'CHECKIN_FAILED'})}
};
