/* Comercial (PDF págs. 4, 5 e 5.1): funil de leads em kanban, abas Em espera / Arquivados, painel do lead
   (Resumo, Triagem, Interações) e relatório. Dados em /api/leads (só Administrador e Gestor). */
MODULES.comercial={name:'Comercial',icon:'◎'};
const ETAPA_LABEL={novo:'Novo lead',contato:'Em contato',reuniao:'Reunião',proposta:'Proposta enviada',negociacao:'Negociação',fechado:'Fechado'};
const INTERESSE_LABEL={gestao:'Gestão',gestao_campanha:'Gestão + Campanha',projeto:'Projeto',servidor:'Servidor'};
const ESPERA_LABEL={sem_resposta:'Sem resposta (com data de retorno)',retomada_futura:'Retomada futura',aguardando_cliente:'Aguardando definição do cliente'};
const ARQUIVO_LABEL={sem_interesse:'Não teve interesse',preco:'Preço',desqualificado:'Desqualificado (fora do perfil)',nao_respondeu:'Não respondeu',outra_empresa:'Fechou com outra empresa',outro:'Outro'};
const ORIGEM_LABEL={site:'Site',google_forms:'Google Forms',landing:'Landing page',crm_antigo:'CRM antigo',meta_ads:'Meta Ads',whatsapp:'WhatsApp',prospeccao:'Prospecção',indicacao:'Indicação',instagram:'Instagram',formulario:'Formulário'};
const EVENTO_LABEL={criado:'Lead criado',entrada_formulario:'Nova entrada pelo formulário',etapa:'Mudou de etapa',responsavel:'Responsável alterado',editado:'Dados editados',espera:'Colocado em espera',arquivado:'Arquivado',reativado:'Oportunidade reativada',interacao:'Interação registrada'};
let com={leads:[],equipe:[],carregado:false,erro:'',aba:'andamento',busca:'',origem:'',segmento:'',interesse:'',resp:'',aberto:null,painel:'resumo',eventos:[]};
const origemNome=o=>ORIGEM_LABEL[o]||o||'—';
const pessoaNome=id=>com.equipe.find(u=>u.id===id)?.name||'';
const hojeISO=()=>new Date().toLocaleDateString('sv-SE');
const waLink=n=>n?`https://wa.me/${encodeURIComponent(n)}`:'';
const fone=n=>{const d=String(n||'');return d.length>=12?`(${d.slice(2,4)}) ${d.slice(4,-4)}-${d.slice(-4)}`:d;};

async function comLoad(){
  try{const r=await fetch('/api/leads',{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.error);com.leads=d.leads;com.equipe=d.equipe;com.erro='';}
  catch(e){com.erro=e.message;}
  com.carregado=true;if(activeArea==='comercial')renderComercial();
}
async function comAction(body){
  const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),d=await r.json().catch(()=>({}));
  if(!r.ok){window.alert(d.error||'Não foi possível salvar.');if(r.status===409)await comLoad();return null;}
  const i=com.leads.findIndex(l=>l.id===d.lead.id);d.lead.triagem=typeof d.lead.triagem==='string'?JSON.parse(d.lead.triagem||'{}'):d.lead.triagem;
  if(i<0)com.leads.unshift(d.lead);else com.leads[i]=d.lead;showToast();return d.lead;
}

function comFiltrados(situacao){
  const q=com.busca.trim().toLocaleLowerCase('pt-BR');
  return com.leads.filter(l=>l.situacao===situacao&&(!com.origem||l.origem===com.origem)&&(!com.segmento||l.segmento===com.segmento)&&(!com.interesse||l.interesse===com.interesse)
    &&(!com.resp||(com.resp==='_sem'?!l.responsavel_id:l.responsavel_id===com.resp))&&(!q||[l.nome,l.empresa,l.email,l.whatsapp,l.instagram].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q))));
}

function renderComercial(){
  section.classList.remove('hidden');$('#usersSection').classList.add('hidden');
  if(!com.carregado){section.innerHTML='<p role="status">Carregando o Comercial…</p>';comLoad();return;}
  if(com.erro){section.innerHTML=`<div class="head"><h1>Comercial</h1></div><p class="editor-error">${esc(com.erro)}</p>`;return;}
  const n=s=>com.leads.filter(l=>l.situacao===s).length,uniq=k=>[...new Set(com.leads.map(l=>l[k]).filter(Boolean))].sort();
  const opt=(list,val,label=x=>x)=>list.map(x=>`<option value="${esc(x)}" ${val===x?'selected':''}>${esc(label(x))}</option>`).join('');
  const abas=[['andamento','Em andamento',n('andamento')],['espera','Em espera',n('espera')],['arquivado','Arquivados',n('arquivado')],['relatorio','Relatório','']];
  section.innerHTML=`<div class="head"><div><p class="crumb">Clientes / Comercial</p><h1>Comercial</h1><p class="cl-sub">Gestão de leads e oportunidades.</p></div><button type="button" class="primary" id="comNovo">+ Novo lead</button></div>
    <div class="cl-toolbar"><div class="cl-tabs">${abas.map(([k,l,c])=>`<button type="button" class="cl-tab ${com.aba===k?'active':''}" data-com-aba="${k}">${l}${c!==''?` <small>${c}</small>`:''}</button>`).join('')}</div></div>
    ${com.aba==='relatorio'?'':`<div class="com-filters"><label class="field">Buscar<input id="comBusca" value="${esc(com.busca)}" placeholder="Lead, empresa ou contato"></label>
      <label class="field">Origem<select id="comOrigem"><option value="">Todas</option>${opt(uniq('origem'),com.origem,origemNome)}</select></label>
      <label class="field">Segmento<select id="comSegmento"><option value="">Todos</option>${opt(uniq('segmento'),com.segmento)}</select></label>
      <label class="field">Interesse<select id="comInteresse"><option value="">Todos</option>${opt(Object.keys(INTERESSE_LABEL),com.interesse,x=>INTERESSE_LABEL[x])}</select></label>
      <label class="field">Responsável<select id="comResp"><option value="">Todos</option><option value="_sem" ${com.resp==='_sem'?'selected':''}>Sem responsável</option>${com.equipe.map(u=>`<option value="${esc(u.id)}" ${com.resp===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select></label></div>`}
    ${com.aba==='andamento'?kanbanHtml():com.aba==='relatorio'?relatorioHtml():tabelaHtml(com.aba)}${com.aberto?painelHtml():''}`;
  bindComercial();
}

function cardHtml(l){
  const atrasado=l.proximo_followup&&l.proximo_followup<hojeISO();
  return `<article class="com-card" draggable="true" data-com-drag="${esc(l.id)}" data-com-open="${esc(l.id)}" tabindex="0">
    <strong>${esc(l.empresa||l.nome||'Sem nome')}</strong><small>${esc(l.segmento||'')}</small>
    <span class="com-origem">${esc(origemNome(l.origem))}</span>${l.interesse?` <span class="chip">${esc(INTERESSE_LABEL[l.interesse])}</span>`:''}
    ${l.empresa&&l.nome?`<p class="com-pessoa">👤 ${esc(l.nome)}</p>`:''}
    <div class="com-contato">${l.whatsapp?`<a class="com-wa" href="${waLink(l.whatsapp)}" target="_blank" rel="noopener noreferrer" data-stop>WhatsApp</a><a href="tel:+${esc(l.whatsapp)}" title="${esc(fone(l.whatsapp))}" data-stop>📞</a>`:''}${l.email?`<a href="mailto:${esc(l.email)}" title="${esc(l.email)}" data-stop>✉</a>`:''}</div>
    ${atrasado?`<p class="com-alerta">Follow-up vencido (${esc(l.proximo_followup.split('-').reverse().join('/'))})</p>`:''}
    <select class="com-resp" data-com-resp="${esc(l.id)}" aria-label="Responsável" data-stop><option value="">Sem responsável</option>${com.equipe.map(u=>`<option value="${esc(u.id)}" ${l.responsavel_id===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select></article>`;
}
function kanbanHtml(){
  const leads=comFiltrados('andamento');
  return `<p class="cl-hint">Arraste o card para mudar a etapa. Clique para abrir os detalhes.</p><div class="com-board">${Object.entries(ETAPA_LABEL).map(([k,label])=>{const ls=leads.filter(l=>l.etapa===k);
    return `<section class="com-col com-et-${k}" data-com-drop="${k}"><div class="com-col-head"><strong>${label}</strong><span>${ls.length}</span></div>${ls.map(cardHtml).join('')||'<p class="cl-empty-col">Nenhum lead</p>'}</section>`;}).join('')}</div>`;
}
function tabelaHtml(sit){
  const leads=comFiltrados(sit);if(!leads.length)return `<div class="empty">Nenhum lead ${sit==='espera'?'em espera':'arquivado'}.</div>`;
  return `<div class="cl-table-wrap"><table class="cl-table"><thead><tr><th>Lead</th><th>Origem</th><th>${sit==='espera'?'Motivo da espera':'Motivo do encerramento'}</th><th>${sit==='espera'?'Retomar em':'Observação'}</th><th>Responsável</th><th></th></tr></thead><tbody>
    ${leads.map(l=>`<tr data-com-open="${esc(l.id)}" tabindex="0"><td><strong>${esc(l.empresa||l.nome)}</strong><br><small>${esc(l.empresa?l.nome:'')}</small></td><td>${esc(origemNome(l.origem))}</td>
      <td>${esc(sit==='espera'?ESPERA_LABEL[l.espera_motivo]||'—':ARQUIVO_LABEL[l.arquivo_motivo]||'—')}</td>
      <td>${sit==='espera'?`<span class="${l.retomar_em&&l.retomar_em<=hojeISO()?'com-alerta':''}">${esc((l.retomar_em||'').split('-').reverse().join('/')||'—')}</span>`:esc(l.arquivo_obs||'—')}</td>
      <td>${esc(pessoaNome(l.responsavel_id)||'—')}</td><td><button type="button" class="secondary" data-com-reativar="${esc(l.id)}" data-stop>↻ Reativar oportunidade</button></td></tr>`).join('')}</tbody></table></div>`;
}

function relatorioHtml(){
  const agora=Date.now(),dia=86400000,hoje=new Date();hoje.setHours(0,0,0,0);
  const novos=(desde)=>com.leads.filter(l=>l.created_at>=desde);
  const porOrigem=list=>Object.entries(list.reduce((a,l)=>(a[l.origem||'']=(a[l.origem||'']||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
  const semContato=com.leads.filter(l=>l.situacao==='andamento'&&l.etapa==='novo'&&!l.primeiro_contato_em&&agora-l.created_at>dia);
  const vencidos=com.leads.filter(l=>l.situacao!=='arquivado'&&l.proximo_followup&&l.proximo_followup<hojeISO());
  const origens=[...new Set(com.leads.map(l=>l.origem||''))];
  const taxa=origens.map(o=>{const t=com.leads.filter(l=>(l.origem||'')===o),f=t.filter(l=>l.etapa==='fechado'&&l.situacao!=='arquivado').length;return [o,t.length,f,t.length?Math.round(f/t.length*100):0];}).sort((a,b)=>b[1]-a[1]);
  const motivos=Object.entries(com.leads.filter(l=>l.situacao==='arquivado').reduce((a,l)=>(a[l.arquivo_motivo]=(a[l.arquivo_motivo]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
  const lista=(ls,extra)=>ls.length?`<ul class="com-lista">${ls.map(l=>`<li data-com-open="${esc(l.id)}" tabindex="0"><strong>${esc(l.empresa||l.nome)}</strong> <small>${extra(l)}</small></li>`).join('')}</ul>`:'<p class="cl-hint">Nenhum.</p>';
  const blocos=[['Hoje',novos(hoje.getTime())],['Últimos 7 dias',novos(agora-7*dia)],['Últimos 30 dias',novos(agora-30*dia)]];
  return `<div class="com-kpis">${blocos.map(([t,ls])=>`<div class="cl-box"><small>Leads novos • ${t}</small><strong>${ls.length}</strong><p>${porOrigem(ls).map(([o,c])=>`${esc(origemNome(o))}: ${c}`).join(' • ')||'—'}</p></div>`).join('')}</div>
    <div class="cl-grid"><section class="cl-box com-box-alerta"><h2>⚠ Sem contato há mais de 24h (${semContato.length})</h2>${lista(semContato,l=>`entrou há ${Math.floor((agora-l.created_at)/3600000)}h • ${esc(origemNome(l.origem))}`)}</section>
      <section class="cl-box"><h2>Follow-ups vencidos (${vencidos.length})</h2>${lista(vencidos,l=>'desde '+esc(l.proximo_followup.split('-').reverse().join('/')))}</section></div>
    <div class="cl-grid"><section class="cl-box"><h2>Quantidade por etapa</h2><dl class="cl-dl">${Object.entries(ETAPA_LABEL).map(([k,v])=>`<div><dt>${v}</dt><dd>${com.leads.filter(l=>l.situacao==='andamento'&&l.etapa===k).length}</dd></div>`).join('')}<div><dt>Em espera</dt><dd>${com.leads.filter(l=>l.situacao==='espera').length}</dd></div><div><dt>Arquivados</dt><dd>${com.leads.filter(l=>l.situacao==='arquivado').length}</dd></div></dl></section>
      <section class="cl-box"><h2>Motivos de perda</h2>${motivos.length?`<dl class="cl-dl">${motivos.map(([m,c])=>`<div><dt>${esc(ARQUIVO_LABEL[m]||m||'—')}</dt><dd>${c}</dd></div>`).join('')}</dl>`:'<p class="cl-hint">Nenhum lead arquivado.</p>'}</section></div>
    <section class="cl-box"><h2>Taxa de fechamento por origem</h2><table class="cl-table"><thead><tr><th>Origem</th><th>Leads</th><th>Fechados</th><th>Taxa</th></tr></thead><tbody>${taxa.map(([o,t,f,p])=>`<tr><td>${esc(origemNome(o))}</td><td>${t}</td><td>${f}</td><td>${p}%</td></tr>`).join('')}</tbody></table></section>`;
}

/* ---------- Painel do lead ---------- */
function painelHtml(){
  const novo=com.aberto==='novo',l=novo?{situacao:'andamento',etapa:'novo',triagem:{}}:com.leads.find(x=>x.id===com.aberto);
  if(!l)return '';
  const f=(k,label,type='text')=>`<label class="field">${label}<input name="${k}" type="${type}" value="${esc(k==='whatsapp'?fone(l[k]):l[k]||'')}"></label>`;
  const sel=(k,label,opts,blank)=>`<label class="field">${label}<select name="${k}"><option value="">${blank}</option>${Object.entries(opts).map(([v,t])=>`<option value="${esc(v)}" ${l[k]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const resumo=`<form id="comForm" class="com-form">${f('nome','Nome do contato')}${f('empresa','Empresa')}${f('whatsapp','WhatsApp')}${f('email','E-mail','email')}${f('instagram','Instagram')}${f('segmento','Segmento')}
    ${sel('interesse','Interesse',INTERESSE_LABEL,'Não informado')}${sel('origem','Origem',{...ORIGEM_LABEL,...(l.origem&&!ORIGEM_LABEL[l.origem]?{[l.origem]:l.origem}:{})},'Não informada')}
    ${sel('responsavel_id','Responsável comercial',Object.fromEntries(com.equipe.map(u=>[u.id,u.name])),'Sem responsável')}${f('proximo_followup','Próximo follow-up','date')}
    <label class="field full">Observações<textarea name="observacoes" rows="4">${esc(l.observacoes||'')}</textarea></label>
    <button type="submit" class="primary">${novo?'Cadastrar lead':'Salvar dados'}</button></form>
    ${novo?'':`<div class="com-acoes">${l.situacao==='andamento'?`<label class="field">Etapa<select id="comEtapa">${Object.entries(ETAPA_LABEL).map(([k,v])=>`<option value="${k}" ${l.etapa===k?'selected':''}>${v}</option>`).join('')}</select></label>
      ${l.etapa==='fechado'?'<p class="note">Fechado. Próximo passo: gerar o contrato (chega com a área de Contratos).</p>':''}
      <details><summary>Colocar em espera</summary><div class="com-sub"><label class="field">Motivo<select id="comEsperaMotivo">${Object.entries(ESPERA_LABEL).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label class="field">Retomar em<input type="date" id="comEsperaData"></label><label class="field">Comentário<input id="comEsperaObs"></label><button type="button" class="secondary" id="comEspera">Mover para Em espera</button></div></details>
      <details><summary>Encerrar (arquivar)</summary><div class="com-sub"><label class="field">Motivo<select id="comArqMotivo">${Object.entries(ARQUIVO_LABEL).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label class="field">Observação<input id="comArqObs" placeholder="Obrigatória em “Outro”"></label><button type="button" class="secondary danger" id="comArquivar">Arquivar lead</button></div></details>`
      :`<p class="note">${l.situacao==='espera'?`Em espera: ${esc(ESPERA_LABEL[l.espera_motivo]||'')} • retomar em ${esc((l.retomar_em||'').split('-').reverse().join('/'))}`:`Arquivado: ${esc(ARQUIVO_LABEL[l.arquivo_motivo]||'')}${l.arquivo_obs?' — '+esc(l.arquivo_obs):''}`}</p><button type="button" class="primary" data-com-reativar="${esc(l.id)}">↻ Reativar oportunidade</button>`}</div>`}`;
  const triagem=Object.entries(l.triagem||{});
  const corpo=com.painel==='triagem'?(triagem.length?`<dl class="cl-dl">${triagem.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(Array.isArray(v)?v.join(', '):String(v))}</dd></div>`).join('')}</dl>`:'<p class="cl-hint">Este lead não veio de formulário ou triagem.</p>')
    :com.painel==='interacoes'?`<form id="comNota" class="com-form"><label class="field full">Registrar interação (reunião, ligação, proposta, retorno…)<textarea name="comentario" rows="3" required></textarea></label><button type="submit" class="primary">Registrar</button></form>
      <ol class="com-timeline">${com.eventos.map(e=>`<li><strong>${esc(EVENTO_LABEL[e.acao]||e.acao)}${e.acao==='etapa'?`: ${esc(ETAPA_LABEL[e.de]||e.de)} → ${esc(ETAPA_LABEL[e.para]||e.para)}`:''}${e.acao==='responsavel'?`: ${esc(pessoaNome(e.para)||'sem responsável')}`:''}</strong>
        <small>${new Date(e.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})} • ${esc(e.autor_nome||'')}</small>${e.comentario?`<p>${esc(e.comentario)}</p>`:''}</li>`).join('')||'<li>Carregando…</li>'}</ol>`:resumo;
  return `<div class="com-overlay" id="comOverlay"></div><div class="com-painel" role="dialog" aria-label="Detalhes do lead"><div class="com-painel-head"><div><h2>${novo?'Novo lead':esc(l.empresa||l.nome)}</h2>${novo?'':`<span class="cl-badge ${l.situacao==='andamento'?'cl-ativo':l.situacao==='espera'?'cl-pausado':'cl-cancelado'}">${l.situacao==='andamento'?esc(ETAPA_LABEL[l.etapa]):l.situacao==='espera'?'Em espera':'Arquivado'}</span>`}</div><button type="button" class="close" id="comFechar" aria-label="Fechar">×</button></div>
    ${novo?'':`<div class="cl-ftabs">${[['resumo','Resumo'],['triagem','Triagem'],['interacoes','Interações']].map(([k,v])=>`<button type="button" class="${com.painel===k?'active':''}" data-com-painel="${k}">${v}</button>`).join('')}</div>`}${corpo}</div>`;
}

async function abrirLead(id){com.aberto=id;com.painel='resumo';com.eventos=[];renderComercial();}
async function carregarEventos(){const r=await fetch('/api/leads?eventos='+encodeURIComponent(com.aberto),{cache:'no-store'});com.eventos=(await r.json()).eventos||[];if(com.painel==='interacoes')renderComercial();}

function bindComercial(){
  $$('[data-stop]').forEach(el=>el.addEventListener('click',e=>e.stopPropagation()));
  $$('[data-com-aba]').forEach(b=>b.onclick=()=>{com.aba=b.dataset.comAba;renderComercial();});
  for(const [id,key] of [['comOrigem','origem'],['comSegmento','segmento'],['comInteresse','interesse'],['comResp','resp']]){const el=$('#'+id);if(el)el.onchange=()=>{com[key]=el.value;renderComercial();};}
  const busca=$('#comBusca');if(busca)busca.oninput=()=>{com.busca=busca.value;const pos=busca.selectionStart;renderComercial();const b=$('#comBusca');b.focus();b.setSelectionRange(pos,pos);};
  $('#comNovo').onclick=()=>abrirLead('novo');
  $$('[data-com-open]').forEach(el=>{el.onclick=()=>abrirLead(el.dataset.comOpen);el.onkeydown=e=>{if(e.key==='Enter')el.click();};});
  $$('[data-com-resp]').forEach(sel=>sel.onchange=async()=>{const l=com.leads.find(x=>x.id===sel.dataset.comResp);await comAction({action:'update',id:l.id,versao:l.versao,lead:{responsavel_id:sel.value}});renderComercial();});
  $$('[data-com-reativar]').forEach(b=>b.onclick=async()=>{const l=com.leads.find(x=>x.id===b.dataset.comReativar);if(await comAction({action:'reactivate',id:l.id,versao:l.versao}))renderComercial();});
  $$('[data-com-drag]').forEach(el=>el.ondragstart=e=>e.dataTransfer.setData('text/plain',el.dataset.comDrag));
  $$('[data-com-drop]').forEach(col=>{col.ondragover=e=>{e.preventDefault();col.classList.add('over');};col.ondragleave=()=>col.classList.remove('over');
    col.ondrop=async e=>{e.preventDefault();col.classList.remove('over');const l=com.leads.find(x=>x.id===e.dataTransfer.getData('text/plain'));if(l&&l.etapa!==col.dataset.comDrop&&await comAction({action:'move',id:l.id,versao:l.versao,etapa:col.dataset.comDrop}))renderComercial();};});
  if(!com.aberto)return;
  const fechar=()=>{com.aberto=null;renderComercial();};$('#comFechar').onclick=fechar;$('#comOverlay').onclick=fechar;
  $$('[data-com-painel]').forEach(b=>b.onclick=()=>{com.painel=b.dataset.comPainel;renderComercial();if(com.painel==='interacoes')carregarEventos();});
  const form=$('#comForm');if(form)form.onsubmit=async e=>{e.preventDefault();const lead=Object.fromEntries(new FormData(form));
    const l=com.leads.find(x=>x.id===com.aberto),saved=com.aberto==='novo'?await comAction({action:'create',lead}):await comAction({action:'update',id:l.id,versao:l.versao,lead});
    if(saved){com.aberto=saved.id;renderComercial();}};
  const l=com.leads.find(x=>x.id===com.aberto);if(!l)return;
  const etapa=$('#comEtapa');if(etapa)etapa.onchange=async()=>{if(await comAction({action:'move',id:l.id,versao:l.versao,etapa:etapa.value}))renderComercial();};
  const esp=$('#comEspera');if(esp)esp.onclick=async()=>{if(await comAction({action:'wait',id:l.id,versao:l.versao,motivo:$('#comEsperaMotivo').value,retomar_em:$('#comEsperaData').value,comentario:$('#comEsperaObs').value}))renderComercial();};
  const arq=$('#comArquivar');if(arq)arq.onclick=async()=>{if(await comAction({action:'archive',id:l.id,versao:l.versao,motivo:$('#comArqMotivo').value,obs:$('#comArqObs').value}))renderComercial();};
  const nota=$('#comNota');if(nota)nota.onsubmit=async e=>{e.preventDefault();if(await comAction({action:'note',id:l.id,comentario:nota.comentario.value})){await carregarEventos();renderComercial();}};
}

const renderRecordsBeforeComercial=renderRecords;renderRecords=()=>{if(activeArea==='comercial')return renderComercial();renderRecordsBeforeComercial();};
const refreshBeforeComercial=refreshArea;refreshArea=()=>{refreshBeforeComercial();$('#branchContext')?.classList.toggle('hidden',activeArea==='clientes'||activeArea==='comercial');};
// O botão do menu só aparece para quem pode usar o Comercial (o servidor confere de novo).
fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(u=>{const ok=u&&(u.admin||u.access==='Gestor');$('[data-area="comercial"]')?.classList.toggle('hidden',!ok);}).catch(()=>{});
