const admin=require('firebase-admin');
const crypto=require('crypto');
const COLLECTION='bes2026_registrations';
function db(){if(!admin.apps.length){const raw=process.env.BES_FIREBASE_ADMIN_CONFIG;if(!raw)throw Error('BES_FIREBASE_ADMIN_CONFIG missing');admin.initializeApp({credential:admin.credential.cert(JSON.parse(raw))})}return admin.firestore()}
function clean(v,max=200){return String(v??'').trim().slice(0,max)}
function email(v){return clean(v,254).toLowerCase()}
function phone(v){let n=String(v||'').replace(/\D/g,'');if(n.startsWith('00373'))n=n.slice(2);if(/^0[67]\d{7}$/.test(n))n='373'+n.slice(1);if(!/^373[67]\d{7}$/.test(n))throw Error('INVALID_PHONE');return '+'+n}
function lang(v){return ['ro','en','ru'].includes(v)?v:'ro'}
function code(){return 'BES'+crypto.randomBytes(5).toString('hex').toUpperCase()}
function hash(v){return crypto.createHash('sha256').update(v).digest('hex')}
function secret(){return process.env.BES_ADMIN_SESSION_SECRET||''}
function sign(v){return crypto.createHmac('sha256',secret()).update(v).digest('hex')}
function safe(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function cookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)]}))}
function isAdmin(req){const token=cookies(req).bes_admin||'';const [ts,sig]=token.split('.');return !!secret()&&/^\d+$/.test(ts||'')&&safe(sig,sign(ts))&&Date.now()-Number(ts)<8*3600000&&Number(ts)<=Date.now()}
function setAdmin(res){const ts=String(Date.now());res.setHeader('Set-Cookie',`bes_admin=${ts}.${sign(ts)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`)}
function noStore(res){res.setHeader('Cache-Control','no-store')}
function isOpen(){const now=Date.now();return now>=Date.parse('2026-11-28T08:00:00+02:00')&&now<=Date.parse('2026-11-28T23:59:59+02:00')}
async function checkin(ref,method){let result;await db().runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)throw Error('NOT_FOUND');const d=snap.data();if(d.checkedInAt){result={already:true,name:d.firstName+' '+d.lastName};return}tx.update(ref,{checkedInAt:admin.firestore.FieldValue.serverTimestamp(),checkInMethod:method});result={already:false,name:d.firstName+' '+d.lastName}});return result}
module.exports={admin,db,COLLECTION,clean,email,phone,lang,code,hash,secret,safe,isAdmin,setAdmin,noStore,isOpen,checkin};