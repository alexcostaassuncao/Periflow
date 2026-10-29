import {database,type Statement} from './raw';

// Clientes, tarefas e carteiras nas tabelas da Fundação (migração 0009). Quem vê e quem grava cada linha
// é decidido aqui, no servidor. Cada linha guarda em `dados` o objeto completo que a tela usa; `versao`
// impede que uma gravação apague, sem aviso, a alteração que outra pessoa acabou de fazer na mesma linha.

export const SITUACOES=['lead','onboarding','ativo','pausado','inativo','cancelado'];
export const CARTEIRAS=['C1','C2','C3','C4'];

export type Viewer={id:string;name:string;admin:boolean;access:string;carteira:string|null}; // carteira null = todas
type Row={dados:any;versao:number;carteira:string};

const header=(req:Request,name:string)=>{try{return decodeURIComponent(req.headers.get(name)||'');}catch{return '';}};

// A carteira de cada pessoa é a escolhida em Cadastros → Usuários (vazio ou "Todas as carteiras" = todas).
export async function viewerOf(req:Request):Promise<Viewer>{
  const id=req.headers.get('x-periflow-user-id')||'',admin=req.headers.get('x-periflow-admin')==='1';
  let carteira:string|null=null;
  if(!admin){
    const row:any=await database().prepare("SELECT payload FROM connect_state WHERE id='connect-modules-v1'").first();
    try{const w=JSON.parse(row?.payload||'{}').employeeWallets?.[id];if(CARTEIRAS.includes(w))carteira=w;}catch{}
  }
  return {id,name:header(req,'x-periflow-user-name'),admin,access:header(req,'x-periflow-user-access'),carteira};
}

// Comparação que ignora a ordem das chaves e o campo _v (versão), para não acusar mudança que não houve.
export const canon=(v:any):string=>Array.isArray(v)?'['+v.map(canon).join(',')+']'
  :v&&typeof v==='object'?'{'+Object.keys(v).filter(k=>k!=='_v'&&v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'
  :JSON.stringify(v===undefined?null:v);
const strip=(v:any)=>{const {_v,...rest}=v;return rest;};

// A tarefa é "da pessoa" se ela é a responsável atual ou de alguma etapa (gravado pelo código do cadastro ou pelo nome).
export function isMine(t:any,v:Viewer){
  const name=v.name.trim().toLowerCase();
  return [t?.currentOwner,t?.responsible,...Object.values(t?.stageOwners||{})].some(o=>typeof o==='string'&&o!==''&&(o===v.id||o.toLowerCase()===name));
}
const inScope=(v:Viewer,carteira:string)=>v.admin||!v.carteira||carteira===v.carteira;
const canManageClients=(v:Viewer)=>v.admin||v.access==='Gestor';

// shortcut: lê todas as linhas e filtra em memória; com muitos milhares de tarefas, filtrar por mês/carteira no SQL.
async function readAll(){
  const db=database();
  const [cs,ts,ws]=await Promise.all([
    db.prepare('SELECT dados,versao,carteira_id FROM clientes ORDER BY rowid').all(),
    db.prepare('SELECT dados,versao,cliente_id FROM tarefas ORDER BY created_at,rowid').all(),
    db.prepare('SELECT id,consultora,equipe FROM carteiras').all(),
  ]);
  const clients=new Map<string,Row>(),tasks=new Map<string,Row>();
  for(const r of cs.results as any[]){const d=JSON.parse(r.dados);clients.set(d.id,{dados:d,versao:r.versao,carteira:r.carteira_id});}
  for(const r of ts.results as any[]){const d=JSON.parse(r.dados);tasks.set(d.id,{dados:d,versao:r.versao,carteira:clients.get(r.cliente_id)?.carteira||''});}
  const carteiras=new Map<string,{consultora:string;equipe:any}>();
  for(const r of ws.results as any[])carteiras.set(r.id,{consultora:r.consultora,equipe:JSON.parse(r.equipe||'{}')});
  return {clients,tasks,carteiras};
}

const thisMonth=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'}).slice(0,7);

// O que a pessoa recebe: clientes da carteira dela (ou de todas) e as tarefas desses clientes,
// mais as tarefas atribuídas a ela em outras carteiras (com o respectivo cliente).
export async function loadState(v:Viewer){
  const {clients,tasks,carteiras}=await readAll();
  const visible=new Set([...clients].filter(([,c])=>inScope(v,c.carteira)).map(([id])=>id));
  const taskList=[...tasks.values()].filter(t=>visible.has(t.dados.clientId)||isMine(t.dados,v));
  for(const t of taskList)if(clients.has(t.dados.clientId))visible.add(t.dados.clientId);
  const clientList=[...clients.values()].filter(c=>visible.has(c.dados.id));
  const walletInfo:any={},walletTeams:any={};
  for(const [id,w] of carteiras){if(w.consultora)walletInfo[id]={owner:w.consultora};walletTeams[id]=w.equipe;}
  return {
    clients:clientList.map(c=>({...c.dados,_v:c.versao})),
    tasks:taskList.map(t=>({...t.dados,_v:t.versao})),
    walletInfo,walletTeams,
    selected:clientList[0]?.dados.id||'',month:thisMonth(),wallet:v.carteira||clientList[0]?.carteira||'C1',
  };
}

type SaveResult={status:number;error?:string;versions?:{clients:Record<string,number>;tasks:Record<string,number>}};
const conflict:SaveResult={status:409,error:'Outra pessoa alterou este item agora há pouco. Recarregue antes de continuar.'};

// Grava só as linhas que mudaram, conferindo a permissão de cada uma. Nada é excluído por aqui:
// clientes e tarefas que não vierem na lista simplesmente ficam como estão.
export async function saveState(v:Viewer,next:any):Promise<SaveResult>{
  if(!v.admin&&v.access!=='Gestor'&&v.access!=='Produção')return {status:403,error:'Seu acesso é somente leitura.'};
  const {clients,tasks,carteiras}=await readAll();
  const db=database(),now=Date.now(),stmts:Statement[]=[],versions={clients:{} as Record<string,number>,tasks:{} as Record<string,number>};
  const incomingClients=new Map<string,any>();
  const validId=(id:unknown)=>typeof id==='string'&&id.length>0&&id.length<=100;

  for(const c of next.clients||[]){
    if(!validId(c?.id))return {status:400,error:'Cliente inválido.'};
    incomingClients.set(c.id,c);
    const old=clients.get(c.id),data=strip(c);
    if(old&&canon(data)===canon(old.dados))continue;
    if(!canManageClients(v))return {status:403,error:'Seu acesso não permite alterar clientes nem equipes das carteiras.'};
    const carteira=CARTEIRAS.includes(c.wallet)?c.wallet:'C1';
    if(!inScope(v,carteira)||old&&!inScope(v,old.carteira))return {status:403,error:'Este cliente é de outra carteira.'};
    if(old&&c._v!==old.versao)return conflict;
    const situacao=SITUACOES.includes(c.status)?c.status:'ativo',nome=String(c.name||'').slice(0,200);
    if(old){stmts.push(db.prepare('UPDATE clientes SET nome=?,carteira_id=?,situacao=?,dados=?,versao=versao+1,updated_at=? WHERE id=? AND versao=?').bind(nome,carteira,situacao,JSON.stringify(data),now,c.id,old.versao));versions.clients[c.id]=old.versao+1;}
    else{stmts.push(db.prepare('INSERT INTO clientes (id,nome,carteira_id,situacao,dados,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(c.id,nome,carteira,situacao,JSON.stringify(data),now,now));versions.clients[c.id]=1;}
  }

  for(const t of next.tasks||[]){
    if(!validId(t?.id))return {status:400,error:'Tarefa inválida.'};
    const old=tasks.get(t.id),data=strip(t);
    if(old&&canon(data)===canon(old.dados))continue;
    if(old?.dados.cancelled)return {status:403,error:'Tarefas canceladas são somente para consulta e não podem ser alteradas.'};
    const owner=incomingClients.get(t.clientId)||clients.get(t.clientId)?.dados;
    if(!owner)return {status:400,error:'A tarefa precisa de um cliente válido.'};
    const carteira=CARTEIRAS.includes(owner.wallet)?owner.wallet:'C1';
    if(!inScope(v,carteira)&&!isMine(old?.dados||t,v))return {status:403,error:'Esta tarefa é de um cliente de outra carteira.'};
    if(old&&t._v!==old.versao)return conflict;
    const cols=[t.clientId,String(t.month||''),String(t.workflowStage||'briefing'),String(t.currentOwner||''),t.cancelled?1:0,JSON.stringify(data)];
    if(old){stmts.push(db.prepare('UPDATE tarefas SET cliente_id=?,mes=?,etapa=?,responsavel=?,cancelada=?,dados=?,versao=versao+1,updated_at=? WHERE id=? AND versao=?').bind(...cols,now,t.id,old.versao));versions.tasks[t.id]=old.versao+1;}
    else{stmts.push(db.prepare('INSERT INTO tarefas (cliente_id,mes,etapa,responsavel,cancelada,dados,id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(...cols,t.id,now,now));versions.tasks[t.id]=1;}
  }

  for(const id of CARTEIRAS){
    const old=carteiras.get(id)||{consultora:'',equipe:{}};
    const consultora=String(next.walletInfo?.[id]?.owner??old.consultora).slice(0,100),equipe=next.walletTeams?.[id]??old.equipe;
    if(consultora===old.consultora&&canon(equipe)===canon(old.equipe))continue;
    if(!canManageClients(v))return {status:403,error:'Seu acesso não permite alterar clientes nem equipes das carteiras.'};
    stmts.push(db.prepare('INSERT INTO carteiras (id,consultora,equipe,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET consultora=excluded.consultora,equipe=excluded.equipe,updated_at=excluded.updated_at').bind(id,consultora,JSON.stringify(equipe||{}),now));
  }

  if(!stmts.length)return {status:200,versions};
  // shortcut: a transação grava tudo junto; se outra pessoa gravar a mesma linha entre a leitura e a escrita,
  // aquela linha não muda (versao) e a pessoa é avisada para recarregar. Raro com o tamanho da equipe.
  const results=await db.batch(stmts);
  if(results.some(r=>r.meta.changes!==1))return conflict;
  return {status:200,versions};
}

// Leituras usadas pelo servidor (Instagram, publicação agendada, formulários), sem filtro de pessoa.
export async function allClients():Promise<any[]>{const r=await database().prepare('SELECT dados FROM clientes ORDER BY rowid').all();return (r.results as any[]).map(x=>JSON.parse(x.dados));}
export async function taskById(id:string):Promise<any|null>{const r:any=await database().prepare('SELECT dados FROM tarefas WHERE id=?').bind(id).first();return r?JSON.parse(r.dados):null;}
