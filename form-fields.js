function formatStreet(value){return String(value||'').replace(/\s*[\r\n]+\s*/g,' ').replace(/(^|[\s.,\-'])\p{L}/gu,letter=>letter.toLocaleUpperCase('ro-RO'))}
function capitalizeStreetField(field){
 const start=field.selectionStart,end=field.selectionEnd,value=formatStreet(field.value);
 if(value!==field.value){field.value=value;if(start!==null&&typeof field.setSelectionRange==='function')field.setSelectionRange(Math.min(start,value.length),Math.min(end,value.length))}
 S.street=value;
}
let regionActiveIndex=-1;
function allowedRegions(){return [...new Set(S.country==='MD'?MD_CITIES_STATIC.map(c=>c.county):Object.values(COUNTY_BY_CODE))].sort((a,b)=>a.localeCompare(b,'ro'))}
function regionMatches(query){const key=cityKey(query);const regions=allowedRegions();return regions.filter(r=>cityKey(r).startsWith(key)).concat(regions.filter(r=>!cityKey(r).startsWith(key)&&cityKey(r).includes(key)))}
function completeRegionInput(field,event){
 if(event.isComposing||String(event.inputType||'').startsWith('delete'))return;
 const query=field.value,end=query.length;
 if(!query||field.selectionStart!==end||field.selectionEnd!==end)return;
 const match=regionMatches(query).find(region=>cityKey(region).startsWith(cityKey(query)));
 if(!match||match.length<=end)return;
 field.value=match;field.setSelectionRange(end,match.length);
}
function closeRegionSuggestions(){const list=document.getElementById('regionSuggestions');if(list)list.remove();regionActiveIndex=-1;const field=document.getElementById('field');if(field&&A[n]&&A[n][3]==='county')field.setAttribute('aria-expanded','false')}
function chooseRegionSuggestion(region,field){
 if(lock)return;field.value=region;S.county=region;closeRegionSuggestions();const err=document.getElementById('err');if(err)err.textContent='';validateLiveField();
}
function showRegionSuggestions(field,showAll=false,query=field.value){
 closeRegionSuggestions();const matches=regionMatches(showAll?'':query);if(!matches.length)return;
 const list=document.createElement('div');list.id='regionSuggestions';list.className='city-suggestions region-suggestions';list.setAttribute('role','listbox');list.setAttribute('aria-label',uiText(S.country==='MD'?'Sugestii raioane':'Sugestii județe'));
 for(const region of matches){const button=document.createElement('button');button.type='button';button.className='city-suggestion';button.setAttribute('role','option');button.setAttribute('aria-selected',String(region===S.county));button.innerHTML=`${esc(region)}<span>${uiText(S.country==='MD'?'Raion':'Județ')}</span>`;button.addEventListener('pointerdown',e=>e.preventDefault());button.addEventListener('click',()=>chooseRegionSuggestion(region,field));list.appendChild(button)}
 field.closest('.field-row').appendChild(list);field.setAttribute('aria-expanded','true');
}
function wireRegionAutocomplete(field){
 field.removeAttribute('list');field.setAttribute('aria-autocomplete','both');field.setAttribute('aria-controls','regionSuggestions');field.setAttribute('aria-expanded','false');
 let replaceSuggestion=!!field.value,selectOnPointerUp=false;
 field.addEventListener('focus',()=>{selectOnPointerUp=!!field.value;if(field.value)field.select();showRegionSuggestions(field,true)});
 field.addEventListener('pointerup',e=>{if(selectOnPointerUp){e.preventDefault();field.select();selectOnPointerUp=false}});
 field.addEventListener('beforeinput',e=>{if(replaceSuggestion&&e.inputType&&e.inputType.startsWith('insert')){field.select();replaceSuggestion=false}});
 field.addEventListener('input',e=>{replaceSuggestion=false;const query=field.value;completeRegionInput(field,e);S.county=field.value;showRegionSuggestions(field,false,query)},true);
 field.addEventListener('compositionend',()=>{const query=field.value;completeRegionInput(field,{});S.county=field.value;showRegionSuggestions(field,false,query)});
 field.addEventListener('keydown',e=>{
  const list=document.getElementById('regionSuggestions'),items=list?[...list.querySelectorAll('.city-suggestion')]:[];
  if(e.key==='Escape'){closeRegionSuggestions();return}
  if(!items.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();regionActiveIndex=(regionActiveIndex+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((item,i)=>{item.classList.toggle('active',i===regionActiveIndex);item.setAttribute('aria-selected',String(i===regionActiveIndex))});items[regionActiveIndex].scrollIntoView({block:'nearest'});return}
  if(e.key==='Enter'&&regionActiveIndex>=0){e.preventDefault();e.stopImmediatePropagation();items[regionActiveIndex].click()}
 },true);
 field.addEventListener('blur',()=>setTimeout(()=>{if(document.getElementById('field')===field)closeRegionSuggestions()},120));
}
let emailCheckSeq=0;
function normalizeEmailClient(value){return String(value||'').trim().toLowerCase()}
function resetEmailAvailability(){emailCheckSeq++}
async function checkEmailAvailability(email){
 const sequence=++emailCheckSeq,field=document.getElementById('field'),err=document.getElementById('err');
 if(err)err.textContent=uiText('Verificăm adresa de e-mail…');
 try{
  const response=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'check-email',email:normalizeEmailClient(email)})});
  const data=await response.json();
  if(sequence!==emailCheckSeq||document.getElementById('field')!==field||!field||normalizeEmailClient(field.value)!==normalizeEmailClient(email))return false;
  if(!response.ok)throw new Error('CHECK_FAILED');
  if(err)err.textContent=data.exists?uiText('Această adresă de e-mail este deja asociată unei înscrieri.'):'';
  return !data.exists;
 }catch(_){if(sequence===emailCheckSeq&&document.getElementById('field')===field&&err)err.textContent=uiText('Nu am putut verifica adresa de e-mail. Încearcă din nou.');return false}
}
const renderFieldEnhancements=render;
render=function(){
 resetEmailAvailability();renderFieldEnhancements();const field=document.getElementById('field'),step=A[n];if(!field||!step)return;
 if(step[3]==='county'){const nativeList=document.getElementById('regionOptions');if(nativeList)nativeList.remove();wireRegionAutocomplete(field)}
 if(step[3]==='street'){field.setAttribute('autocapitalize','words');field.setAttribute('spellcheck','false');capitalizeStreetField(field);field.addEventListener('input',e=>{if(!e.isComposing)capitalizeStreetField(field)},true);field.addEventListener('compositionend',()=>{capitalizeStreetField(field)})}
 if(step[3]==='email')field.addEventListener('input',()=>{resetEmailAvailability();const err=document.getElementById('err');if(err&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()))err.textContent=''});
};
window.addEventListener('pagehide',resetEmailAvailability);
