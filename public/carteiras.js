/* Cadastros → Carteiras e Clientes cancelados.
   - Carteiras: nome do responsável de cada carteira (C1–C4) e os clientes que pertencem a ela (mover de carteira / cancelar).
   - Clientes cancelados: saem da carteira e do fluxo (tarefas, dashboard, formulários) e podem ser reativados.
   Os dados ficam no próprio workspace: state.walletInfo e, em cada cliente, status/cancelledAt/cancelReason/cancelledBy. */
(()=>{
const WALLETS=['C1','C2','C3','C4'];
let isAdminUser=false,userName='Adm';
fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(u=>{if(!u)return;isAdminUser=!!u.admin;userName=u.name||userName;if(activeArea==='registrations'&&['wallets','cancelled'].includes(activeEntity))refreshArea();}).catch(()=>{});

// Antes desta tela, o nome "Dienifer" da C1 era fixo no HTML: vira o valor inicial.
const walletOwner=w=>(state.walletInfo?.[w]?.owner??(w==='C1'?'Dienifer':'')).trim();
const walletLabel=w=>walletOwner(w)?`${w} — ${walletOwner(w)}`:w;
const fmtDate=iso=>{try{return new Date(iso).toLocaleDateString('pt-BR');}catch{return '';}};

// Nomes das carteiras no menu e no seletor "Carteira" do cadastro de cliente
function renderWalletLabels(){
  $$('.wallet').forEach((b,i)=>{const w=WALLETS[i];if(!w)return;let small=b.querySelector('small');if(!small){small=document.createElement('small');b.append(small);}small.textContent=walletOwner(w);});
  const select=$('#clientWallet');if(select)[...select.options].forEach(o=>{const w=o.value||o.textContent.trim().slice(0,2);o.value=w;o.textContent=walletLabel(w);});
}
const waitLabels=()=>{if(!ready){setTimeout(waitLabels,100);return;}renderWalletLabels();};waitLabels();

async function persist(change,message){
  const before=structuredClone(state);
  change();
  if(!await save()){state=before;setStatus('Não foi possível salvar. Tente novamente.',true);refreshArea();return false;}
  if(!visibleClients().some(c=>c.id===state.selected))state.selected=visibleClients()[0]?.id||'';
  renderWalletLabels();refreshArea();showToast();if(message)setStatus(message);
  return true;
}

async function cancelClient(id){
  const c=state.clients.find(c=>c.id===id);if(!c)return;
  if(!await askConfirmation(`${c.name} sai da carteira ${c.wallet||'C1'}, das tarefas e do dashboard. O histórico é mantido e o cliente pode ser reativado em Clientes cancelados.`,'Cancelar cliente'))return;
  const reason=(window.prompt('Motivo do cancelamento (opcional):','')||'').trim().slice(0,500);
  await persist(()=>{Object.assign(c,{status:'cancelado',cancelledAt:new Date().toISOString(),cancelReason:reason,cancelledBy:userName});},`${c.name} cancelado.`);
}
async function reactivateClient(id){
  const c=state.clients.find(c=>c.id===id);if(!c)return;
  if(!await askConfirmation(`${c.name} volta para a carteira ${walletLabel(c.wallet||'C1')} e para o fluxo.`,'Reativar cliente'))return;
  await persist(()=>{c.status='ativo';delete c.cancelledAt;delete c.cancelReason;delete c.cancelledBy;},`${c.name} reativado.`);
}
async function moveClient(id,wallet){
  const c=state.clients.find(c=>c.id===id);if(!c||!WALLETS.includes(wallet))return;
  await persist(()=>{c.wallet=wallet;},`${c.name} movido para ${wallet}.`);
}
async function renameWallet(w,owner){
  await persist(()=>{state.walletInfo||={};state.walletInfo[w]={...(state.walletInfo[w]||{}),owner:owner.trim().slice(0,100)};},`Carteira ${w} atualizada.`);
}

// Abas extras em Cadastros
const baseTabs=tabsHtml;
tabsHtml=()=>{const html=baseTabs();if(activeArea!=='registrations')return html;
  const extra=[['wallets','Carteiras'],['cancelled',`Clientes cancelados (${state.clients.filter(isCancelledClient).length})`]].map(([e,label])=>`<button type="button" class="${activeEntity===e?'primary':'secondary'}" data-entity="${e}">${esc(label)}</button>`).join('');
  return html.replace(/<\/div>$/,extra+'</div>');};

const baseRecords=renderRecords;
renderRecords=()=>{if(activeArea==='registrations'&&activeEntity==='wallets')return renderWallets();if(activeArea==='registrations'&&activeEntity==='cancelled')return renderCancelled();baseRecords();};

const walletOptions=current=>WALLETS.map(w=>`<option value="${w}" ${w===current?'selected':''}>${esc(walletLabel(w))}</option>`).join('');
const readOnlyNote='<p class="note">Somente administradores podem alterar carteiras e cancelar clientes.</p>';

function renderWallets(){
  section.classList.remove('hidden');$('#usersSection').classList.add('hidden');
  section.innerHTML=header('Carteiras')+tabsHtml()+(isAdminUser?'':readOnlyNote)+`<div class="wallet-admin">${WALLETS.map(w=>{const list=activeClients().filter(c=>(c.wallet||'C1')===w);return `<article class="wallet-card">
    <div class="wallet-card-head"><h2>${w}</h2><span class="chip">${list.length} cliente${list.length===1?'':'s'}</span></div>
    <form class="wallet-owner" data-wallet-form="${w}"><label class="field">Responsável / nome da carteira<input name="owner" maxlength="100" value="${esc(walletOwner(w))}" placeholder="Ex.: Bruna" ${isAdminUser?'':'disabled'}></label>${isAdminUser?'<button class="secondary" type="submit">Salvar nome</button>':''}</form>
    <ul class="wallet-clients">${list.map(c=>`<li><span>${esc(c.name)}${c.services==='Campanha'?' <small class="chip">Campanha</small>':''}</span>${isAdminUser?`<select data-move="${esc(c.id)}" aria-label="Carteira de ${esc(c.name)}">${walletOptions(w)}</select><button type="button" class="text-button danger" data-cancel="${esc(c.id)}">Cancelar</button>`:''}</li>`).join('')||'<li class="empty-line">Nenhum cliente nesta carteira.</li>'}</ul>
  </article>`;}).join('')}</div>`;
  bindTabs();bindRefresh();
  $$('[data-wallet-form]').forEach(f=>f.onsubmit=e=>{e.preventDefault();renameWallet(f.dataset.walletForm,f.elements.owner.value);});
  $$('[data-move]').forEach(s=>s.onchange=()=>moveClient(s.dataset.move,s.value));
  $$('[data-cancel]').forEach(b=>b.onclick=()=>cancelClient(b.dataset.cancel));
}

function renderCancelled(){
  section.classList.remove('hidden');$('#usersSection').classList.add('hidden');
  const list=state.clients.filter(isCancelledClient).sort((a,b)=>String(b.cancelledAt||'').localeCompare(String(a.cancelledAt||'')));
  section.innerHTML=header('Clientes cancelados')+tabsHtml()+'<p>Clientes cancelados não aparecem nas carteiras, nas tarefas nem no dashboard. O histórico de tarefas é mantido.</p>'+(isAdminUser?'':readOnlyNote)+
    `<div class="employees-list">${list.map(c=>`<article class="employee-row"><div class="employee-avatar">${esc((c.name||'?').charAt(0).toUpperCase())}</div><div class="employee-main"><h3>${esc(c.name)}</h3>
      <p>Carteira de origem: ${esc(walletLabel(c.wallet||'C1'))}${c.cancelledAt?` • Cancelado em ${fmtDate(c.cancelledAt)}`:''}${c.cancelledBy?` por ${esc(c.cancelledBy)}`:''}</p>
      ${c.cancelReason?`<p>Motivo: ${esc(c.cancelReason)}</p>`:''}${c.notes&&!c.cancelReason?`<p>${esc(c.notes)}</p>`:''}</div>
      <div class="task-actions">${isAdminUser?`<button type="button" class="primary" data-reactivate="${esc(c.id)}">Reativar</button>`:''}</div></article>`).join('')||'<div class="empty">Nenhum cliente cancelado.</div>'}</div>`;
  bindTabs();bindRefresh();
  $$('[data-reactivate]').forEach(b=>b.onclick=()=>reactivateClient(b.dataset.reactivate));
}

// Botão "Cancelar cliente" também na lista Cadastros → Clientes
const baseRegistered=renderRegisteredClients;
renderRegisteredClients=()=>{baseRegistered();if(!isAdminUser)return;
  $$('#registeredClientsList .employee-row').forEach((card,i)=>{const c=activeClients()[i];if(!c||card.querySelector('[data-cancel-client]'))return;
    const b=document.createElement('button');b.type='button';b.className='secondary danger';b.dataset.cancelClient=c.id;b.textContent='Cancelar cliente';b.onclick=()=>cancelClient(c.id);
    card.querySelector('.task-actions')?.append(b);});};
})();
