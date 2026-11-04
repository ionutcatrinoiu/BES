const {readSession,noStore}=require('../auth');
const {contentFor,sendWithBrevo}=require('../../reminder');
const crypto=require('crypto');
const RECIPIENT='ionut.catrinoiu@avvero.ro';
const STAGES=new Set(['confirmation','r1','r2','r3']);
const LANGS=new Set(['ro','en','ru']);
module.exports=async(req,res)=>{
 noStore(res);
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});
 const stage=String(req.body?.stage||'');
 const language=String(req.body?.language||'ro');
 if(!STAGES.has(stage)||!LANGS.has(language))return res.status(400).json({error:'INVALID_TEST_OPTIONS'});
 try{
  // The example QR points to the public check-in page. The example PIN is not valid.
  const demo={firstName:'Ionuț',lastName:'Test BES',email:RECIPIENT,language,numericCheckinCode:'4821'};
  const content=contentFor(demo,stage);
  const qr='<img src="https://bes-event.vercel.app/assets/bes-email-test-qr.png" alt="QR demonstrativ" width="180" height="180" style="display:block;width:180px;height:180px;margin:18px auto;background:transparent;padding:0;border:0">';
  content.html=content.html.replace(/(<div style="font-size:54px;line-height:1.4;letter-spacing:12px;font-weight:800;color:#172c2b">4821<\/div>)/,'$1'+qr);
  content.html=content.html.replace('</h1>','</h1><p style="color:#a34c36;font-size:12px;font-weight:bold;letter-spacing:1px">TEST · CODUL 4821 ȘI QR-UL NU ÎNREGISTREAZĂ PREZENȚA</p>');
  content.text='MESAJ DE TEST. Codul 4821 și QR-ul sunt demonstrative.\n\n'+content.text;
  const result=await sendWithBrevo({to:RECIPIENT,name:'Ionuț',subject:'[TEST BES] '+content.subject,html:content.html,text:content.text,key:'bes-email-test-'+crypto.randomUUID()});
  return res.status(200).json({ok:true,to:RECIPIENT,stage,language,messageId:result.messageId||null});
 }catch(err){console.error('BES email test failed:',err.message);return res.status(502).json({error:'EMAIL_TEST_FAILED',message:String(err.message||err).slice(0,220)})}
};
