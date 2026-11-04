const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),mail=require('../lib/reminder');
function setup(options={}){
 let record={email:'participant@example.com',firstName:'Ivan',language:'ru',participationCode:'BES-0001',qrToken:'a'.repeat(48),reminderSent:true},queue=Promise.resolve(),sent=[];
 const ref={id:'r1',update:async data=>{record={...record,...data}}};const snap=()=>({exists:true,id:'r1',ref,data:()=>({...record})});
 const store={collection:()=>({get:async()=>({docs:[snap()]})}),runTransaction:cb=>{const p=queue.then(()=>cb({get:async()=>snap(),update:(_,data)=>{record={...record,...data}}}));queue=p.catch(()=>{});return p}};
 const c=vm.createContext({module:{exports:{}},Date,console,require:name=>{
  if(name==='./reminder')return {...mail,ensureQrToken:async(_,r)=>r,sendWithBrevo:async payload=>{sent.push(payload);if(options.fail)throw Error('provider unavailable');return {messageId:'scheduled-message'}}};
  if(name==='./admin/firebase')return {getFirestore:()=>store,admin:{firestore:{FieldValue:{serverTimestamp:()=>1}}}};
  throw Error(name);
 }});const p=path.join(root,'lib/final-reminder.js');if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c);
 return {api:c.module.exports,ref,sent,get record(){return record},setRecord:value=>{record={...record,...value}}};
}
test('final reminder schedule represents 17 October at 15:00 Bucharest',()=>{const x=setup();assert.equal(x.api.FINAL_AT,'2026-10-17T12:00:00.000Z');assert.equal(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Bucharest',hour:'2-digit',minute:'2-digit'}).format(new Date(x.api.FINAL_AT)),'15:00')});
test('all registered participants get a separate final schedule even if yesterday reminder was sent',async()=>{const x=setup();assert.equal(typeof x.api.scheduleFinalReminder,'function');const out=await x.api.scheduleFinalReminder(x.ref,new Date('2026-10-17T09:20:00Z'));assert.equal(out.scheduled,true);assert.equal(x.sent.length,1);assert.equal(x.sent[0].scheduledAt,'2026-10-17T12:00:00.000Z');assert.equal(x.sent[0].from.email,'no-reply@avvero.ro');assert.equal(x.record.finalReminderState,'scheduled');assert.equal(x.record.reminderSent,true)});
test('parallel cron and registration scheduling do not enqueue twice',async()=>{const x=setup(),now=new Date('2026-10-16T18:00:00Z');assert.equal(typeof x.api.scheduleFinalReminder,'function');await Promise.all([x.api.scheduleFinalReminder(x.ref,now),x.api.scheduleFinalReminder(x.ref,now)]);await x.api.scheduleFinalReminder(x.ref,now);assert.equal(x.sent.length,1)});
test('no final email is scheduled after the target or outside the provider scheduling window',async()=>{for(const time of ['2026-10-17T12:00:00Z','2026-10-18T09:00:00Z','2026-10-13T00:00:00Z']){const x=setup();assert.equal(typeof x.api.scheduleFinalReminder,'function');await x.api.scheduleFinalReminder(x.ref,new Date(time));assert.equal(x.sent.length,0)}});
test('uncertain provider outcome remains visible and does not enqueue a duplicate',async()=>{const x=setup({fail:true});assert.equal(typeof x.api.scheduleFinalReminder,'function');await x.api.scheduleFinalReminder(x.ref,new Date('2026-10-16T18:00:00Z'));await x.api.scheduleFinalReminder(x.ref,new Date('2026-10-16T18:00:00Z'));assert.equal(x.sent.length,1);assert.equal(x.record.finalReminderState,'uncertain');assert.match(x.record.finalReminderError,/provider unavailable/)});
test('final email uses today in RO EN RU and retains the personal QR and correct start time',()=>{
 const x=setup();assert.equal(typeof x.api.finalReminderContent,'function');
 for(const [language,today,tomorrow] of [['ro',/Astăzi/,/Mâine|mâine/],['en',/today/,/tomorrow/],['ru',/Сегодня/,/Завтра|завтра/]]){
  const r=x.api.finalReminderContent({language,firstName:'Ion',participationCode:'BES-0001',qrToken:'a'.repeat(48)});assert.match(r.subject,today);assert.match(r.html,/SNOO-0001/);assert.match(r.html,/17:15/);assert.match(r.html,/api\/register\?qr=/);assert.doesNotMatch(r.html,tomorrow);assert.doesNotMatch(r.text,tomorrow);
 }
});
test('admin removes both reminder buttons and labels delivered as sent',()=>{const html=fs.readFileSync(path.join(root,'admin/index.html'),'utf8');assert.doesNotMatch(html,/reminderTestBtn|reminderRecoveryBtn|RETRIMITE REMINDERELE RESPINSE|TEST REMINDER/);assert.match(html,/Remindere trimise/);const a=html.indexOf('function reminderLabel('),b=html.indexOf('function reminderStatus(',a),c=vm.createContext({});vm.runInContext(html.slice(a,b),c);assert.equal(c.reminderLabel({reminderDeliveryStatus:'delivered'}),'Trimis')});
test('actual Brevo request includes the scheduled time and fixed sender',async()=>{
 const original=global.fetch,key=process.env.BREVO_API_KEY;let payload;global.fetch=async(_,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({messageId:'scheduled'})}};process.env.BREVO_API_KEY='test';
 try{await mail.sendWithBrevo({to:'participant@example.com',subject:'Final',html:'<p>Astăzi</p>',text:'Astăzi',from:{name:'AVVERO x SNOO 2026',email:'no-reply@avvero.ro'},scheduledAt:'2026-10-17T12:00:00.000Z',key:'final-test'});assert.equal(payload.sender.email,'no-reply@avvero.ro');assert.equal(payload.replyTo.email,'no-reply@avvero.ro');assert.equal(payload.scheduledAt,'2026-10-17T12:00:00.000Z')}
 finally{global.fetch=original;if(key===undefined)delete process.env.BREVO_API_KEY;else process.env.BREVO_API_KEY=key}
});
test('existing daily cron prepares the final reminders and still rejects unauthorized calls',async()=>{
 let calls=0;const c=vm.createContext({module:{exports:{}},console,process:{env:{CRON_SECRET:'secret'}},require:name=>{
  if(name==='../../lib/reminder')return {isReminderDay:()=>false,runConfirmationBackfill:async()=>({sent:0})};
  if(name==='../../lib/final-reminder')return {runFinalReminderBatch:async()=>{calls++;return {scheduled:77}}};throw Error(name);
 }});vm.runInContext(fs.readFileSync(path.join(root,'api/cron/reminders.js'),'utf8'),c);let status,body;const res={status:s=>{status=s;return res},json:b=>{body=b;return res}};
 await c.module.exports({method:'GET',headers:{}},res);assert.equal(status,401);assert.equal(calls,0);
 await c.module.exports({method:'GET',headers:{authorization:'Bearer secret'}},res);assert.equal(status,200);assert.equal(calls,1);assert.equal(body.finalReminders.scheduled,77);
 const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));assert.equal(config.crons[0].schedule,'0 9 * * *');
});
test('new registrations schedule the final reminder through their existing confirmation flow',()=>{
 const source=fs.readFileSync(path.join(root,'lib/reminder.js'),'utf8'),start=source.indexOf('async function sendRegistrationConfirmation('),end=source.indexOf('async function sendParticipantReminder(',start),functionSource=source.slice(start,end);
 assert.match(functionSource,/scheduleFinalReminder\(docRef\)/);assert.ok(functionSource.indexOf('scheduleFinalReminder(docRef)')<functionSource.indexOf('confirmationEmailSent===true'));
});
