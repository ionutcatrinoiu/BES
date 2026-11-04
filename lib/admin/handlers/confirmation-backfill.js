const {readSession,noStore}=require('../admin/auth');
const {runConfirmationBackfill}=require('../reminder');
module.exports=async(req,res)=>{noStore(res);if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});if(!readSession(req))return res.status(401).json({error:'UNAUTHORIZED'});try{const result=await runConfirmationBackfill();return res.status(200).json({ok:true,...result})}catch(e){console.error('confirmation backfill failed',e);return res.status(500).json({error:'CONFIRMATION_BACKFILL_FAILED'})}};
