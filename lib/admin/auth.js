const crypto=require('crypto');
const COOKIE='snoo_admin_session';
const MAX_AGE=8*60*60;
const b64=v=>Buffer.from(v).toString('base64url');
const unb64=v=>Buffer.from(v,'base64url').toString('utf8');
function secret(){const v=process.env.SNOO_ADMIN_SESSION_SECRET;if(!v||v.length<32)throw new Error('ADMIN_SESSION_SECRET_NOT_CONFIGURED');return v}
function sign(body){return crypto.createHmac('sha256',secret()).update(body).digest('base64url')}
function createSession(username){const body=b64(JSON.stringify({u:username,exp:Date.now()+MAX_AGE*1000}));return `${body}.${sign(body)}`}
function verifySession(token){try{const [body,sig]=String(token||'').split('.');if(!body||!sig)return null;const a=Buffer.from(sig),b=Buffer.from(sign(body));if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;const p=JSON.parse(unb64(body));if(!p.u||!p.exp||Date.now()>p.exp)return null;return p}catch{return null}}
function readSession(req){const raw=req.headers?.cookie||'';const item=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));return verifySession(item?decodeURIComponent(item.slice(COOKIE.length+1)):'')}
function setSessionCookie(res,token){res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`)}
function clearSessionCookie(res){res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`)}
function verifyPassword(password,stored){return new Promise(resolve=>{try{const [salt,hex]=String(stored||'').split(':');if(!salt||!hex)return resolve(false);const expected=Buffer.from(hex,'hex');crypto.scrypt(String(password||''),salt,expected.length,(err,key)=>{if(err||key.length!==expected.length)return resolve(false);resolve(crypto.timingSafeEqual(key,expected))})}catch{resolve(false)}})}
function noStore(res){res.setHeader('Cache-Control','no-store')}
module.exports={createSession,verifySession,readSession,setSessionCookie,clearSessionCookie,verifyPassword,noStore};
