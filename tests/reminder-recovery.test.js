const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const event=(event,extra={})=>({event,date:'2026-10-16T09:00:00Z',email:'participant@example.com',messageId:'<old@brevo>',reason:'Sending rejected because the sender you used is not valid. Validate your sender.',...extra});
function setup(events=[event('error')],options={}){
 let record={email:'participant@example.com',firstName:'Ivan',language:'ru',reminderSent:true,reminderEmailId:'<old@brevo>',qrToken:'token'},sends=[],requests=[],queue=Promise.resolve();
 const ref={id:'r1',get:async()=>snapshot(),update:async update=>{if(options.failUpdate)throw Error('database unavailable');record={...record,...update}}};
 const snapshot=()=>({exists:true,id:'r1',ref,data:()=>({...record})});
 const store={collection:()=>({doc:()=>ref}),runTransaction:cb=>{const p=queue.then(()=>cb({get:async()=>snapshot(),update:(_,data)=>{record={...record,...data}}}));queue=p.catch(()=>{});return p}};
 const c=vm.createContext({module:{exports:{}},URL,URLSearchParams,Date,process:{env:{BREVO_API_KEY:'secret'}},fetch:async url=>{requests.push(url);if(options.lookupFails)throw Error('lookup failed');return {ok:true,json:async()=>({events})}},require:name=>{
  if(name==='crypto')return require('node:crypto');
  if(name==='./admin/firebase')return {getFirestore:()=>store,admin:{firestore:{FieldValue:{serverTimestamp:()=>123,delete:()=>null}}}};
  if(name==='./reminder')return {ensureQrToken:async(_,r)=>r,sendReminder:async(r,email,key)=>{sends.push({r,email,key});if(options.sendFails)throw Error('network timeout');return {messageId:'<new@brevo>'}}};
  throw Error(name);
 }});
 const source=path.join(root,'lib/reminder-recovery.js');if(fs.existsSync(source))vm.runInContext(fs.readFileSync(source,'utf8'),c);
 return {api:c.module.exports,sends,requests,get record(){return record},setRecord:r=>{record={...record,...r}}};
}
test('recovery module exposes status-checked retry',()=>{assert.equal(typeof setup().api.retryRejectedReminder,'function')});
test('sender rejection retries with a new key, retains language, and saves the new message ID',async()=>{
 const x=setup();const out=await x.api.retryRejectedReminder('r1');assert.equal(out.status,'accepted');assert.equal(x.sends.length,1);assert.equal(x.sends[0].r.language,'ru');assert.notEqual(x.sends[0].key,'snoo-2026-reminder/r1/2026-10-17');assert.equal(x.record.reminderEmailId,'<new@brevo>');assert.equal(x.record.reminderDeliveryStatus,'accepted');const u=new URL(x.requests[0]);assert.equal(u.searchParams.get('messageId'),'<old@brevo>');assert.equal(u.searchParams.get('email'),'participant@example.com');
});
test('delivered or opened reminders are never resent even if an error also appears',async()=>{
 for(const status of ['delivered','opened','clicks']){const x=setup([event('error'),event(status)]);assert.equal((await x.api.retryRejectedReminder('r1')).status,'delivered');assert.equal(x.sends.length,0)}
});
test('pending, blocked, hard bounce, missing and unrelated events do not trigger resend',async()=>{
 for(const events of [[event('requests')],[event('blocked')],[event('hardBounces')],[],[event('error',{messageId:'<other@brevo>'})],[event('error',{email:'someoneelse@example.com'})],[event('error',{reason:'Mailbox full'})]]){const x=setup(events);await x.api.retryRejectedReminder('r1');assert.equal(x.sends.length,0)}
});
test('lookup failure and missing stored message ID do not trigger resend',async()=>{
 const x=setup([],{lookupFails:true});await assert.rejects(x.api.retryRejectedReminder('r1'));assert.equal(x.sends.length,0);
 const y=setup();y.setRecord({reminderEmailId:null});assert.equal((await y.api.retryRejectedReminder('r1')).status,'unknown');assert.equal(y.sends.length,0);
});
test('concurrent retries reserve only one dispatch',async()=>{const x=setup();await Promise.all([x.api.retryRejectedReminder('r1'),x.api.retryRejectedReminder('r1')]);assert.equal(x.sends.length,1)});
test('repeated batch checks the new message ID and does not resend it without an explicit new rejection',async()=>{const x=setup();await x.api.retryRejectedReminder('r1');await x.api.retryRejectedReminder('r1');assert.equal(x.sends.length,1)});
test('uncertain sending or database failure cannot cause a second dispatch',async()=>{
 for(const options of [{sendFails:true},{failUpdate:true}]){const x=setup(undefined,options);await assert.rejects(x.api.retryRejectedReminder('r1'));await x.api.retryRejectedReminder('r1');assert.equal(x.sends.length,1)}
});
test('invalid participant IDs are rejected before lookup',async()=>{const x=setup();await assert.rejects(x.api.retryRejectedReminder('../r1'));assert.equal(x.requests.length,0)});
function endpoint({authorized=true}={}){
 let retries=0,tests=0;const c=vm.createContext({module:{exports:{}},console,Date,require:name=>{
  if(name==='../../lib/admin/auth')return {readSession:()=>authorized,noStore:()=>{}};
  if(name==='../../lib/admin/firebase')return {getFirestore:()=>({collection:()=>({get:async()=>({docs:[{id:'r1',ref:{},data:()=>({email:'participant@example.com'})}]})})})};
  if(name==='../../lib/reminder')return {ensureQrToken:async(_,r)=>r,sendReminder:async()=>{tests++;return {messageId:'test'}}};
  if(name==='../../lib/reminder-recovery')return {retryRejectedReminder:async()=>{retries++;return {status:'accepted',messageId:'new'}}};
  throw Error(name);
 }});vm.runInContext(fs.readFileSync(path.join(root,'api/admin/reminder-test.js'),'utf8'),c);
 return {run:c.module.exports,get retries(){return retries},get tests(){return tests}};
}
async function callEndpoint(x,body,method='POST'){const result={};const res={status:code=>{result.code=code;return res},json:body=>{result.body=body;return res}};await x.run({method,body},res);return result}
test('recovery reuses the existing authenticated endpoint',async()=>{const x=endpoint();const r=await callEndpoint(x,{action:'retry-rejected',registrationId:'r1'});assert.equal(r.code,200);assert.equal(r.body.status,'accepted');assert.equal(x.retries,1);assert.equal(x.tests,0)});
test('unauthenticated or non POST requests cannot trigger recovery',async()=>{const x=endpoint({authorized:false});assert.equal((await callEndpoint(x,{action:'retry-rejected',registrationId:'r1'})).code,401);assert.equal((await callEndpoint(x,{},'GET')).code,405);assert.equal(x.retries,0)});
test('existing reminder test stays available without an action',async()=>{const x=endpoint();assert.equal((await callEndpoint(x,{email:'participant@example.com'})).code,200);assert.equal(x.tests,1);assert.equal(x.retries,0)});
test('unknown actions do not accidentally send test messages',async()=>{const x=endpoint();assert.equal((await callEndpoint(x,{action:'retry-everyone',email:'participant@example.com'})).code,400);assert.equal(x.tests,0);assert.equal(x.retries,0)});
function ui(confirmSend=true){
 const elements={reminderRecoveryBtn:{disabled:false},reminderTestBtn:{disabled:false},recoveryStatus:{textContent:''}},calls=[];
 const c=vm.createContext({window:{confirm:()=>confirmSend},$:(id)=>elements[id],api:async(url,options)=>{calls.push({url,options});if(url==='/api/admin/data')return {registrations:[{id:'a',email:'a@example.com',reminderEmailId:'one'},{id:'b',email:'b@example.com',reminderEmailId:'two'},{id:'c',email:'c@example.com',reminderEmailId:'three'},{id:'d',email:'d@example.com'}]};return {status:JSON.parse(options.body).registrationId==='a'?'accepted':JSON.parse(options.body).registrationId==='b'?'delivered':'unknown'}},load:async()=>{},setTimeout:cb=>cb()});
 const source=path.join(root,'admin/reminder-recovery.js');if(fs.existsSync(source))vm.runInContext(fs.readFileSync(source,'utf8'),c);
 return {c,elements,calls};
}
test('admin bulk recovery processes each recorded message and reports accepted, delivered and uncertain counts',async()=>{
 const x=ui();assert.equal(typeof x.c.recoverRejectedReminders,'function');await x.c.recoverRejectedReminders();assert.equal(x.calls.length,4);assert.equal(x.elements.reminderRecoveryBtn.disabled,false);assert.match(x.elements.recoveryStatus.textContent,/1 acceptate/);assert.match(x.elements.recoveryStatus.textContent,/1 deja livrate/);assert.match(x.elements.recoveryStatus.textContent,/2 de verificat/);
 for(const call of x.calls.slice(1)){assert.equal(call.url,'/api/admin/reminder-test');assert.equal(JSON.parse(call.options.body).action,'retry-rejected')}
});
test('cancelling bulk recovery sends no email requests',async()=>{const x=ui(false);assert.equal(typeof x.c.recoverRejectedReminders,'function');await x.c.recoverRejectedReminders();assert.equal(x.calls.length,1)});
test('admin labels API acceptance separately from delivery',()=>{
 const html=fs.readFileSync(path.join(root,'admin/index.html'),'utf8'),start=html.indexOf('function reminderLabel('),end=html.indexOf('function reminderStatus(',start);
 assert.notEqual(start,-1);const c=vm.createContext({});vm.runInContext(html.slice(start,end),c);assert.equal(c.reminderLabel({reminderSent:true}),'Acceptat de Brevo');assert.equal(c.reminderLabel({reminderDeliveryStatus:'delivered'}),'Trimis');assert.equal(c.reminderLabel({reminderDeliveryStatus:'sender_error',reminderSent:true}),'Respins: expeditor');
});
test('sender error wins over Sent at the same timestamp in either API order',async()=>{
 for(const events of [[event('requests'),event('error')],[event('error'),event('requests')],[event('sent'),event('error')]]){
  const x=setup(events);assert.equal((await x.api.retryRejectedReminder('r1')).status,'accepted');assert.equal(x.sends.length,1);
 }
});
test('a newer sending event keeps an older error from triggering another resend',async()=>{
 const x=setup([event('error'),event('requests',{date:'2026-10-16T09:01:00Z'})]);assert.equal((await x.api.retryRejectedReminder('r1')).status,'pending');assert.equal(x.sends.length,0);
});
