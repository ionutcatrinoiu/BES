module.exports=async function(req,res){
 res.setHeader('Cache-Control','public, max-age=300');
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const q=String(req.query.q||'').trim().slice(0,100),city=String(req.query.city||'').trim().slice(0,100);
 if(q.length<3||!city)return res.status(200).json({streets:[]});
 try{
  const url=new URL('https://photon.komoot.io/api/');url.searchParams.set('q',q+', '+city+', Moldova');url.searchParams.set('limit','15');url.searchParams.set('lang','en');
  const response=await fetch(url,{headers:{'User-Agent':'BES-Event-Registration/1.0 (street suggestions)'}});
  if(!response.ok)throw new Error('geocoder unavailable');const data=await response.json();
  const streets=[...new Set((data.features||[]).filter(x=>x.properties&&x.properties.street&&x.properties.countrycode==='MD').map(x=>x.properties.street))].slice(0,10);
  return res.status(200).json({streets});
 }catch(e){console.error('street lookup',e.message);return res.status(503).json({error:'STREET_LOOKUP_UNAVAILABLE',streets:[]})}
};
