/* Bloco "Etapa atual do fluxo" do modal da tarefa: lista vertical das etapas, com a pessoa de cada uma,
   o estado (concluída / atual / pendente) e o botão "Enviar para próxima etapa".
   As conferências de conteúdo (routingError) são só aviso: dá para enviar mesmo assim.
   A aprovação do cliente é registrada pela equipe (via:'equipe'); no futuro virá também por link (via:'link'). */
const FLOW_ROLE_NAMES={briefing:'Gestor',copy:'Copy',designer:'Designer',recording:'Videomaker',video:'Editor de vídeo',review:'Gestor',traffic:'Gestor de tráfego',sent:'Cliente',approved:''};
let flowUser={id:'',name:''};
fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(u=>{if(u)flowUser={id:u.id||'',name:u.name||''};}).catch(()=>{});
let flowWarning='',flowBusy=false;

function flowRowWho(t,s){
  if(s==='sent'){const c=state.clients.find(c=>c.id===t.clientId);return `<span class="flow-fixed">${esc(c?.name||'Cliente da tarefa')}</span>`;}
  if(s==='approved'){const saved=state.tasks.find(x=>x.id===editingTaskId);return `<span class="flow-fixed">${esc(saved?.status||'Não publicado')}</span>`;}
  const id=ownerFor(t,s),explicit=!!editorStageOwners[s];
  const blank=id&&!explicit?'Padrão da equipe':'Sem responsável';
  return `<select data-stage-owner="${s}" aria-label="Responsável pela etapa ${esc(stageObj(s).label)}"><option value="">${blank}</option>${workflowPeople().map(u=>`<option value="${esc(u.id)}" ${id===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select>`;
}

renderWorkflow=stage=>{
  const t=draftTask(),path=routeFor(t),current=stage||'briefing',index=path.indexOf(current);
  $('#workflowStage').value=current;$('#currentOwner').value=ownerFor(t,current);
  $('#workflowHint').textContent=stageObj(current).label;
  const rows=path.map((s,i)=>{const status=index<0?'pending':i<index?'done':i===index?'current':'pending';
    const mark=status==='done'?'✓':String(i+1);const label=status==='done'?'concluída':status==='current'?'etapa atual':'pendente';
    return `<li class="flow-row is-${status}"><span class="flow-mark" aria-hidden="true">${mark}</span><button type="button" class="flow-name" data-wf="${s}" title="Marcar como etapa atual"><strong>${esc(stageObj(s).label)}</strong><small>${esc(FLOW_ROLE_NAMES[s]||'')}${FLOW_ROLE_NAMES[s]?' • ':''}${label}</small></button><div class="flow-who">${flowRowWho(t,s)}</div></li>`;}).join('');
  const next=path[index+1];
  const action=current==='approved'?'<p class="flow-complete">✓ Fluxo concluído</p>':next?`<button type="button" class="primary" data-flow-next>${current==='sent'?'Registrar aprovação do cliente':'Enviar para próxima etapa'}</button><small class="flow-next-hint">Próxima: ${esc(stageObj(next).label)}</small>`:'';
  const warning=flowWarning?`<div class="flow-warning" role="alert"><p><strong>Atenção:</strong> ${esc(flowWarning)}</p><button type="button" class="secondary" data-flow-force>Enviar mesmo assim</button><button type="button" class="text-button" data-flow-cancel>Voltar e completar</button></div>`:'';
  $('#workflowFlow').className='workflow-flow flow-v2';
  $('#workflowFlow').innerHTML=`<ol class="flow-list">${rows}</ol><div class="flow-actions">${action}</div>${warning}<p class="editor-error" data-flow-error role="alert"></p>`;
  $$('[data-wf]').forEach(b=>b.onclick=()=>{flowWarning='';renderWorkflow(b.dataset.wf);});
  $$('[data-stage-owner]').forEach(select=>select.onchange=()=>{const s=select.dataset.stageOwner;if(select.value)editorStageOwners[s]=select.value;else delete editorStageOwners[s];renderWorkflow($('#workflowStage').value);});
  $('[data-flow-next]')?.addEventListener('click',()=>advanceTask(false));
  $('[data-flow-force]')?.addEventListener('click',()=>advanceTask(true));
  $('[data-flow-cancel]')?.addEventListener('click',()=>{flowWarning='';renderWorkflow($('#workflowStage').value);});
};

// Salva o que estiver no modal e passa a tarefa para a próxima etapa do caminho dela.
async function advanceTask(force){
  if(flowBusy)return;flowBusy=true;
  const fail=msg=>{const e=$('[data-flow-error]');if(e)e.textContent=msg;};
  try{
    const id=editingTaskId&&editorFingerprint()===editorSnapshot?editingTaskId:await saveCurrentTask({offer:false});
    if(!id)return;
    const t=state.tasks.find(t=>t.id===id);if(!t||t.cancelled)return;
    const path=routeFor(t),stage=t.workflowStage||'briefing',next=path[path.indexOf(stage)+1];
    if(!next)return;
    const problem=routingError(t,next);
    if(problem&&!force){flowWarning=problem;renderWorkflow(stage);return;}
    flowWarning='';
    const owner=ownerFor(t,next),now=new Date().toISOString();
    const entry=stage==='sent'
      ?{action:'client_approved',stage:next,from:stage,owner,date:now,by:flowUser.name,byId:flowUser.id,via:'equipe',note:`Aprovado pelo cliente — registrado por ${flowUser.name||'equipe'}`}
      :{action:'forward',stage:next,from:stage,owner,date:now,by:flowUser.name,byId:flowUser.id,...(problem?{warning:problem}:{})};
    const original=structuredClone(state);
    const updated={...t,workflowStage:next,currentOwner:owner,responsible:owner,history:[...(t.history||[]),entry],adjustment:next==='approved'?null:t.adjustment};
    state.tasks[state.tasks.findIndex(x=>x.id===id)]=updated;
    if(!await save()){state=original;dirty=false;renderWorkflow(stage);fail('Não foi possível avançar a etapa. Tente novamente.');return;}
    renderWorkflow(next);setEditorSnapshot();refreshArea();showToast();
  }finally{flowBusy=false;}
}

// Ao abrir outra tarefa (ou uma nova), some o aviso da anterior.
const flowNewBefore=$('#newTask').onclick;$('#newTask').onclick=(...args)=>{flowWarning='';return flowNewBefore(...args);};
const flowEditBefore=editTask;editTask=id=>{flowWarning='';flowEditBefore(id);};
