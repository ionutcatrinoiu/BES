const XLSX=require('xlsx');
const {readSession,noStore}=require('../../lib/admin/auth');

function splitDateTime(v){
 const d=v?new Date(v):null;
 if(!d||Number.isNaN(d.getTime()))return ['',''];
 return [
  new Intl.DateTimeFormat('ro-RO',{timeZone:'Europe/Bucharest',day:'2-digit',month:'2-digit',year:'numeric'}).format(d),
  new Intl.DateTimeFormat('ro-RO',{timeZone:'Europe/Bucharest',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)
 ];
}
module.exports=async(req,res)=>{
 noStore(res);
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});
 try{
  const rows=Array.isArray(req.body?.rows)?req.body.rows:[];
  const header=['Cod participare','Prenume','Nume','Telefon','Email','Optică medicală','Rol','Localitate','Județ / Raion','Țară','Adresă','Folosește soluții pentru gestionarea miopiei?','Cunoaște Myoless?','Data înscrierii','Ora înscrierii','Cadou oferit'];
  const data=[header,...rows.map(x=>{const [date,time]=splitDateTime(x.registeredAt);return [x.participationCode||'',x.firstName||'',x.lastName||'',x.phone||'',x.email||'',x.opticalStore||'',x.role||'',x.city||'',x.county||'',x.country==='MD'?'Republica Moldova':'România',x.streetAddress||'',x.usesMyopiaManagement||'',x.knowsMyoless||'',date,time,x.giftDelivered?'Da':'Nu']})];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws['!cols']=[14,16,18,16,30,28,20,18,18,32,38,22,16,14,16].map(w=>({wch:w}));
  ws['!autofilter']={ref:`A1:O${Math.max(1,data.length)}`};
  ws['!freeze']={xSplit:0,ySplit:1,topLeftCell:'A2',activePane:'bottomLeft',state:'frozen'};
  for(let r=2;r<=data.length;r++){const c=ws[`D${r}`];if(c){c.t='s';c.z='@'}}
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Participanți');
  const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="SNOO-2026-participanti-${new Date().toISOString().slice(0,10)}.xlsx"`);
  return res.status(200).send(out);
 }catch(e){console.error('xlsx export failed',e.message);return res.status(500).json({error:'EXPORT_FAILED'})}
};
