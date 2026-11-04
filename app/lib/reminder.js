const {EVENT}=require('./event');
const {normalizeLanguage}=require('./language');
const crypto=require('crypto');
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function localYmd(date=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:EVENT.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const o=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${o.year}-${o.month}-${o.day}`;
}
function dayBefore(ymd){const [y,m,d]=ymd.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d));x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)}
function isReminderDay(now=new Date()){return localYmd(now)===dayBefore(EVENT.date)}
function reminderKey(id){return `snoo-2026-reminder/${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}/${EVENT.date}`}
function confirmationKey(id){return `snoo-2026-confirmation/${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`}
const logoUrl='https://avvero-x-snoo.vercel.app/avvero-logo-secundar.png';

const appUrl='https://avvero-x-snoo.vercel.app';
function qrBlock(r={},lang='ro'){
 const token=String(r.qrToken||'').trim();
 if(!/^[a-f0-9]{48}$/.test(token))return '';
 const en=lang==='en';
 const src=`${appUrl}/api/register?qr=${encodeURIComponent(token)}`;
 return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;margin:28px 0 8px"><tr><td align="center"><div style="font-size:16px;line-height:24px;font-weight:700;margin:0 0 14px">${lang==='ru'?'Ваш персональный QR-код для входа':en?'Your personal check-in QR code':'Codul tău QR personal pentru acces'}</div><img src="${src}" alt="${lang==='ru'?'Персональный QR-код для входа':en?'Personal check-in QR code':'Cod QR personal pentru acces'}" width="220" border="0" style="display:block;width:220px;height:220px;border:0;margin:0 auto"><div style="font-size:13px;line-height:20px;color:#697371;margin:12px 0 0">${lang==='ru'?'Пожалуйста, подготовьте этот QR-код для предъявления на стойке регистрации.':en?'Please have this QR code ready at reception.':'Te rugăm să ai acest cod QR pregătit la recepție.'}</div></td></tr></table>`;
}
async function ensureQrToken(docRef,r={}){
 const current=String(r.qrToken||'').trim();
 if(/^[a-f0-9]{48}$/.test(current))return {...r,qrToken:current};
 const qrToken=crypto.randomBytes(24).toString('hex');
 await docRef.update({qrToken});
 return {...r,qrToken};
}

function shell(content,lang='ro'){return `<!doctype html><html lang="${normalizeLanguage(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media only screen and (max-width:700px){.email-wrap{width:100%!important}.email-cell{padding:30px 24px!important}.email-title{font-size:30px!important;line-height:36px!important}}</style></head><body style="margin:0;padding:0;background:#f1f0eb;color:#162325;font-family:Arial,sans-serif"><table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f0eb" style="width:100%;background:#f1f0eb"><tr><td align="center" style="padding:36px 12px"><!--[if mso]><table role="presentation" width="680" border="0" cellspacing="0" cellpadding="0"><tr><td><![endif]--><table role="presentation" class="email-wrap" width="680" border="0" cellspacing="0" cellpadding="0" bgcolor="#f7f6f2" style="width:100%;max-width:680px;background:#f7f6f2;border:1px solid #d5d7d2;border-collapse:separate"><tr><td class="email-cell" style="padding:44px 46px"><img src="${logoUrl}" alt="Avvero" width="170" border="0" style="display:block;width:170px;height:auto;border:0;margin:0 0 10px"><div style="font-size:11px;line-height:16px;letter-spacing:3px;color:#697371;font-weight:700;margin:0 0 28px">AVVERO × SNOO 2026</div>${content}</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`}
function langOf(r={}){return normalizeLanguage(r.language)}
function eventTitle(lang){return lang==='ru'?EVENT.titleRu:lang==='en'?(EVENT.titleEn||EVENT.title):EVENT.title}
function eventBox(lang='ro'){
 const copy={ro:['Data','sâmbătă, 17 octombrie 2026','Ora','Locația','ROMEXPO, București'],en:['Date','Saturday, 17 October 2026','Time','Location','ROMEXPO, Bucharest'],ru:['Дата','суббота, 17 октября 2026','Время','Место','ROMEXPO, Бухарест']}[normalizeLanguage(lang)];
 return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border:1px solid #d5d7d2;margin:0 0 26px"><tr><td style="padding:20px 22px;font-size:16px;line-height:24px"><strong>${copy[0]}:</strong> ${copy[1]}<br><strong>${copy[2]}:</strong> ${esc(EVENT.time)}<br><strong>${copy[3]}:</strong> ${copy[4]}</td></tr></table>`
}
function renderReminderEmail(r={}){
  const lang=langOf(r),en=lang==='en',first=esc(r.firstName||''),code=esc(r.participationCode||'');
  if(lang==='ru')return shell(`<h1 class="email-title" style="font-size:34px;line-height:41px;margin:0 0 24px">Завтра встречаемся на презентации Avvero x SNOO 2026!</h1><p style="font-size:16px;line-height:24px;margin:0 0 28px">Здравствуйте${first?', '+first:''}!</p><p style="font-size:16px;line-height:24px;margin:0 0 18px">Напоминаем, что завтра мы ждём вас на презентации Avvero:</p><p style="font-size:20px;line-height:28px;font-weight:700;margin:0 0 26px">${esc(eventTitle(lang))}</p>${eventBox(lang)}${code?`<p style="font-size:16px;line-height:24px;margin:26px 0 0">Ваш код участия: <strong style="letter-spacing:2px">${code}</strong></p>`:''}${qrBlock(r,lang)}<p style="font-size:16px;line-height:24px;margin:26px 0 0">И не забудьте: мы приготовили для вас <strong>подарок-сюрприз от Avvero</strong>.</p><p style="font-size:15px;line-height:23px;color:#697371;margin:34px 0 0">Команда Avvero</p>`,lang);
  if(en)return shell(`<h1 class="email-title" style="font-size:34px;line-height:41px;margin:0 0 24px">See you tomorrow at the Avvero x SNOO 2026 presentation!</h1><p style="font-size:16px;line-height:24px;margin:0 0 28px">Hello${first?', '+first:''},</p><p style="font-size:16px;line-height:24px;margin:0 0 18px">A quick reminder that we look forward to seeing you tomorrow at the Avvero presentation:</p><p style="font-size:20px;line-height:28px;font-weight:700;margin:0 0 26px">${esc(eventTitle(lang))}</p>${eventBox(lang)}${code?`<p style="font-size:16px;line-height:24px;margin:26px 0 0">Your participation code: <strong style="letter-spacing:2px">${code}</strong></p>`:''}${qrBlock(r,lang)}<p style="font-size:16px;line-height:24px;margin:26px 0 0">And don’t forget: we have a <strong>surprise Avvero gift</strong> waiting for you.</p><p style="font-size:15px;line-height:23px;color:#697371;margin:34px 0 0">The Avvero Team</p>`,lang);
  return shell(`<h1 class="email-title" style="font-size:34px;line-height:41px;margin:0 0 24px">Mâine ne vedem la prezentarea Avvero x SNOO 2026!</h1><p style="font-size:16px;line-height:24px;margin:0 0 28px">Bună${first?', '+first:''},</p><p style="font-size:16px;line-height:24px;margin:0 0 18px">Îți reamintim că mâine te așteptăm la prezentarea Avvero:</p><p style="font-size:20px;line-height:28px;font-weight:700;margin:0 0 26px">${esc(EVENT.title)}</p>${eventBox(lang)}${code?`<p style="font-size:16px;line-height:24px;margin:26px 0 0">Codul tău de participare: <strong style="letter-spacing:2px">${code}</strong></p>`:''}${qrBlock(r,lang)}<p style="font-size:16px;line-height:24px;margin:26px 0 0">Și nu uita: avem pregătit pentru tine și un <strong>cadou surpriză Avvero</strong>.</p><p style="font-size:15px;line-height:23px;color:#697371;margin:34px 0 0">Echipa Avvero</p>`,lang);
}
function renderConfirmationEmail(r={}){
  const lang=langOf(r),en=lang==='en',first=esc(r.firstName||''),code=esc(r.participationCode||'');
  if(lang==='ru')return shell(`<h1 class="email-title" style="font-size:34px;line-height:41px;margin:0 0 24px">Вы зарегистрированы! До встречи на презентации Avvero.</h1><p style="font-size:16px;line-height:24px;margin:0 0 28px">Здравствуйте${first?', '+first:''}!</p><p style="font-size:16px;line-height:24px;margin:0 0 18px">Спасибо за регистрацию на презентацию Avvero:</p><p style="font-size:20px;line-height:28px;font-weight:700;margin:0 0 26px">${esc(eventTitle(lang))}</p>${eventBox(lang)}${code?`<p style="font-size:16px;line-height:24px;margin:26px 0 0">Ваш код участия: <strong style="letter-spacing:2px">${code}</strong></p>`:''}${qrBlock(r,lang)}<p style="font-size:16px;line-height:24px;margin:26px 0 0">До встречи на презентации, где вы получите <strong>набор Myoless</strong> с полезными материалами для вас и вашей оптики.</p><p style="font-size:16px;line-height:24px;margin:18px 0 0">Сохраните это письмо для идентификации.</p><p style="font-size:15px;line-height:23px;color:#697371;margin:34px 0 0">Команда Avvero</p>`,lang);
  if(en)return shell(`<h1 class="email-title" style="font-size:34px;line-height:41px;margin:0 0 24px">You’re registered! See you at the Avvero presentation.</h1><p style="font-size:16px;line-height:24px;margin:0 0 28px">Hello${first?', '+first:''},</p><p style="font-size:16px;line-height:24px;margin:0 0 18px">Thank you for registering for the Avvero presentation:</p><p style="font-size:20px;line-height:28px;font-weight:700;margin:0 0 26px">${esc(eventTitle(lang))}</p>${eventBox(lang)}${code?`<p style="font-size:16px;line-height:24px;margin:26px 0 0">Your participation code: <strong style="letter-spacing:2px">${code}</strong></p>`:''}${qrBlock(r,lang)}<p style="font-size:16px;line-height:24px;margin:26px 0 0">You’re registered! See you at the presentation, where you will receive the <strong>Myoless Kit</strong> with useful materials for you and your optical store.</p><p style="font-size:16px;line-height:24px;margin:18px 0 0">Keep this email for identification.</p><p style="font-size:15px;line-height:23px;color:#697371;margin:34px 0 0">The Avvero Team</p>`,lang);
  return shell(`<h1 class="email-title" style="font-size:34px;line-height:41px;margin:0 0 24px">Te-ai înscris! Ne vedem la prezentarea Avvero.</h1><p style="font-size:16px;line-height:24px;margin:0 0 28px">Bună${first?', '+first:''},</p><p style="font-size:16px;line-height:24px;margin:0 0 18px">Îți mulțumim pentru înscriere la prezentarea Avvero:</p><p style="font-size:20px;line-height:28px;font-weight:700;margin:0 0 26px">${esc(EVENT.title)}</p>${eventBox(lang)}${code?`<p style="font-size:16px;line-height:24px;margin:26px 0 0">Codul tău de participare: <strong style="letter-spacing:2px">${code}</strong></p>`:''}${qrBlock(r,lang)}<p style="font-size:16px;line-height:24px;margin:26px 0 0">Te-ai înscris! Ne vedem la prezentare, unde vei primi <strong>Kit-ul Myoless</strong> cu materiale utile pentru tine și optica ta.</p><p style="font-size:16px;line-height:24px;margin:18px 0 0">Păstrează acest email pentru identificare.</p><p style="font-size:15px;line-height:23px;color:#697371;margin:34px 0 0">Echipa Avvero</p>`,lang);
}
function renderReminderText(r={}){
 const en=langOf(r)==='en',first=String(r.firstName||'').trim(),code=String(r.participationCode||'').trim();
 if(langOf(r)==='ru')return [`Здравствуйте${first?', '+first:''}!`,'Завтра ждём вас на презентации Avvero:',eventTitle('ru'),'Дата: суббота, 17 октября 2026',`Время: ${EVENT.time}`,'Место: ROMEXPO, Бухарест',code?`Ваш код участия: ${code}`:'','Мы приготовили для вас подарок-сюрприз от Avvero.','','Команда Avvero'].filter(Boolean).join('\n');
 return en?[`Hello${first?', '+first:''},`,'',`A quick reminder that we look forward to seeing you tomorrow at the Avvero presentation:`,eventTitle('en'),'',`Date: Saturday, 17 October 2026`,`Time: ${EVENT.time}`,`Location: ${EVENT.location}`,code?`Your participation code: ${code}`:'','',`We have a surprise Avvero gift waiting for you.`,'','The Avvero Team'].filter(Boolean).join('\n'):[`Bună${first?', '+first:''},`,'',`Îți reamintim că mâine te așteptăm la prezentarea Avvero:`,EVENT.title,'',`Data: sâmbătă, 17 octombrie 2026`,`Ora: ${EVENT.time}`,`Locația: ${EVENT.location}`,code?`Codul tău de participare: ${code}`:'','',`Avem pregătit pentru tine și un cadou surpriză Avvero.`,'','Echipa Avvero'].filter(Boolean).join('\n');
}
function renderConfirmationText(r={}){
 const en=langOf(r)==='en',first=String(r.firstName||'').trim(),code=String(r.participationCode||'').trim();
 if(langOf(r)==='ru')return [`Здравствуйте${first?', '+first:''}!`,'Спасибо за регистрацию на презентацию Avvero:',eventTitle('ru'),'Дата: суббота, 17 октября 2026',`Время: ${EVENT.time}`,'Место: ROMEXPO, Бухарест',code?`Ваш код участия: ${code}`:'','Вы зарегистрированы! До встречи на презентации, где вы получите набор Myoless с полезными материалами для вас и вашей оптики.','Сохраните это письмо для идентификации.','Команда Avvero'].filter(Boolean).join('\n');
 return en?[`Hello${first?', '+first:''},`,'',`Thank you for registering for the Avvero presentation:`,eventTitle('en'),'',`Date: Saturday, 17 October 2026`,`Time: ${EVENT.time}`,`Location: ${EVENT.location}`,code?`Your participation code: ${code}`:'','',`You’re registered! See you at the presentation, where you will receive the Myoless Kit with useful materials for you and your optical store.`,`Keep this email for identification.`,'','The Avvero Team'].filter(Boolean).join('\n'):[`Bună${first?', '+first:''},`,'',`Îți mulțumim pentru înscriere la prezentarea Avvero:`,EVENT.title,'',`Data: sâmbătă, 17 octombrie 2026`,`Ora: ${EVENT.time}`,`Locația: ${EVENT.location}`,code?`Codul tău de participare: ${code}`:'','',`Te-ai înscris! Ne vedem la prezentare, unde vei primi Kit-ul Myoless cu materiale utile pentru tine și optica ta.`,`Păstrează acest email pentru identificare.`,'','Echipa Avvero'].filter(Boolean).join('\n');
}
function sender(){
  const email=String(process.env.SNOO_BREVO_SENDER_EMAIL||'').trim();
  if(!email)throw new Error('SNOO_BREVO_SENDER_EMAIL is not configured');
  return {name:'AVVERO x SNOO 2026',email};
}
async function sendWithBrevo({to,name='',subject,html,text,key,from,scheduledAt}){
  if(!process.env.BREVO_API_KEY)throw new Error('BREVO_API_KEY is not configured');
  const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{accept:'application/json','content-type':'application/json','api-key':process.env.BREVO_API_KEY},body:JSON.stringify({sender:from||sender(),replyTo:from||sender(),scheduledAt,to:[{email:to,name}],subject,htmlContent:html,textContent:text,headers:key?{'Idempotency-Key':key}:undefined})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||data.code||`BREVO_HTTP_${response.status}`);
  return data;
}
async function sendReminder(r,to,key){const lang=langOf(r),en=lang==='en';return sendWithBrevo({to:to||r.email,name:[r.firstName,r.lastName].filter(Boolean).join(' '),subject:lang==='ru'?'Завтра встречаемся на презентации Avvero x SNOO 2026!':en?'See you tomorrow at the Avvero x SNOO 2026 presentation!':'Mâine ne vedem la prezentarea Avvero x SNOO 2026!',html:renderReminderEmail(r),text:renderReminderText(r),key})}
async function sendConfirmation(r,to,key){const lang=langOf(r),en=lang==='en';return sendWithBrevo({to:to||r.email,name:[r.firstName,r.lastName].filter(Boolean).join(' '),subject:lang==='ru'?'Регистрация на презентацию Avvero x SNOO 2026 подтверждена':en?'Registration confirmed for the Avvero x SNOO 2026 presentation':'Înscriere confirmată la prezentarea Avvero x SNOO 2026',html:renderConfirmationEmail(r),text:renderConfirmationText(r),key})}
async function sendRegistrationConfirmation(docRef){
  await require('./final-reminder').scheduleFinalReminder(docRef).catch(e=>console.error('final reminder scheduling failed',e.message));
  const {admin}=require('./admin/firebase');
  const snap=await docRef.get();if(!snap.exists)return {skipped:true};let r=snap.data();
  if(!r.email||r.confirmationEmailSent===true)return {skipped:true};
  r=await ensureQrToken(docRef,r);
  try{const data=await sendConfirmation(r,r.email,confirmationKey(docRef.id));await docRef.update({confirmationEmailSent:true,confirmationEmailSentAt:admin.firestore.FieldValue.serverTimestamp(),confirmationEmailId:data&&data.messageId||null,confirmationEmailError:admin.firestore.FieldValue.delete()});return {sent:true,id:data&&data.messageId||null}}
  catch(e){await docRef.update({confirmationEmailSent:false,confirmationEmailLastAttemptAt:admin.firestore.FieldValue.serverTimestamp(),confirmationEmailError:String(e.message||e).slice(0,500)}).catch(()=>{});throw e}
}
async function sendParticipantReminder(doc){
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
module.exports={shell,esc,eventTitle,eventBox,qrBlock,langOf,localYmd,dayBefore,isReminderDay,reminderKey,confirmationKey,renderReminderEmail,renderConfirmationEmail,renderReminderText,renderConfirmationText,sendWithBrevo,sendReminder,sendConfirmation,sendRegistrationConfirmation,sendParticipantReminder,runConfirmationBackfill,runReminderBatch,ensureQrToken};
