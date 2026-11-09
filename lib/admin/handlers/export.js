const {readSession,noStore}=require('../auth');
const {getFirestore}=require('../firebase');
const {createWorkbook}=require('./xlsx-generator');
const iso=v=>v&&typeof v.toDate==='function'?v.toDate().toISOString():v||null;
function format(v,kind){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return '';const options=kind==='date'?{day:'2-digit',month:'2-digit',year:'numeric'}:{hour:'2-digit',minute:'2-digit',hour12:false};return new Intl.DateTimeFormat('ro-RO',{timeZone:'Europe/Chisinau',...options}).format(d)}
module.exports=async(req,res)=>{
 noStore(res);
 if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});
 try{
  const snap=await getFirestore().collection('bes_registrations').get();
  const rows=snap.docs.map(d=>d.data()).sort((a,b)=>String(iso(b.registeredAt)||'').localeCompare(String(iso(a.registeredAt)||'')));
  const header=['Cod BES','PIN check-in','Prenume','Nume','Telefon','E-mail','Instituție','Rol','Localitate','Raion','Țară','Stradă și număr','Folosește Myoless sau alte soluții pentru miopie?','Unde profesează?','Dorește implicare în prevenția miopiei?','Experiență / interes ROOFT','Data înscrierii','Ora înscrierii','Check-in','Data check-in','Ora check-in','Confirmare e-mail','Reminder 1','Reminder 2','Reminder 3'];
  const data=rows.map(x=>[
   x.participationCode||'',x.numericCheckinCode||'',x.firstName||'',x.lastName||'',x.phoneNormalized||x.phone||'',x.email||'',x.opticalStore||'',x.role||'',x.city||'',x.county||'',x.country||'MD',x.streetAddress||'',x.avveroMyopia||'',x.avveroPractice||'',x.avveroPrevention||'',x.partnerAnswers?.rooft||'',format(iso(x.registeredAt),'date'),format(iso(x.registeredAt),'time'),x.checkedIn||x.checkedInAt?'Prezent':'Absent',format(iso(x.checkedInAt),'date'),format(iso(x.checkedInAt),'time'),x.confirmationEmailSent?'Trimis':x.confirmationEmailError?'Eroare':'Netrimis',...['r1','r2','r3'].map(k=>x.emailStages?.[k]?.state==='sent'?'Trimis':x.emailStages?.[k]?.state==='review'?'De verificat':'Netrimis')
  ]);
  const file=createWorkbook(header,data);
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="BES-2026-participanti-${new Date().toISOString().slice(0,10)}.xlsx"`);
  return res.status(200).send(file);
 }catch(e){console.error('BES Excel export failed:',e);return res.status(500).json({error:'EXPORT_FAILED'})}
};
