const {EVENT}=require('./event');
const {normalizeLanguage}=require('./language');
const crypto=require('crypto');
function titleCaseName(v=''){return String(v||'').trim().toLocaleLowerCase('ro-RO').replace(/(^|[\s\-’'])(\p{L})/gu,(_,sep,c)=>sep+c.toLocaleUpperCase('ro-RO'))}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function localYmd(date=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:EVENT.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const o=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${o.year}-${o.month}-${o.day}`;
}
function dayBefore(ymd){const [y,m,d]=ymd.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d));x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)}
function isReminderDay(now=new Date()){return localYmd(now)===dayBefore(EVENT.date)}
function reminderKey(id){return `bes-2026-reminder/${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}/${EVENT.date}`}
function confirmationKey(id){return `bes-2026-confirmation/${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`}
const appUrl='https://bes-event.vercel.app';
function qrBlock(r={},lang='ro'){
 const numeric=String(r.numericCheckinCode||'').trim();
 const labels={
  ro:['PINUL TĂU DE CHECK-IN','La intrarea în eveniment, scanează codul QR afișat de organizatori. Se va deschide pagina de check-in, unde introduci personal PIN-ul tău din 4 cifre.'],
  en:['YOUR CHECK-IN PIN','At the event entrance, scan the QR code displayed by the organizers. Open the check-in page and enter your personal 4-digit PIN.'],
  ru:['ВАШ PIN-КОД ДЛЯ РЕГИСТРАЦИИ','На входе отсканируйте QR-код организаторов. Откройте страницу регистрации присутствия и самостоятельно введите свой четырёхзначный PIN-код.']
 }[lang]||[];
 return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #d6c5b5;border-radius:16px;background:#f7f1e9"><tr><td align="center" style="padding:27px 18px"><div style="font-size:11px;font-weight:bold;letter-spacing:2px;color:#9c754e">${esc(labels[0])}</div><div style="font-size:54px;line-height:1.4;letter-spacing:10px;font-weight:800;color:#172c2b">${/^\d{4}$/.test(numeric)?esc(numeric):'••••'}</div><div style="font-size:13px;line-height:21px;color:#65736d">${esc(labels[1])}</div></td></tr></table>`;
}

async function ensureQrToken(docRef,r={}){
 const current=String(r.qrToken||'').trim();
 if(/^[a-f0-9]{48}$/.test(current))return {...r,qrToken:current};
 const qrToken=crypto.randomBytes(24).toString('hex');
 await docRef.update({qrToken});
 return {...r,qrToken};
}

function langOf(r={}){return normalizeLanguage(r.language)}
function eventTitle(){return EVENT.title}
function eventBox(lang='ro'){
 const labels={ro:['DATA','ORA','LOCAȚIA'],en:['DATE','TIME','VENUE'],ru:['ДАТА','ВРЕМЯ','МЕСТО']}[lang]||[];
 const dates={ro:'Sâmbătă, 28 noiembrie 2026',en:'Saturday, 28 November 2026',ru:'Суббота, 28 ноября 2026'};
 return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #d9c9b8;border-bottom:1px solid #d9c9b8;margin:26px 0"><tr><td style="padding:20px 0;font-size:12px;color:#8b7056"><strong>${labels[0]}</strong><br><span style="font-size:15px;color:#203430">${dates[lang]}</span></td><td style="padding:20px 5px;font-size:12px;color:#8b7056"><strong>${labels[1]}</strong><br><span style="font-size:15px;color:#203430">09:30</span></td></tr><tr><td colspan="2" style="padding:0 0 20px;font-size:12px;color:#8b7056"><strong>${labels[2]}</strong><br><span style="font-size:15px;color:#203430">Capitoles Park, Chișinău</span></td></tr></table>`;
}
function shell(content,lang='ro'){
 const partners=[['sd-royal-white.png','Royal Optic'],['emy-mono.png','Emy Optic'],['totalmed-mono.png','Totalmed'],['avvero-mono.png','Avvero'],['rooft-mono.png','ROOFT']];
 const logos=partners.map(([file,name])=>`<td align="center" valign="middle" style="padding:8px 4px"><img src="${appUrl}/assets/${file}" alt="${name}" width="86" style="display:block;width:100%;max-width:86px;height:auto;border:0"></td>`).join('');
 return `<!doctype html><html lang="${normalizeLanguage(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>.email-title,.email-cell p,.email-cell td,.email-cell div{hyphens:none!important;-webkit-hyphens:none!important;word-break:normal!important;overflow-wrap:normal!important}.email-title{word-wrap:normal!important}@media(max-width:640px){.email-wrap{width:100%!important}.email-cell{padding:28px 22px!important}.email-title{font-size:32px!important;line-height:38px!important}.partner-logo{max-width:65px!important}}</style></head><body style="margin:0;background:#e9e6ed;font-family:Arial,Helvetica,sans-serif;color:#1d302d"><div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px">Brand Experience Summit 2026. Detaliile participării și codul tău de check-in. &nbsp; &nbsp; &nbsp;</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9e6ed"><tr><td align="center" style="padding:24px 10px"><table role="presentation" class="email-wrap" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fffaf5;border-radius:18px;overflow:hidden"><tr><td style="background:#0c262a;padding:30px 32px"><img src="${appUrl}/assets/bes-logo-email.png" width="180" alt="BES · Brand Experience Summit" style="display:block;width:180px;height:auto;max-width:100%"><div style="color:#d9b98a;font-size:10px;letter-spacing:2px;margin-top:22px">28 NOIEMBRIE 2026 · CHIȘINĂU &nbsp;&nbsp; · &nbsp;&nbsp; BRAND EXPERIENCE SUMMIT 2026. &nbsp; &nbsp; &nbsp;</div></td></tr><tr><td class="email-cell" style="padding:40px 38px">${content}<div style="margin-top:30px;font-size:12px;color:#8c827b">BRAND EXPERIENCE SUMMIT 2026</div></td></tr><tr><td style="background:#102a2e;padding:20px 13px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${logos}</tr></table><p style="text-align:center;color:#bdc9c6;font-size:10px;letter-spacing:1px;margin:12px 0 0">MORE BRANDS. MORE KNOWLEDGE. MORE BUSINESS.</p></td></tr></table></td></tr></table></body></html>`;
}
const copy={
 ro:{
  confirmation:['Locul tău este confirmat. Experiența începe aici.','Îți mulțumim pentru înscriere. Pe 28 noiembrie, profesioniștii din optică și oftalmologie se întâlnesc la Chișinău pentru idei, conexiuni și perspective noi.','Păstrează acest e-mail. Codul de mai jos îți permite să confirmi prezența la eveniment.'],
  r1:['Mai sunt 7 zile. Pregătește-te pentru BES.','O săptămână ne desparte de Brand Experience Summit. Te așteaptă discuții relevante, parteneri din industrie și oportunități de colaborare.','Codul tău de acces este pregătit. Îl vei regăsi în fiecare mesaj.'],
  r2:['Mâine ne întâlnim la Brand Experience Summit.','Ultimele pregătiri sunt în desfășurare. Mâine, la Capitoles Park, ne reunim pentru o zi dedicată viitorului opticii și oftalmologiei.','Păstrează codul la îndemână pentru check-in.'],
  r3:['Astăzi este ziua BES. Te așteptăm la 09:30.','Brand Experience Summit începe în această dimineață. Ne vedem la Capitoles Park, Chișinău.','La sosire, introdu codul de 4 cifre pentru a confirma prezența.']},
 en:{
  confirmation:['Your place is confirmed. The experience starts here.','Thank you for registering. On 28 November, optical and ophthalmology professionals meet in Chișinău to exchange ideas, build connections and explore new perspectives.','Keep this email. Your code below lets you check in at the event.'],
  r1:['7 days to go. Get ready for BES.','In one week, Brand Experience Summit brings together industry partners, meaningful conversations and new opportunities.','Your access code is ready. You will find it in every message.'],
  r2:['Tomorrow, we meet at Brand Experience Summit.','Final preparations are underway. Join us tomorrow at Capitoles Park for a day dedicated to the future of optics and ophthalmology.','Keep your code handy for check-in.'],
  r3:['Today is BES day. See you at 09:30.','Brand Experience Summit begins this morning. We look forward to seeing you at Capitoles Park, Chișinău.','Enter your 4-digit code when you arrive to confirm attendance.']},
 ru:{
  confirmation:['Ваше участие подтверждено. Всё начинается здесь.','Спасибо за регистрацию. 28 ноября специалисты оптики и офтальмологии встретятся в Кишинёве для обмена идеями и новых профессиональных знакомств.','Сохраните это письмо. Код ниже позволит подтвердить присутствие на мероприятии.'],
  r1:['До BES осталось 7 дней.','Через неделю Brand Experience Summit объединит партнёров отрасли, профессиональные дискуссии и новые возможности.','Ваш код доступа уже готов. Он будет в каждом письме.'],
  r2:['Уже завтра встречаемся на Brand Experience Summit.','Последние приготовления идут полным ходом. Ждём вас завтра в Capitoles Park на встрече, посвящённой будущему оптики и офтальмологии.','Держите код под рукой для регистрации на входе.'],
  r3:['Сегодня BES. Ждём вас в 09:30.','Brand Experience Summit начинается сегодня утром. До встречи в Capitoles Park, Кишинёв.','При входе введите свой 4-значный код для подтверждения присутствия.']}
};
function contentFor(r,stage){
 const lang=langOf(r),c=copy[lang][stage],first=esc(titleCaseName(r.firstName));
 const greeting=lang==='en'?'Hello':lang==='ru'?'Здравствуйте':'Bună';
 const html=shell(`<div style="font-size:11px;letter-spacing:2px;color:#a47a52;font-weight:bold;margin-bottom:12px">BRAND EXPERIENCE SUMMIT · 2026</div><h1 class="email-title" style="font-size:39px;line-height:45px;letter-spacing:-1px;margin:0 0 24px;color:#1a302d">${esc(c[0])}</h1><p style="font-size:17px;line-height:27px;margin:0 0 14px">${greeting}${first?', '+first:''}!</p><p style="font-size:16px;line-height:26px;color:#52615e;margin:0 0 16px">${esc(c[1])}</p>${eventBox(lang)}<p style="font-size:15px;line-height:24px;color:#52615e">${esc(c[2])}</p>${qrBlock(r,lang)}`,lang);
 const text=[c[0],greeting+(first?', '+first:'')+'!',c[1],EVENT.title,'28.11.2026 · 09:30 · Capitoles Park, Chișinău',c[2],`Check-in: ${r.numericCheckinCode||''}`,`QR: ${appUrl}/api/register?qr=${r.qrToken||''}`].join('\\n\\n');
 return {subject:c[0]+' | BES 2026',html,text};
}
function renderReminderEmail(r={}){return contentFor(r,'r2').html}
function renderConfirmationEmail(r={}){return contentFor(r,'confirmation').html}
function renderReminderText(r={}){return contentFor(r,'r2').text}
function renderConfirmationText(r={}){return contentFor(r,'confirmation').text}
function sender(){const email=process.env.BES_BREVO_SENDER_EMAIL||'';if(!email)throw Error('BES_BREVO_SENDER_EMAIL is not configured');return {name:process.env.BES_BREVO_SENDER_NAME||'Brand Experience Summit',email}}
async function sendWithBrevo({to,name='',subject,html,text,key,from,scheduledAt}){
  if(!process.env.BREVO_API_KEY)throw new Error('BREVO_API_KEY is not configured');
  const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{accept:'application/json','content-type':'application/json','api-key':process.env.BREVO_API_KEY},body:JSON.stringify({sender:from||sender(),replyTo:from||sender(),scheduledAt,to:[{email:to,name}],subject,htmlContent:html,textContent:text,headers:key?{'Idempotency-Key':key}:undefined})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    // Never include API credentials or request headers in error output.
    const message=String(data.message||'').slice(0,160);
    const code=String(data.code||'').slice(0,80);
    let reason=`BREVO_HTTP_${response.status}`;
    if(response.status===401||response.status===403){
      reason=/key not found|invalid.*key|unauthorized|authentication/i.test(message+' '+code)
        ? 'BREVO_API_KEY_INVALID_OR_NOT_RECOGNIZED'
        : 'BREVO_AUTHORIZATION_REJECTED';
    }else if(response.status===400){reason='BREVO_REQUEST_REJECTED';}
    else if(response.status===429){reason='BREVO_RATE_LIMIT';}
    throw new Error(`${reason} (HTTP ${response.status})${message?' · '+message:''}`);
  }
  return data;
}
async function sendReminder(r,to,key,stage='r2'){const c=contentFor(r,stage);return sendWithBrevo({to:to||r.email,name:[r.firstName,r.lastName].filter(Boolean).map(titleCaseName).join(' '),...c,key})}
async function sendConfirmation(r,to,key){return sendWithBrevo({to:to||r.email,name:[r.firstName,r.lastName].filter(Boolean).map(titleCaseName).join(' '),...contentFor(r,'confirmation'),key})}
async function sendRegistrationConfirmation(docRef){
  if(process.env.BES_EMAILS_ENABLED!=='true')return {skipped:true,reason:'BES_EMAILS_DISABLED'};
  const {admin}=require('./admin/firebase');
  const snap=await docRef.get();if(!snap.exists)return {skipped:true};let r=snap.data();
  if(!r.email||r.confirmationEmailSent===true)return {skipped:true};
  if(!/^\d{4}$/.test(String(r.numericCheckinCode||'')))throw new Error('MISSING_4_DIGIT_CHECKIN_CODE');
  r=await ensureQrToken(docRef,r);
  try{const data=await sendConfirmation(r,r.email,confirmationKey(docRef.id));await docRef.update({confirmationEmailSent:true,confirmationEmailSentAt:admin.firestore.FieldValue.serverTimestamp(),confirmationEmailId:data&&data.messageId||null,confirmationEmailError:admin.firestore.FieldValue.delete()});return {sent:true,id:data&&data.messageId||null}}
  catch(e){await docRef.update({confirmationEmailSent:false,confirmationEmailLastAttemptAt:admin.firestore.FieldValue.serverTimestamp(),confirmationEmailError:String(e.message||e).slice(0,500)}).catch(()=>{});throw e}
}
async function sendParticipantReminder(doc){
  if(process.env.BES_EMAILS_ENABLED!=='true')return {skipped:true,reason:'BES_EMAILS_DISABLED'};
  const {admin}=require('./admin/firebase');
  let r=doc.data();if(!r.email||r.reminderSent===true)return {skipped:true};
  r=await ensureQrToken(doc.ref,r);
  try{const data=await sendReminder(r,r.email,reminderKey(doc.id));await doc.ref.update({reminderSent:true,reminderSentAt:admin.firestore.FieldValue.serverTimestamp(),reminderEmailId:data&&data.messageId||null,reminderError:admin.firestore.FieldValue.delete()});return {sent:true,id:data&&data.messageId||null}}
  catch(e){await doc.ref.update({reminderSent:false,reminderLastAttemptAt:admin.firestore.FieldValue.serverTimestamp(),reminderError:String(e.message||e).slice(0,500)}).catch(()=>{});return {error:String(e.message||e)}}
}

async function runConfirmationBackfill(){
  const {getFirestore}=require('./admin/firebase');
  const snap=await getFirestore().collection('bes_registrations').get();
  let sent=0,skipped=0,errors=0;
  for(const doc of snap.docs){
    const r=doc.data();
    if(!r.email||r.confirmationEmailSent===true){skipped++;continue}
    try{const out=await sendRegistrationConfirmation(doc.ref);if(out.sent)sent++;else skipped++}catch(e){errors++}
  }
  return {total:snap.size,sent,skipped,errors};
}
async function runReminderBatch(){const {getFirestore}=require('./admin/firebase');const snap=await getFirestore().collection('bes_registrations').get();let sent=0,skipped=0,errors=0;for(const doc of snap.docs){const r=await sendParticipantReminder(doc);if(r.sent)sent++;else if(r.error)errors++;else skipped++}return {total:snap.size,sent,skipped,errors}}
module.exports={contentFor,copy,shell,esc,eventTitle,eventBox,qrBlock,langOf,localYmd,dayBefore,isReminderDay,reminderKey,confirmationKey,renderReminderEmail,renderConfirmationEmail,renderReminderText,renderConfirmationText,sendWithBrevo,sendReminder,sendConfirmation,sendRegistrationConfirmation,sendParticipantReminder,runConfirmationBackfill,runReminderBatch,ensureQrToken};
