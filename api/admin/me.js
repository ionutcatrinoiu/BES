const {readSession,noStore}=require('../../lib/admin/auth');
module.exports=(req,res)=>{noStore(res);if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});const s=readSession(req);if(!s)return res.status(401).json({authenticated:false});return res.status(200).json({authenticated:true,username:s.u})};
