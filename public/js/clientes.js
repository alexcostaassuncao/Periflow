/* Central de Clientes (PDF págs. 7 e 7.1): lista com busca e filtros, visão por squad (arrastar entre carteiras),
   ficha com abas e "Adicionar cliente" (cliente já ativo: manual ou importação em lote).
   Os dados são os mesmos clientes da Gestão (state.clients); quem pode gravar é conferido no servidor. */
MODULES.clientes={name:'Clientes',icon:'▤'};
const SITUACAO_LABEL={lead:'Lead',onboarding:'Onboarding',ativo:'Ativo',pausado:'Pausado',inativo:'Inativo',cancelado:'Cancelado'};
const TEAM_ROLE_LABEL={consultant:'Consultora / Gestor',copy:'Copy',designer:'Designer',video:'Videomaker',editor:'Editor de vídeo',traffic:'Tráfego'};
let clientesView='lista',clientesTab='todos',clientesBusca='',clientesSituacao='',clientesServico='',fichaId='',fichaAba='geral',importPreview=null;
let meuAcesso={admin:false,access:''};
fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(u=>{if(u)meuAcesso=u;if(activeArea==='clientes')refreshArea();}).catch(()=>{});
const podeEditarClientes=()=>meuAcesso.admin||meuAcesso.access==='Gestor';
const situacaoDe=c=>SITUACAO_LABEL[c.status]?c.status:'ativo';
const carteiraDe=c=>c.wallet||'C1';
const nomePessoa=id=>workflowPeople().find(u=>u.id===id)?.name||'';
function servicosDe(c){
  const s=[];if(Number(c.arts||0)+Number(c.videos||0)>0)s.push('Social media');if(Number(c.campaignArts||0)+Number(c.campaignVideos||0)>0)s.push('Campanha');
  for(const x of String(c.services||'').split(/[,;]/).map(x=>x.trim()).filter(Boolean))if(!s.includes(x))s.push(x);
  return s;
}
const responsavelDe=c=>nomePessoa(c.team?.consultant)||state.walletInfo?.[carteiraDe(c)]?.owner||'';
const logoHtml=(c,cls='cl-logo')=>c.logo_url?`<img class="${cls}" src="${esc(c.logo_url)}" alt="">`:`<span class="${cls} cl-logo-letter" aria-hidden="true">${esc((c.name||'?').slice(0,2).toUpperCase())}</span>`;
const badge=sit=>`<span class="cl-badge cl-${sit}">${SITUACAO_LABEL[sit]}</span>`;
const dataBR=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v.split('-').reverse().join('/'):'—';

function clientesFiltrados(){
  const q=clientesBusca.trim().toLocaleLowerCase('pt-BR'),digits=q.replace(/\D/g,'');
  return (state.clients||[]).filter(c=>(clientesTab==='todos'||carteiraDe(c)===clientesTab)
    &&(!clientesSituacao||situacaoDe(c)===clientesSituacao)
    &&(!clientesServico||servicosDe(c).includes(clientesServico))
    &&(!q||[c.name,c.fantasy_name,responsavelDe(c)].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q))||digits.length>=3&&String(c.cpf_cnpj||'').replace(/\D/g,'').includes(digits)));
}

function renderClientes(){
  section.classList.remove('hidden');$('#usersSection').classList.add('hidden');
  if(fichaId&&state.clients.some(c=>c.id===fichaId))return renderFicha();
  fichaId='';
  const todos=state.clients||[],lista=clientesFiltrados(),servicos=[...new Set(todos.flatMap(servicosDe))].sort();
  const tabs=['todos',...CARTEIRAS_UI].map(t=>`<button type="button" class="cl-tab ${clientesTab===t?'active':''}" data-cl-tab="${t}">${t==='todos'?'Todos':t} <small>${t==='todos'?todos.length:todos.filter(c=>carteiraDe(c)===t).length}</small></button>`).join('');
  section.innerHTML=`<div class="head"><div><p class="crumb">Clientes</p><h1>Clientes</h1><p class="cl-sub">Todos os clientes da Periférica em um só lugar.</p></div>
    ${podeEditarClientes()?`<div class="cl-add"><button type="button" class="primary" id="clAdd" aria-haspopup="true">+ Adicionar cliente</button>
      <div class="cl-add-menu hidden" id="clAddMenu" role="menu">
        <button type="button" role="menuitem" disabled><strong>Cliente novo (via contrato)</strong><small>Entra sozinho após a assinatura do contrato e segue para o onboarding. Chega com a área de Contratos.</small></button>
        <button type="button" role="menuitem" id="clAddActive"><strong>Cliente já ativo</strong><small>Cadastro manual, com entrada direta na operação.</small></button>
        <button type="button" role="menuitem" id="clImport"><strong>Importar em lote (planilha)</strong><small>Vários clientes já ativos de uma vez, a partir de um arquivo CSV.</small></button>
      </div></div>`:''}</div>
    <div class="cl-toolbar"><div class="cl-tabs" role="tablist">${tabs}</div>
      <div class="cl-view"><button type="button" class="${clientesView==='lista'?'primary':'secondary'}" data-cl-view="lista">Lista</button><button type="button" class="${clientesView==='squads'?'primary':'secondary'}" data-cl-view="squads">Por squad</button></div></div>
    <div class="cl-filters"><label class="field">Buscar<input id="clBusca" value="${esc(clientesBusca)}" placeholder="Nome, CNPJ ou responsável"></label>
      <label class="field">Situação<select id="clSituacao"><option value="">Todas</option>${Object.entries(SITUACAO_LABEL).map(([k,v])=>`<option value="${k}" ${clientesSituacao===k?'selected':''}>${v}</option>`).join('')}</select></label>
      <label class="field">Serviço<select id="clServico"><option value="">Todos os serviços</option>${servicos.map(s=>`<option ${clientesServico===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label>
      <button type="button" class="secondary" id="clLimpar">Limpar filtros</button></div>
    ${importPreview?importHtml():''}
    ${clientesView==='squads'?squadsHtml(lista):listaHtml(lista)}`;
  bindClientes();
}

function listaHtml(lista){
  if(!lista.length)return '<div class="empty">Nenhum cliente com estes filtros.</div>';
  return `<div class="cl-table-wrap"><table class="cl-table"><thead><tr><th>Cliente</th><th>Squad</th><th>Serviços contratados</th><th>Situação</th><th>Responsável</th><th>Entrada</th></tr></thead><tbody>
    ${lista.map(c=>`<tr data-cl-open="${esc(c.id)}" tabindex="0"><td><div class="cl-name">${logoHtml(c)}<div><strong>${esc(c.name)}</strong><small>${esc(c.segment||'')}</small></div></div></td>
      <td><span class="cl-squad">${esc(carteiraDe(c))}</span></td><td>${servicosDe(c).map(s=>`<span class="chip">${esc(s)}</span>`).join(' ')||'—'}</td>
      <td>${badge(situacaoDe(c))}</td><td>${esc(responsavelDe(c)||'—')}</td><td>${dataBR(c.entry_date)}</td></tr>`).join('')}</tbody></table></div>`;
}

function squadsHtml(lista){
  const pode=podeEditarClientes();
  return `<p class="cl-hint">${pode?'Arraste um cliente para movê-lo de squad.':'Somente Gestores e administradores movem clientes entre squads.'}</p><div class="cl-squads">${CARTEIRAS_UI.map(w=>{const cs=lista.filter(c=>carteiraDe(c)===w);
    return `<section class="cl-col" data-cl-drop="${w}"><div class="cl-col-head"><strong>${w}</strong><small>${cs.length} cliente(s)${state.walletInfo?.[w]?.owner?' • '+esc(state.walletInfo[w].owner):''}</small></div>
      ${cs.map(c=>`<article class="cl-card" ${pode?'draggable="true"':''} data-cl-drag="${esc(c.id)}" data-cl-open="${esc(c.id)}" tabindex="0">${logoHtml(c)}<div><strong>${esc(c.name)}</strong><small>${esc(servicosDe(c).join(' • ')||SITUACAO_LABEL[situacaoDe(c)])}</small></div></article>`).join('')||'<p class="cl-empty-col">Nenhum cliente</p>'}</section>`;}).join('')}</div>`;
}

async function gravarCliente(id,changes,msg){
  const c=state.clients.find(x=>x.id===id);if(!c)return false;
  const old=structuredClone(state);Object.assign(c,changes);
  if(await save()){showToast();refreshArea();return true;}
  state=old;dirty=false;refreshArea();window.alert(msg||'Não foi possível salvar. Tente novamente.');return false;
}

function bindClientes(){
  $$('[data-cl-tab]').forEach(b=>b.onclick=()=>{clientesTab=b.dataset.clTab;renderClientes();});
  $$('[data-cl-view]').forEach(b=>b.onclick=()=>{clientesView=b.dataset.clView;renderClientes();});
  const busca=$('#clBusca');busca.oninput=()=>{clientesBusca=busca.value;const pos=busca.selectionStart;renderClientes();const b=$('#clBusca');b.focus();b.setSelectionRange(pos,pos);};
  $('#clSituacao').onchange=e=>{clientesSituacao=e.target.value;renderClientes();};
  $('#clServico').onchange=e=>{clientesServico=e.target.value;renderClientes();};
  $('#clLimpar').onclick=()=>{clientesBusca='';clientesSituacao='';clientesServico='';clientesTab='todos';renderClientes();};
  $$('[data-cl-open]').forEach(el=>{el.onclick=()=>{fichaId=el.dataset.clOpen;fichaAba='geral';renderClientes();};el.onkeydown=e=>{if(e.key==='Enter')el.click();};});
  const add=$('#clAdd');if(add){const menu=$('#clAddMenu');add.onclick=e=>{e.stopPropagation();menu.classList.toggle('hidden');};document.addEventListener('click',()=>menu.classList.add('hidden'),{once:true});
    $('#clAddActive').onclick=()=>{menu.classList.add('hidden');$('#addClient').onclick();};
    $('#clImport').onclick=()=>{menu.classList.add('hidden');escolherPlanilha();};}
  $$('[data-cl-drag]').forEach(el=>el.ondragstart=e=>{e.dataTransfer.setData('text/plain',el.dataset.clDrag);});
  $$('[data-cl-drop]').forEach(col=>{col.ondragover=e=>{e.preventDefault();col.classList.add('over');};col.ondragleave=()=>col.classList.remove('over');
    col.ondrop=e=>{e.preventDefault();col.classList.remove('over');const id=e.dataTransfer.getData('text/plain'),c=state.clients.find(x=>x.id===id);if(c&&carteiraDe(c)!==col.dataset.clDrop)gravarCliente(id,{wallet:col.dataset.clDrop},'Não foi possível mover o cliente. Confira se você tem permissão para as duas carteiras.');};});
  bindImport();
}

/* ---------- Ficha do cliente ---------- */
function renderFicha(){
  const c=state.clients.find(x=>x.id===fichaId),pode=podeEditarClientes(),sit=situacaoDe(c),w=carteiraDe(c);
  const abas=[['geral','Visão geral'],['acessos','Acessos'],['equipe','Equipe'],['servicos','Serviços contratados'],['documentos','Documentos'],['historico','Histórico']];
  const tarefas=state.tasks.filter(t=>t.clientId===c.id);
  let corpo='';
  if(fichaAba==='geral')corpo=`<div class="cl-grid"><section class="cl-box"><h2>Informações da empresa</h2><dl class="cl-dl">
      <div><dt>Nome</dt><dd>${esc(c.name)}</dd></div><div><dt>Nome fantasia</dt><dd>${esc(c.fantasy_name||'—')}</dd></div><div><dt>CNPJ / CPF</dt><dd>${esc(c.cpf_cnpj||'—')}</dd></div>
      <div><dt>Segmento</dt><dd>${esc(c.segment||'—')}</dd></div><div><dt>Contato</dt><dd>${esc(c.contact_name||'—')}</dd></div><div><dt>Telefone</dt><dd>${esc(c.phone||'—')}</dd></div>
      <div><dt>E-mail</dt><dd>${esc(c.email||'—')}</dd></div></dl>${pode?'<button type="button" class="secondary" id="clEditar">Editar cadastro e plano</button>':''}</section>
    <section class="cl-box"><h2>Operação</h2>
      <label class="field">Squad responsável<select id="clSquad" ${pode?'':'disabled'}>${CARTEIRAS_UI.map(x=>`<option ${x===w?'selected':''}>${x}</option>`).join('')}</select><small>É possível trocar o squad a qualquer momento.</small></label>
      <label class="field">Situação<select id="clSit" ${pode?'':'disabled'}>${Object.entries(SITUACAO_LABEL).map(([k,v])=>`<option value="${k}" ${k===sit?'selected':''}>${v}</option>`).join('')}</select></label>
      <label class="field">Data de entrada<input type="date" id="clEntrada" value="${esc(c.entry_date||'')}" ${pode?'':'disabled'}></label>
      <p class="cl-meta">Responsável: <strong>${esc(responsavelDe(c)||'não definido')}</strong></p></section></div>
    <section class="cl-box"><h2>Observações internas</h2><textarea id="clObs" rows="4" ${pode?'':'disabled'} placeholder="Informações importantes sobre o cliente…">${esc(c.notes||'')}</textarea>${pode?'<button type="button" class="secondary" id="clObsSalvar">Salvar observações</button>':''}</section>`;
  if(fichaAba==='equipe'){const team=c.team||{},padrao=state.walletTeams?.[w]||{};
    corpo=`<section class="cl-box"><h2>Equipe do cliente</h2><dl class="cl-dl">${Object.entries(TEAM_ROLE_LABEL).map(([k,l])=>`<div><dt>${l}</dt><dd>${esc(nomePessoa(team[k])||(padrao[k]?nomePessoa(padrao[k])+' (padrão do '+w+')':'—'))}</dd></div>`).join('')}</dl>${pode?'<button type="button" class="secondary" id="clEditar">Alterar equipe</button>':''}</section>`;}
  if(fichaAba==='servicos')corpo=`<section class="cl-box"><h2>Serviços contratados</h2><p>${servicosDe(c).map(s=>`<span class="chip">${esc(s)}</span>`).join(' ')||'Nenhum serviço registrado.'}</p><dl class="cl-dl">
      <div><dt>Artes por mês</dt><dd>${Number(c.arts||0)}</dd></div><div><dt>Vídeos por mês</dt><dd>${Number(c.videos||0)}</dd></div>
      <div><dt>Artes de campanha</dt><dd>${Number(c.campaignArts||0)}</dd></div><div><dt>Vídeos de campanha</dt><dd>${Number(c.campaignVideos||0)}</dd></div></dl>
      <p class="note">Os contratos (valores, vigência e cobrança) aparecem aqui quando a área de Contratos estiver pronta.</p></section>`;
  if(fichaAba==='acessos')corpo=`<section class="cl-box"><h2>Acessos às plataformas</h2><p class="note">Os acessos (Instagram, Meta Business, Google Ads, site e e-mail) ficarão aqui, protegidos pelo cofre de senhas com verificação em duas etapas. Esta parte é construída na fase de Acessos.</p></section>`;
  if(fichaAba==='documentos'){const links=(c.links||[]).filter(Boolean);
    corpo=`<section class="cl-box"><h2>Documentos e links</h2>${links.length?`<ul class="cl-links">${links.map(l=>`<li><a href="${esc(l)}" target="_blank" rel="noopener noreferrer">${esc(l)}</a></li>`).join('')}</ul>`:'<p>Nenhum link cadastrado.</p>'}<p class="note">Os contratos assinados serão guardados aqui quando a área de Contratos estiver pronta.</p></section>`;}
  if(fichaAba==='historico'){const meses=[...new Set(tarefas.map(t=>t.month).filter(Boolean))].sort().reverse();
    corpo=`<section class="cl-box"><h2>Histórico</h2>${c.status==='cancelado'?`<p class="note">Cancelado em ${dataBR(String(c.cancelledAt||'').slice(0,10))}${c.cancelReason?': '+esc(c.cancelReason):''}</p>`:''}
      ${meses.length?`<table class="cl-table"><thead><tr><th>Mês</th><th>Tarefas</th><th>Concluídas</th><th>Canceladas</th></tr></thead><tbody>${meses.map(m=>{const ts=tarefas.filter(t=>t.month===m);return `<tr><td>${esc(m.split('-').reverse().join('/'))}</td><td>${ts.length}</td><td>${ts.filter(t=>t.workflowStage==='approved').length}</td><td>${ts.filter(t=>t.cancelled).length}</td></tr>`;}).join('')}</tbody></table>`:'<p>Nenhuma tarefa registrada ainda.</p>'}</section>`;}
  section.innerHTML=`<p class="crumb"><button type="button" class="text-button" id="clVoltar">‹ Clientes</button> / ${esc(c.name)}</p>
    <div class="cl-fhead">${logoHtml(c,'cl-logo-big')}<div><h1>${esc(c.name)} ${badge(sit)}</h1><p class="cl-sub">${esc([c.segment,c.cpf_cnpj?'CNPJ '+c.cpf_cnpj:'',w].filter(Boolean).join(' • '))}</p>
      <p class="cl-contacts">${[c.contact_name&&'👤 '+esc(c.contact_name),c.phone&&'📞 '+esc(c.phone),c.email&&'✉ '+esc(c.email)].filter(Boolean).join('<span>·</span>')}</p></div>
      <button type="button" class="secondary" id="clGestao">Abrir na Gestão</button></div>
    <div class="cl-ftabs" role="tablist">${abas.map(([k,l])=>`<button type="button" role="tab" aria-selected="${fichaAba===k}" class="${fichaAba===k?'active':''}" data-cl-aba="${k}">${l}</button>`).join('')}</div>${corpo}`;
  $('#clVoltar').onclick=()=>{fichaId='';renderClientes();};
  $$('[data-cl-aba]').forEach(b=>b.onclick=()=>{fichaAba=b.dataset.clAba;renderFicha();});
  $('#clGestao').onclick=()=>{state.selected=c.id;state.wallet=w;clientFilter=c.id;navigateArea('management');};
  const editar=$('#clEditar');if(editar)editar.onclick=()=>{state.selected=c.id;state.wallet=w;$('#editPlan').onclick();};
  if(pode&&fichaAba==='geral'){
    $('#clSquad').onchange=e=>gravarCliente(c.id,{wallet:e.target.value},'Não foi possível trocar o squad. Confira se você tem permissão para as duas carteiras.');
    $('#clSit').onchange=e=>gravarCliente(c.id,{status:e.target.value});
    $('#clEntrada').onchange=e=>gravarCliente(c.id,{entry_date:e.target.value});
    $('#clObsSalvar').onclick=()=>gravarCliente(c.id,{notes:$('#clObs').value.slice(0,5000)});
  }
}

/* ---------- Importação em lote (CSV) ---------- */
// Colunas aceitas (cabeçalho na 1ª linha, separado por ; ou ,): nome, cnpj, squad, situacao, entrada, email, telefone, segmento, contato.
const IMPORT_COLS={nome:'name',cliente:'name',empresa:'name',cnpj:'cpf_cnpj',cpf_cnpj:'cpf_cnpj',squad:'wallet',carteira:'wallet',situacao:'status',status:'status',entrada:'entry_date',data_entrada:'entry_date',email:'email','e-mail':'email',telefone:'phone',whatsapp:'phone',segmento:'segment',contato:'contact_name',responsavel:'contact_name'};
function escolherPlanilha(){const input=document.createElement('input');input.type='file';input.accept='.csv,text/csv';input.onchange=async()=>{const f=input.files[0];if(!f)return;if(f.size>2e6){window.alert('Planilha muito grande (máximo 2 MB).');return;}importPreview=lerPlanilha(await f.text());renderClientes();};input.click();}
const semAcento=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
function lerPlanilha(text){
  const linhas=text.replace(/^﻿/,'').split(/\r?\n/).filter(l=>l.trim());
  if(linhas.length<2)return {erro:'A planilha precisa de um cabeçalho e pelo menos uma linha de cliente.',itens:[]};
  const sep=linhas[0].split(';').length>=linhas[0].split(',').length?';':',';
  const split=l=>{const out=[];let cur='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===sep&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out.map(v=>v.trim());};
  const cab=split(linhas[0]).map(h=>IMPORT_COLS[semAcento(h).replace(/\s+/g,'_')]||'');
  if(!cab.includes('name'))return {erro:'A planilha precisa de uma coluna "nome".',itens:[]};
  const existentes=new Set(state.clients.flatMap(c=>[semAcento(c.name),String(c.cpf_cnpj||'').replace(/\D/g,'')].filter(Boolean)));const vistos=new Set();
  const itens=linhas.slice(1,501).map((l,i)=>{const v=split(l),c={};cab.forEach((k,j)=>{if(k&&v[j])c[k]=v[j].slice(0,300);});
    const erros=[];const doc=String(c.cpf_cnpj||'').replace(/\D/g,'');
    if(!c.name)erros.push('sem nome');
    c.wallet=String(c.wallet||'C1').toUpperCase();if(!CARTEIRAS_UI.includes(c.wallet))erros.push('squad inválido');
    const st=semAcento(c.status||'ativo');c.status=SITUACAO_LABEL[st]?st:'';if(!c.status)erros.push('situação inválida');
    if(c.entry_date){const m=c.entry_date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);c.entry_date=m?`${m[3]}-${m[2]}-${m[1]}`:/^\d{4}-\d{2}-\d{2}$/.test(c.entry_date)?c.entry_date:'';if(c.entry_date){const dt=new Date(c.entry_date+'T12:00:00Z');if(isNaN(dt)||dt.toISOString().slice(0,10)!==c.entry_date)c.entry_date='';}if(!c.entry_date)erros.push('data de entrada inválida (use dd/mm/aaaa)');}
    const chaves=[semAcento(c.name),doc].filter(Boolean);
    if(chaves.some(k=>existentes.has(k)))erros.push('já cadastrado');else if(chaves.some(k=>vistos.has(k)))erros.push('repetido na planilha');
    chaves.forEach(k=>vistos.add(k));return {linha:i+2,cliente:c,erros};});
  return {itens,erro:linhas.length>501?'Só as primeiras 500 linhas foram lidas.':''};
}
function importHtml(){const ok=importPreview.itens.filter(x=>!x.erros.length);
  return `<section class="cl-box cl-import"><h2>Importação em lote — prévia</h2>${importPreview.erro?`<p class="editor-error">${esc(importPreview.erro)}</p>`:''}
    <p>${ok.length} cliente(s) prontos para importar • ${importPreview.itens.length-ok.length} com problema (não serão importados).</p>
    ${importPreview.itens.length?`<div class="cl-table-wrap"><table class="cl-table"><thead><tr><th>Linha</th><th>Nome</th><th>Squad</th><th>Situação</th><th>Entrada</th><th>Resultado</th></tr></thead><tbody>${importPreview.itens.map(x=>`<tr><td>${x.linha}</td><td>${esc(x.cliente.name||'—')}</td><td>${esc(x.cliente.wallet||'')}</td><td>${esc(SITUACAO_LABEL[x.cliente.status]||'—')}</td><td>${dataBR(x.cliente.entry_date)}</td><td>${x.erros.length?`<span class="cl-err">${esc(x.erros.join(', '))}</span>`:'<span class="cl-ok">pronto</span>'}</td></tr>`).join('')}</tbody></table></div>`:''}
    <div class="task-actions"><button type="button" class="secondary" id="clImpCancelar">Cancelar</button><button type="button" class="primary" id="clImpConfirmar" ${ok.length?'':'disabled'}>Importar ${ok.length} cliente(s)</button></div>
    <p class="cl-hint">Colunas aceitas: nome, cnpj, squad, situacao, entrada (dd/mm/aaaa), email, telefone, segmento, contato.</p></section>`;}
function bindImport(){
  const cancel=$('#clImpCancelar');if(!cancel)return;cancel.onclick=()=>{importPreview=null;renderClientes();};
  $('#clImpConfirmar').onclick=async()=>{const novos=importPreview.itens.filter(x=>!x.erros.length).map(x=>({id:makeId(),arts:0,videos:0,campaignArts:0,campaignVideos:0,...x.cliente,importacao_origem:'planilha '+new Date().toISOString().slice(0,10)}));
    const old=structuredClone(state);state.clients.push(...novos);
    if(await save()){importPreview=null;showToast();refreshArea();}else{state=old;dirty=false;window.alert('Não foi possível importar. Nenhum cliente foi gravado.');}};
}

const CARTEIRAS_UI=['C1','C2','C3','C4'];
const renderRecordsBeforeClientes=renderRecords;renderRecords=()=>{if(activeArea==='clientes')return renderClientes();renderRecordsBeforeClientes();};
// A faixa de contexto (botões de cliente no topo das áreas) não se aplica aqui: a Central já tem busca e filtros.
const refreshBeforeClientes=refreshArea;refreshArea=()=>{refreshBeforeClientes();$('#branchContext')?.classList.toggle('hidden',activeArea==='clientes');};
