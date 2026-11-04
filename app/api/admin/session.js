const {readSession,clearSessionCookie,noStore}=require('../../lib/admin/auth');
module.exports=(req,res)=>{
  noStore(res);
  const op=String((req.query||{}).operation||'');
  if(op==='me'){
    if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
    const s=readSession(req);
    if(!s)return res.status(401).json({authenticated:false});
    return res.status(200).json({authenticated:true,username:s.u});
  }
  if(op==='logout'){
    if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
    clearSessionCookie(res);
    return res.status(200).json({ok:true});
  }
  return res.status(404).json({error:'NOT_FOUND'});
};
