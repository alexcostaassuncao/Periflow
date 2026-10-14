import {database} from '../../../db/raw';
import {isAdmin} from '../../../db/employees';
export async function DELETE(req:Request){
  if(!isAdmin(req)||req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Acesso restrito ao administrador.'},{status:403});
  try{
    const p:any=await req.json();if(!p.id||!Number.isInteger(p.revision)||!Number.isInteger(p.modulesRevision))return Response.json({error:'Dados inválidos.'},{status:400});
    const db=database();const workspace:any=await db.prepare('SELECT payload,revision FROM connect_state WHERE id=?').bind('workspace').first();const modules:any=await db.prepare('SELECT payload,revision FROM connect_state WHERE id=?').bind('connect-modules-v1').first();
    if(!workspace||workspace.revision!==p.revision||(modules?.revision||0)!==p.modulesRevision)return Response.json({error:'Os dados mudaram. Recarregue antes de excluir.'},{status:409});
    const state=JSON.parse(workspace.payload);const task=state.tasks.find((t:any)=>t.id===p.id);if(!task)return Response.json({error:'Tarefa não encontrada.'},{status:404});
    const now=Date.now();const active=await db.prepare("SELECT id FROM instagram_publications WHERE task_id=? AND (status='publishing' OR (status IN ('queued','processing') AND lease_until>?))").bind(p.id,now).first();
    if(active)return Response.json({error:'Há uma publicação em processamento. Aguarde a confirmação antes de excluir.'},{status:409});
    state.tasks=state.tasks.filter((t:any)=>t.id!==p.id);
    const data=modules?JSON.parse(modules.payload):{records:[],employeeWallets:{},preferences:{},audit:[]};const removed=data.records.filter((r:any)=>r.data?.task_id===p.id).length;
    data.records=data.records.filter((r:any)=>r.data?.task_id!==p.id);data.audit.unshift({id:crypto.randomUUID(),action:'deleteTask',entity:'Task',recordId:p.id,name:task.name,user:'Adm',at:new Date().toISOString(),wallet:state.clients.find((c:any)=>c.id===task.clientId)?.wallet||'C1',clientId:task.clientId,removedForms:removed});data.audit=data.audit.slice(0,1000);
    const payload=JSON.stringify(state),modulePayload=JSON.stringify(data);const guard="EXISTS (SELECT 1 FROM connect_state WHERE id='workspace' AND revision=?)";
    const statements=[db.prepare("UPDATE connect_state SET payload=?,revision=revision+1 WHERE id='workspace' AND revision=? AND COALESCE((SELECT revision FROM connect_state WHERE id='connect-modules-v1'),0)=? AND NOT EXISTS (SELECT 1 FROM instagram_publications WHERE task_id=? AND (status='publishing' OR (status IN ('queued','processing') AND lease_until>?)))").bind(payload,p.revision,p.modulesRevision,p.id,now)];
    if(modules)statements.push(db.prepare("UPDATE connect_state SET payload=?,revision=revision+1 WHERE id='connect-modules-v1' AND revision=? AND "+guard).bind(modulePayload,p.modulesRevision,p.revision+1));
    else statements.push(db.prepare("INSERT INTO connect_state(id,payload,revision) SELECT 'connect-modules-v1',?,1 WHERE "+guard).bind(modulePayload,p.revision+1));
    statements.push(db.prepare("UPDATE instagram_publications SET status='cancelled',error='Tarefa excluída.',updated_at=? WHERE task_id=? AND status IN ('queued','processing') AND "+guard).bind(now,p.id,p.revision+1));
    const results=await db.batch(statements);if(!results[0].meta.changes)return Response.json({error:'Os dados ou a publicação mudaram. Recarregue e tente novamente.'},{status:409});
    return Response.json({state,revision:p.revision+1,modules:{...data,revision:p.modulesRevision+1},removedForms:removed});
  }catch{return Response.json({error:'Não foi possível excluir a tarefa.'},{status:503});}
}
