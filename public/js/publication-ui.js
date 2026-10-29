// Publishing always uses the saved final file; storage URLs are internal.
for(const id of ['pubKind','pubUrl'])$('#'+id).closest('label').hidden=true;
$('#pubUrl').closest('label').nextElementSibling.hidden=true;
const finalLink=taskForm.elements.finalPublicUrl.closest('label');finalLink.hidden=true;
const publicationHeading=$('#publicationModal h2');publicationHeading.textContent='Publicar';
const accountField=document.createElement('label');accountField.className='field';accountField.innerHTML='Rede social / conta<select id="publicationNetwork"><option value="">Carregando contas…</option></select>';
$('#publicationAccount').before(accountField);
$('#pubFrame').parentElement.querySelector('strong').textContent='Prévia do post final';
$('#pubFrame').parentElement.querySelector('small').textContent='A mídia é ajustada ao formato selecionado, preservando a imagem inteira.';
let connectedPublicationAccounts=[];
function finalPublicationMedia(task,format){
 const media=task?.finalMedia,kind=media?.type?.startsWith('video/')?'video':'image';
 const vertical=format!=='post',height=vertical?1920:Number(media?.width)>0&&Math.abs(Number(media.height)/Number(media.width)-4/3)<0.02?1440:1350;
 let url=task?.finalPublicUrl||media?.publicUrl||'';
 try{const u=new URL(url);if(u.hostname==='res.cloudinary.com'&&u.pathname.includes('/upload/')){u.pathname=u.pathname.replace('/upload/','/upload/c_pad,w_1080,h_'+height+',b_white,'+(kind==='video'?'f_mp4':'f_jpg')+'/');url=u.href;}}catch{}
 return {url,kind,height,source:media?.data||url};
}
const drawFinalBefore=drawPublication;
drawPublication=function(){
 const task=state.tasks.find(t=>t.id===publicationTaskId),media=finalPublicationMedia(task,publicationFormat);
 $('#pubKind').value=media.kind;$('#pubUrl').value=media.url;
 drawFinalBefore();
 $('#pubFrame').style.aspectRatio='1080/'+media.height;
 $('#pubFormatHint').textContent=(publicationFormat==='post'?'Post':publicationFormat==='reels'?'Reels':'Stories')+' • 1080 × '+media.height;
 if(!media.url&&media.source){const frame=$('#pubFrame');frame.replaceChildren();const el=document.createElement(media.kind==='video'?'video':'img');el.src=media.source;el.style.cssText='width:100%;height:100%;object-fit:contain';if(media.kind==='video')el.controls=true;else el.alt='Post final da Criação';frame.append(el);}
 const incompatible=publicationFormat==='reels'&&media.kind!=='video'||publicationFormat==='post'&&media.kind==='video';
 if(incompatible){$('#pubFormatHint').textContent+=media.kind==='video'?' • Selecione Reels ou Stories para este vídeo.':' • Selecione Post ou Stories para esta imagem.';}
 const account=connectedPublicationAccounts.find(a=>a.id===$('#publicationNetwork').value);
 if($('#pubMode').value!=='draft'&&(!account||account.expires_at<=Date.now()||incompatible||!media.url))$('#pubSubmit').disabled=true;
};
const openFinalBefore=openPublication;
openPublication=async function(id){
 connectedPublicationAccounts=[];$('#publicationNetwork').replaceChildren(new Option('Carregando contas…',''));await openFinalBefore(id);
 const task=state.tasks.find(t=>t.id===id);if(!task)return;
 if(!task.publicationDraft?.format)publicationFormat=task.type==='Story'?'stories':task.finalMedia?.type?.startsWith('video/')?'reels':'post';
 try{const r=await fetch('/api/instagram',{cache:'no-store'}),data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível carregar as contas.');connectedPublicationAccounts=(data.connections||[]).filter(a=>a.client_id===task.clientId);$('#publicationNetwork').replaceChildren(...(connectedPublicationAccounts.length?connectedPublicationAccounts.map(a=>new Option('Instagram • @'+a.username+(a.expires_at<=Date.now()?' (reconectar)':''),a.id)):[new Option('Nenhuma conta conectada a este cliente','')]));}catch(e){$('#publicationNetwork').replaceChildren(new Option('Contas indisponíveis',''));$('#pubFeedback').textContent=e.message;}
 drawPublication();
};
$('#publicationNetwork').onchange=drawPublication;
$$('.pubFormat').forEach(b=>b.onclick=()=>{publicationFormat=b.dataset.format;drawPublication();});

// A date picker inside the page also works when browser-native pickers are
// unavailable inside the embedded application.
const picker=document.createElement('dialog');picker.className='client-dialog';picker.style.cssText='width:min(380px,calc(100vw - 32px));padding:20px;z-index:3000';picker.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><button type="button" id="pickerPrev" class="secondary" aria-label="Mês anterior">‹</button><strong id="pickerMonth"></strong><button type="button" id="pickerNext" class="secondary" aria-label="Próximo mês">›</button></div><div id="pickerDays" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:16px 0"></div><button type="button" id="pickerClose" class="secondary">Fechar</button>';
document.body.append(picker);let pickerInput=null,pickerMonth=new Date();
const calendarDate=(y,m,d)=>String(y)+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
function renderDatePicker(){
 const y=pickerMonth.getFullYear(),m=pickerMonth.getMonth();$('#pickerMonth').textContent=pickerMonth.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const grid=$('#pickerDays');grid.replaceChildren();for(const day of ['D','S','T','Q','Q','S','S']){const label=document.createElement('small');label.textContent=day;label.style.textAlign='center';grid.append(label);}
 for(let i=0;i<new Date(y,m,1).getDay();i++)grid.append(document.createElement('span'));
 for(let day=1;day<=new Date(y,m+1,0).getDate();day++){
  const value=calendarDate(y,m,day),b=document.createElement('button');b.type='button';b.textContent=day;b.className=pickerInput.value.slice(0,10)===value?'primary':'secondary';b.style.cssText='padding:8px 0;min-width:0';b.setAttribute('aria-label',day+' de '+$('#pickerMonth').textContent);b.disabled=!!pickerInput.min&&value<pickerInput.min.slice(0,10)||!!pickerInput.max&&value>pickerInput.max.slice(0,10);
  b.onclick=()=>{pickerInput.value=pickerInput.type==='datetime-local'?value+'T'+(pickerInput.value.slice(11,16)||'09:00'):value;pickerInput.dispatchEvent(new Event('input',{bubbles:true}));pickerInput.dispatchEvent(new Event('change',{bubbles:true}));picker.close();pickerInput.focus();};grid.append(b);
 }
}
function openDatePicker(input){if(input.disabled||input.readOnly)return;pickerInput=input;const raw=input.value.slice(0,10);pickerMonth=raw?new Date(raw+'T12:00:00'):new Date();if(!Number.isFinite(pickerMonth.getTime()))pickerMonth=new Date();pickerMonth.setDate(1);renderDatePicker();if(!picker.open)picker.showModal();}
$('#pickerPrev').onclick=()=>{pickerMonth.setMonth(pickerMonth.getMonth()-1);renderDatePicker();};$('#pickerNext').onclick=()=>{pickerMonth.setMonth(pickerMonth.getMonth()+1);renderDatePicker();};$('#pickerClose').onclick=()=>picker.close();
$('#dueCalendarBtn').onclick=()=>openDatePicker($('#dueDate'));
document.addEventListener('click',e=>{if(e.target instanceof HTMLInputElement&&['date','datetime-local'].includes(e.target.type)){e.preventDefault();openDatePicker(e.target);}},true);
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement&&['date','datetime-local'].includes(e.target.type)&&e.key==='Enter'){e.preventDefault();openDatePicker(e.target);}});
const publicationStyle=document.createElement('style');publicationStyle.textContent='[hidden]{display:none!important}#pubKind,#pubUrl,[name="finalPublicUrl"]{display:none!important}#publicationNetwork{width:100%}#pickerDays button{min-height:38px}';document.head.append(publicationStyle);
