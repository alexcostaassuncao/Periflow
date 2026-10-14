import {database} from '../../../db/raw';
import {isAdmin} from '../../../db/employees';
import {moduleSchemas} from '../../../db/module-schemas';
const rowId='connect-modules-v1';
const wallets=['C1','C2','C3','C4','all'];
export function validateValue(value:any,schema:any):boolean {
  if(value===undefined||value===null||value==='')return true;
  if(schema.enum&&!schema.enum.includes(value))return false;
  if(schema.type==='string')return typeof value==='string'&&value.length<=20000;
  if(schema.type==='number'||schema.type==='integer')return typeof value==='number'&&Number.isFinite(value);
  if(schema.type==='boolean')return typeof value==='boolean';
  if(schema.type==='array')return Array.isArray(value)&&value.length<=500&&value.every(v=>validateValue(v,schema.items||{}));
  if(schema.type==='object')return typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&(!schema.properties||!!schema.properties[k]&&validateValue(v,schema.properties[k])));
  return true;
}
async function read(){const row:any=await database().prepare('SELECT payload,revision FROM connect_state WHERE id=?').bind(rowId).first();return row?{...JSON.parse(row.payload),revision:row.revision}:{records:[],employeeWallets:{},preferences:{},audit:[],revision:0};}
export async function GET(req:Request){if(!isAdmin(req))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});try{return Response.json(await read(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Não foi possível carregar os módulos.'},{status:503});}}
export async function POST(req:Request){
  if(!isAdmin(req))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});
  if(req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida.'},{status:403});
  try{
    const p:any=await req.json();const old=await read();
    if(!Number.isInteger(p.revision)||p.revision!==old.revision)return Response.json({error:'Os registros mudaram em outra aba. Atualize a lista antes de salvar.'},{status:409});
    const now=new Date().toISOString();let id=p.id;
    if(p.action==='employeeWallet'){
      if(!wallets.includes(p.wallet))return Response.json({error:'Carteira inválida.'},{status:400});
      const u=await database().prepare('SELECT id FROM employees WHERE id=?').bind(String(id||'')).first();
      if(!u)return Response.json({error:'Funcionário não encontrado.'},{status:404});
      old.employeeWallets[id]=p.wallet;
    }else if(p.action==='preferences'){
      old.preferences={name:String(p.name||'Adm').slice(0,150),phone:String(p.phone||'').slice(0,40),defaultWallet:wallets.includes(p.defaultWallet)&&p.defaultWallet!=='all'?p.defaultWallet:'C1'};
    }else if(p.action==='save'||p.action==='delete'){
      const schema=(moduleSchemas as any)[p.entity];
      if(!schema)return Response.json({error:'Cadastro inválido.'},{status:400});
      const index=old.records.findIndex((r:any)=>r.id===id&&r.entity===p.entity);
      if(id&&index<0)return Response.json({error:'Registro não encontrado.'},{status:404});
      const workspace:any=await database().prepare('SELECT payload FROM connect_state WHERE id=?').bind('workspace').first();const state=workspace?JSON.parse(workspace.payload):{clients:[],tasks:[]};
      const linkedTask=index>=0?old.records[index].data?.task_id:null;
      if(linkedTask&&state.tasks.find((t:any)=>t.id===linkedTask)?.cancelled)return Response.json({error:'Os formulários de uma tarefa cancelada são somente para consulta.'},{status:403});
      if(p.action==='delete'){if(p.entity==='CRMLead'){const event=old.records.find((r:any)=>r.entity==='CalendarEvent'&&r.data.lead_id===id);if(event){event.data.meeting_status='cancelada';event.data.lead_id='';}}if(p.entity==='CalendarEvent'){const lead=old.records.find((r:any)=>r.entity==='CRMLead'&&r.data.calendar_event_id===id);if(lead){delete lead.data.calendar_event_id;delete lead.data.data_reuniao;if(lead.data.status==='reuniao_marcada')lead.data.status='prospeccao';}}if(index<0)return Response.json({error:'Registro não encontrado.'},{status:404});old.records.splice(index,1);}
      else{
        if(!wallets.includes(p.wallet)||!validateValue(p.data,schema)||!p.data||typeof p.data!=='object')return Response.json({error:'Confira os campos e a carteira.'},{status:400});
        for(const key of schema.required||[])if(p.data[key]===undefined||p.data[key]===null||p.data[key]==='')return Response.json({error:'Preencha todos os campos obrigatórios.'},{status:400});
        if(p.clientId){const c=state.clients.find((c:any)=>c.id===p.clientId);if(!c||p.wallet==='all'||(c.wallet||'C1')!==p.wallet)return Response.json({error:'O cliente deve pertencer à carteira selecionada.'},{status:400});}
        if(p.data.client_id&&p.data.client_id!==p.clientId)return Response.json({error:'O cliente do cadastro deve ser o mesmo cliente do vínculo.'},{status:400});
        if(p.entity==='EmployeeDetails'&&!await database().prepare('SELECT id FROM employees WHERE id=?').bind(p.data.employee_id).first())return Response.json({error:'Funcionário não encontrado.'},{status:400});
        if(p.data.task_id){const task=state.tasks.find((t:any)=>t.id===p.data.task_id);if(!task||task.cancelled||task.clientId!==p.clientId)return Response.json({error:'Selecione uma tarefa ativa deste cliente.'},{status:400});}
        if(p.entity==='FormularioTarefa'){
          const previous=index>=0?old.records[index].data:null;
          const stage=p.data.workflow_stage||(p.data.status==='aprovado'?'approved':'briefing');
          if(stage==='adjustments'&&!String(p.data.adjustment_comment||'').trim())return Response.json({error:'Informe o ajuste solicitado.'},{status:400});
          p.data.workflow_stage=stage;p.data.status=({briefing:'rascunho',copy:'briefing_completo',designer:'briefing_completo',video:'briefing_completo',review:'em_revisao',sent:'aguardando_aprovacao',approved:'aprovado',adjustments:'ajuste'} as any)[stage];
          p.data.historico=previous?.historico||[];
          if(!previous||previous.workflow_stage!==stage||previous.responsible!==p.data.responsible||stage==='adjustments'&&previous.adjustment_comment!==p.data.adjustment_comment){
            p.data.historico=[...p.data.historico,{timestamp:now,user_email:req.headers.get('oai-authenticated-user-email'),change_type:!previous?'criacao':stage==='adjustments'?'ajuste':'andamento',campo:'Etapa / responsável',old_value:previous?(previous.workflow_stage||'briefing')+' • '+(previous.responsible||''):'',new_value:stage+' • '+p.data.responsible+(stage==='adjustments'?' • '+p.data.adjustment_comment:'')}].slice(-200);
          }else{
            const keys=['nome_formulario','tipo','production_type','due_date','priority','briefing','copy','criacao','review_notes'];
            const changed=keys.filter(key=>JSON.stringify(previous[key])!==JSON.stringify(p.data[key]));
            if(changed.length)p.data.historico=[...p.data.historico,{timestamp:now,user_email:req.headers.get('oai-authenticated-user-email'),change_type:'edicao',campo:changed.join(', '),old_value:'Conteúdo anterior',new_value:'Conteúdo da peça atualizado'}].slice(-200);
          }
        }
        if(p.entity==='CRMLead'){
          const previous=index>=0?old.records[index].data:null;
          if(p.data.status==='reuniao_marcada'&&!p.data.data_reuniao)return Response.json({error:'Informe a data da reunião para marcar esta etapa.'},{status:400});
          if(p.data.status==='cancelado'&&!p.data.motivo_cancelamento)return Response.json({error:'Informe o motivo do cancelamento.'},{status:400});
          if(p.data.data_reuniao&&!Number.isFinite(Date.parse(p.data.data_reuniao)))return Response.json({error:'Data de reunião inválida.'},{status:400});
          id=id||crypto.randomUUID();
          p.data.historico=previous?.historico||[];
          if(!previous||previous.status!==p.data.status)p.data.historico=[...p.data.historico,{data:now,usuario_email:req.headers.get('oai-authenticated-user-email')||'',usuario_nome:'Adm',status_anterior:previous?.status||'',status_novo:p.data.status||'prospeccao',observacao:p.data.observacoes||''}].slice(-200);
          const eventIndex=old.records.findIndex((r:any)=>r.entity==='CalendarEvent'&&(r.id===previous?.calendar_event_id||r.data.lead_id===id));
          if(p.data.data_reuniao){
            const event=eventIndex>=0?old.records[eventIndex]:null;
            const eventId=event?.id||crypto.randomUUID();p.data.calendar_event_id=eventId;
            const linked={id:eventId,entity:'CalendarEvent',wallet:p.wallet,clientId:p.clientId||'',createdAt:event?.createdAt||now,updatedAt:now,data:{...event?.data,title:'Reunião comercial • '+p.data.nome_empresa,event_type:'reuniao_comercial',start_datetime:p.data.data_reuniao,prospect_name:p.data.nome_empresa,lead_id:id,responsavel_nome:p.data.responsavel_nome||'',description:p.data.observacoes_reuniao||'',meeting_status:p.data.status==='cancelado'?'cancelada':event?.data?.meeting_status||'agendada'}};
            if(eventIndex>=0)old.records[eventIndex]=linked;else old.records.push(linked);
          }else if(eventIndex>=0){old.records[eventIndex].data.meeting_status='cancelada';old.records[eventIndex].updatedAt=now;p.data.calendar_event_id=old.records[eventIndex].id;}
        }
        if(p.entity==='CalendarEvent'){
          if(!Number.isFinite(Date.parse(p.data.start_datetime))||p.data.end_datetime&&(!Number.isFinite(Date.parse(p.data.end_datetime))||Date.parse(p.data.end_datetime)<Date.parse(p.data.start_datetime)))return Response.json({error:'Confira o início e o fim do evento.'},{status:400});
          const prior=index>=0?old.records[index].data:null;
          if(prior?.lead_id){p.data.lead_id=prior.lead_id;const lead=old.records.find((r:any)=>r.entity==='CRMLead'&&r.id===prior.lead_id);if(lead){lead.data.data_reuniao=p.data.start_datetime;lead.data.observacoes_reuniao=p.data.description||'';lead.updatedAt=now;}}
        }
        if(p.entity==='Proposal'&&p.data.lead_id){
          const lead=old.records.find((r:any)=>r.entity==='CRMLead'&&r.id===p.data.lead_id);
          if(!lead)return Response.json({error:'Lead da proposta não encontrado.'},{status:400});
          if(p.data.total_value<0||(p.data.discount||0)<0||(p.data.discount||0)>p.data.total_value)return Response.json({error:'Confira o valor e o desconto da proposta.'},{status:400});
          p.data.final_value=p.data.total_value-(p.data.discount||0);
          const next=p.data.status==='enviado'?'proposta':p.data.status==='aprovado'||p.data.status==='convertido'?'contrato':null;
          if(next&&!['cancelado','onboarding','cliente_ativo'].includes(lead.data.status)&&lead.data.status!==next){lead.data.historico=[...(lead.data.historico||[]),{data:now,usuario_email:req.headers.get('oai-authenticated-user-email')||'',usuario_nome:'Adm',status_anterior:lead.data.status||'prospeccao',status_novo:next,observacao:'Etapa atualizada pela proposta.'}].slice(-200);lead.data.status=next;lead.updatedAt=now;}
        }
        const copies=p.copies===undefined?1:p.copies;
        if(!Number.isInteger(copies)||copies<1||copies>100||(copies>1&&(index>=0||p.entity!=='FormularioTarefa')))return Response.json({error:'Use de 1 a 100 peças na criação.'},{status:400});
        id=id||crypto.randomUUID();const record={id,entity:p.entity,wallet:p.wallet,clientId:p.clientId||'',data:p.data,createdAt:index>=0?old.records[index].createdAt:now,updatedAt:now};
        if(index>=0)old.records[index]=record;else old.records.push(record);
        if(copies>1){record.data={...p.data,nome_formulario:p.data.nome_formulario+' 01'};for(let i=2;i<=copies;i++)old.records.push({...record,id:crypto.randomUUID(),data:{...p.data,nome_formulario:p.data.nome_formulario+' '+String(i).padStart(2,'0')}});}
      }
    }else return Response.json({error:'Ação inválida.'},{status:400});
    old.audit.unshift({id:crypto.randomUUID(),action:p.action,entity:p.entity||'Configuração',recordId:id||'',user:'Adm',at:now,wallet:p.wallet||'all',clientId:p.clientId||''});old.audit=old.audit.slice(0,1000);
    const json=JSON.stringify({records:old.records,employeeWallets:old.employeeWallets,preferences:old.preferences,audit:old.audit});
    if(json.length>1800000)return Response.json({error:'Limite de registros atingido.'},{status:400});
    const db=database();const result=old.revision===0?await db.prepare('INSERT OR IGNORE INTO connect_state (id,payload,revision) VALUES (?,?,1)').bind(rowId,json).run():await db.prepare('UPDATE connect_state SET payload=?,revision=revision+1 WHERE id=? AND revision=?').bind(json,rowId,old.revision).run();
    if(!result.meta.changes)return Response.json({error:'Os registros mudaram em outra aba. Atualize a lista antes de salvar.'},{status:409});
    return Response.json({...old,revision:old.revision+1,id});
  }catch{return Response.json({error:'Não foi possível salvar. Tente novamente.'},{status:503});}
}
