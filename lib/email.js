const crypto=require('crypto');
function normalizeEmail(value){const email=String(value||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('INVALID_EMAIL');return email}
function emailKey(email){return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex')}
async function emailExists(store,email,read=ref=>ref.get()){
 const normalized=normalizeEmail(email);
 const key=store.collection('bes_email_keys').doc(emailKey(normalized));
 const legacy=store.collection('bes_registrations').where('email','==',normalized).limit(1);
 const [keySnap,legacySnap]=await Promise.all([read(key),read(legacy)]);
 return keySnap.exists||!legacySnap.empty;
}
module.exports={normalizeEmail,emailKey,emailExists};
