const {clearSessionCookie,noStore}=require('../../lib/admin/auth');
module.exports=(req,res)=>{noStore(res);if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});clearSessionCookie(res);return res.status(200).json({ok:true})};
