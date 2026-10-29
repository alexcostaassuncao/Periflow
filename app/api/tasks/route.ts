import {database} from '../../../db/raw';
import {isAdmin} from '../../../db/employees';
import {viewerOf,loadState} from '../../../db/workspace';

// Exclusão definitiva de uma tarefa (só administrador). Remove junto os formulários ligados a ela e
// cancela publicações ainda na fila, numa única transação.
export async function DELETE(req:Request){
  if(!isAdmin(req)||req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Acesso restrito ao administrador.'},{status:403});
  try{
    const p:any=await req.json();if(typeof p.id!=='string'||!p.id||!Number.isInteger(p.modulesRevision))return Response.json({error:'Dados inválidos.'},{status:400});
    const db=database();
    const row:any=await db.prepare('SELECT tarefas.dados,clientes.carteira_id FROM tarefas LEFT JOIN clientes ON clientes.id=tarefas.cliente_id WHERE tarefas.id=?').bind(p.id).first();
    if(!row)return Response.json({error:'Tarefa não encontrada.'},{status:404});
    const task=JSON.parse(row.dados);
    const modules:any=await db.prepare('SELECT payload,revision FROM connect_state WHERE id=?').bind('connect-modules-v1').first();
    if((modules?.revision||0)!==p.modulesRevision)return Response.json({error:'Os dados mudaram. Recarregue antes de excluir.'},{status:409});
    const now=Date.now();
    const active="EXISTS (SELECT 1 FROM instagram_publications WHERE task_id=? AND (status='publishing' OR (status IN ('queued','processing') AND lease_until>?)))";
    if(await db.prepare('SELECT '+active+' AS busy').bind(p.id,now).first().then((r:any)=>r?.busy))return Response.json({error:'Há uma publicação em processamento. Aguarde a confirmação antes de excluir.'},{status:409});
    const data=modules?JSON.parse(modules.payload):{records:[],employeeWallets:{},preferences:{},audit:[]};const removed=data.records.filter((r:any)=>r.data?.task_id===p.id).length;
    data.records=data.records.filter((r:any)=>r.data?.task_id!==p.id);data.audit.unshift({id:crypto.randomUUID(),action:'deleteTask',entity:'Task',recordId:p.id,name:task.name,user:'Adm',at:new Date().toISOString(),wallet:row.carteira_id||'C1',clientId:task.clientId,removedForms:removed});data.audit=data.audit.slice(0,1000);
    // Ordem: 1) formulários (só se nada mudou e não há publicação em andamento), 2) a tarefa, só se o passo 1
    // entrou (o conteúdo gravado é exatamente o nosso), 3) publicações da fila, só se a tarefa saiu.
    const modulePayload=JSON.stringify(data),ok="EXISTS (SELECT 1 FROM tarefas WHERE id=?) AND NOT "+active,deleted='NOT EXISTS (SELECT 1 FROM tarefas WHERE id=?)';
    const statements=[modules
      ?db.prepare("UPDATE connect_state SET payload=?,revision=revision+1 WHERE id='connect-modules-v1' AND revision=? AND "+ok).bind(modulePayload,p.modulesRevision,p.id,p.id,now)
      :db.prepare("INSERT INTO connect_state(id,payload,revision) SELECT 'connect-modules-v1',?,1 WHERE "+ok).bind(modulePayload,p.id,p.id,now),
      db.prepare("DELETE FROM tarefas WHERE id=? AND (SELECT payload FROM connect_state WHERE id='connect-modules-v1')=?").bind(p.id,modulePayload),
      db.prepare("UPDATE instagram_publications SET status='cancelled',error='Tarefa excluída.',updated_at=? WHERE task_id=? AND status IN ('queued','processing') AND "+deleted).bind(now,p.id,p.id)];
    const results=await db.batch(statements);
    if(!results[1].meta.changes)return Response.json({error:'Os dados ou a publicação mudaram. Recarregue e tente novamente.'},{status:409});
    return Response.json({state:await loadState(await viewerOf(req)),revision:1,modules:{...data,revision:p.modulesRevision+1},removedForms:removed});
  }catch(e){console.error(e);return Response.json({error:'Não foi possível excluir a tarefa.'},{status:503});}
}
