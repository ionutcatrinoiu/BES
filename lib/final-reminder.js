const {shell,esc,eventTitle,eventBox,qrBlock,langOf,ensureQrToken,sendWithBrevo}=require('./reminder');
const FINAL_AT='2026-11-28T05:30:00.000Z';
function finalReminderContent(r={}){
 const lang=langOf(r),copy={
  ro:{subject:'Astăzi, la 09:30, ne vedem la Brand Experience Summit 2026!',hello:'Bună',intro:'Te așteptăm astăzi, de la ora 09:30, la prezentarea Avvero din cadrul Brand Experience Summit 2026, la Capitoles Park, Chișinău.',code:'Codul tău de participare',gift:'Pregătește codul QR pentru acces. Te așteaptă și cadoul surpriză Avvero.',team:'Echipa Avvero'},
  en:{subject:'See you today at 09:30 at Brand Experience Summit 2026!',hello:'Hello',intro:'We look forward to seeing you today at 09:30 at the Avvero presentation during Brand Experience Summit 2026, at Capitoles Park, Chișinău.',code:'Your participation code',gift:'Please have your QR code ready for check-in. Your surprise Avvero gift awaits.',team:'The Avvero Team'},
  ru:{subject:'Сегодня в 09:30 встречаемся на Brand Experience Summit 2026!',hello:'Здравствуйте',intro:'Ждём вас сегодня в 09:30 на презентации Avvero в рамках Brand Experience Summit 2026 в Capitoles Park, Кишинёв.',code:'Ваш код участия',gift:'Подготовьте QR-код для входа. Вас также ждёт подарок-сюрприз от Avvero.',team:'Команда Avvero'}
 }[lang];
 const greeting=copy.hello+(r.firstName?', '+String(r.firstName):'');
 const html=shell(`<h1 class="email-title" style="font-size:34px;line-height:41px;margin:0 0 24px">${esc(copy.subject)}</h1><p>${esc(greeting)},</p><p style="font-size:16px;line-height:24px">${esc(copy.intro)}</p><p style="font-size:20px;line-height:28px;font-weight:700">${esc(eventTitle(lang))}</p>${eventBox(lang)}<p>${esc(copy.code)}: <strong>${esc(r.participationCode||'')}</strong></p>${qrBlock(r,lang)}<p>${esc(copy.gift)}</p><p>${esc(copy.team)}</p>`,lang);
 const text=[greeting,copy.intro,eventTitle(lang),'28.11.2026, 09:30, Capitoles Park, Chișinău',copy.code+': '+String(r.participationCode||''),copy.gift,copy.team].join('\n\n');
 return {subject:copy.subject,html,text};
}
async function scheduleFinalReminder(ref,now=new Date()){
 if(process.env.BES_EMAILS_ENABLED!=='true')return {skipped:true,reason:'BES_EMAILS_DISABLED'};
 const remaining=Date.parse(FINAL_AT)-now.getTime();
 if(remaining<=0||remaining>72*60*60*1000)return {skipped:true,reason:'OUTSIDE_SCHEDULING_WINDOW'};
 const {getFirestore,admin}=require('./admin/firebase');
 const participant=await getFirestore().runTransaction(async tx=>{
  const snap=await tx.get(ref);if(!snap.exists)return null;const r=snap.data();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.email||''))||r.finalReminderState)return null;
  tx.update(ref,{finalReminderState:'scheduling',finalReminderClaimedAt:admin.firestore.FieldValue.serverTimestamp()});return r;
 });
 if(!participant)return {skipped:true};
 try{
  const r=await ensureQrToken(ref,participant),content=finalReminderContent(r);
  const out=await sendWithBrevo({to:r.email,name:[r.firstName,r.lastName].filter(Boolean).join(' '),...content,from:{name:'BRAND EXPERIENCE SUMMIT 2026',email:'no-reply@avvero.ro'},scheduledAt:FINAL_AT,key:'bes-final-20261128/'+ref.id});
  if(!out||!out.messageId)throw Error('BREVO_MESSAGE_ID_MISSING');
  await ref.update({finalReminderState:'scheduled',finalReminderScheduledAt:FINAL_AT,finalReminderEmailId:out.messageId});
  return {scheduled:true,messageId:out.messageId};
 }catch(e){
  // An uncertain outcome is kept for review rather than silently scheduling twice.
  await ref.update({finalReminderState:'uncertain',finalReminderError:String(e.message||e).slice(0,400)}).catch(()=>{});
  return {error:true};
 }
}
async function runFinalReminderBatch(now=new Date()){
 if(process.env.BES_EMAILS_ENABLED!=='true')return {skipped:true,reason:'BES_EMAILS_DISABLED'};
 const remaining=Date.parse(FINAL_AT)-now.getTime();if(remaining<=0||remaining>72*60*60*1000)return {skipped:true,reason:'OUTSIDE_SCHEDULING_WINDOW'};
 const {getFirestore}=require('./admin/firebase'),snap=await getFirestore().collection('bes_registrations').get();
 const results=[];
 for(let offset=0;offset<snap.docs.length;offset+=5){const group=await Promise.all(snap.docs.slice(offset,offset+5).map(doc=>scheduleFinalReminder(doc.ref,now)));results.push(...group)}
 return {total:results.length,scheduled:results.filter(r=>r.scheduled).length,skipped:results.filter(r=>r.skipped).length,errors:results.filter(r=>r.error).length};
}
module.exports={FINAL_AT,finalReminderContent,scheduleFinalReminder,runFinalReminderBatch};
