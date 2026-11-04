let reminderRecoveryBusy=false;
async function recoverRejectedReminders(){
 if(reminderRecoveryBusy)return;
 reminderRecoveryBusy=true;
 const button=$('reminderRecoveryBtn'),testButton=$('reminderTestBtn'),status=$('recoveryStatus');
 button.disabled=true;testButton.disabled=true;status.textContent='Încărcăm lista pentru verificare...';
 let accepted=0,delivered=0,review=0,checked=0;
 try{
  const data=await api('/api/admin/data'),records=(data.registrations||[]).filter(r=>r.email);
  if(!window.confirm(`Verificăm ${records.length} participanți în Brevo și retrimitem numai reminderele respinse din cauza expeditorului. Continui?`)){status.textContent='Retrimiterea a fost anulată.';return}
  for(const record of records){
   status.textContent=`Verificare ${checked+1}/${records.length}. ${accepted} acceptate pentru retrimitere.`;
   if(!record.reminderEmailId){review++;checked++;continue}
   const result=await api('/api/admin/reminder-test',{method:'POST',body:JSON.stringify({action:'retry-rejected',registrationId:record.id})});
   if(result.status==='accepted')accepted++;
   else if(result.status==='delivered')delivered++;
   else review++;
   if(typeof all!=='undefined'){
    const row=all.find(r=>r.id===record.id);
    if(row){row.reminderDeliveryStatus=result.status;if(result.messageId){row.reminderEmailId=result.messageId;row.reminderSent=true;row.reminderSentAt=new Date().toISOString()}}
    apply();
   }
   checked++;
   await new Promise(resolve=>setTimeout(resolve,250));
  }
  status.textContent=`Verificare încheiată: ${accepted} acceptate pentru retrimitere, ${delivered} deja livrate, ${review} de verificat sau în așteptare. Verifică livrarea în logurile Brevo.`;
 }catch(e){status.textContent=`Procesul s-a oprit după ${checked} participanți. ${accepted} acceptate pentru retrimitere. Verifică logurile Brevo. ${e.message||''}`}
 finally{reminderRecoveryBusy=false;button.disabled=false;testButton.disabled=false}
}
$('reminderRecoveryBtn').onclick=recoverRejectedReminders;
