const XLSX=require('xlsx');
const {readSession,noStore}=require('../admin/auth');

function splitDateTime(v){
 const d=v?new Date(v):null;
 if(!d||Number.isNaN(d.getTime()))return ['',''];
 return [
  new Intl.DateTimeFormat('ro-RO',{timeZone:'Europe/Chisinau',day:'2-digit',month:'2-digit',year:'numeric'}).format(d),
  new Intl.DateTimeFormat('ro-RO',{timeZone:'Europe/Chisinau',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)
 ];
}
module.exports=async(req,res)=>{
 noStore(res);
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});
 try{
  const rows=Array.isArray(req.body?.rows)?req.body.rows:[];
  const header=['Cod BES','Cod numeric check-in','Prenume','Nume','Telefon','E-mail','Optică medicală','Rol','Localitate','Raion','Țară','Adresă','Interes ROOFT','Data înscrierii','Ora înscrierii','Cadou oferit','Prezență','Ora check-in','Confirmare e-mail','Reminder 1','Reminder 2','Reminder 3'];
  const data=[header,...rows.map(x=>{const [date,time]=splitDateTime(x.registeredAt);return [x.participationCode||'',x.numericCheckinCode||'',x.firstName||'',x.lastName||'',x.phone||'',x.email||'',x.opticalStore||'',x.role||'',x.city||'',x.county||'',x.country==='MD'?'Republica Moldova':'România',x.streetAddress||'',x.partnerAnswers?.rooft||'',date,time,x.giftDelivered?'Da':'Nu',x.checkedIn?'Prezent':'Absent',splitDateTime(x.checkedInAt).join(' '),x.confirmationEmailSent?'Trimis':x.confirmationEmailError?'Eroare':'Netrimis',...['r1','r2','r3'].map(k=>x.emailStages?.[k]?.state==='sent'?'Trimis':x.emailStages?.[k]?.state==='review'?'De verificat':'Netrimis')]})];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws['!cols']=header.map((_,i)=>({wch:[16,19,16,18,18,31,27,22,19,18,20,36,38,17,14,17,15,22,20,18,18,18][i]}));
  ws['!autofilter']={ref:`A1:V${Math.max(1,data.length)}`};
  ws['!freeze']={xSplit:0,ySplit:1,topLeftCell:'A2',activePane:'bottomLeft',state:'frozen'};
  for(let r=2;r<=data.length;r++){const c=ws[`E${r}`];if(c){c.t='s';c.z='@'}}
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Participanți');
  const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="BES-2026-participanti-${new Date().toISOString().slice(0,10)}.xlsx"`);
  return res.status(200).send(out);
 }catch(e){console.error('xlsx export failed',e.message);return res.status(500).json({error:'EXPORT_FAILED'})}
};
