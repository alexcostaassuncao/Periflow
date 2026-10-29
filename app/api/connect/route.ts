import {viewerOf,loadState,saveState} from '../../../db/workspace';

// Clientes, tarefas e carteiras da Gestão. Desde a Fundação (migração 0009) ficam em tabelas, e cada pessoa
// recebe e grava só o que o acesso dela permite (regras em db/workspace.ts).
// `revision` continua na resposta só por compatibilidade com a tela; a conferência agora é por linha (_v).
const noStore={headers:{'Cache-Control':'no-store'}};

export async function GET(req:Request){
  try{return Response.json({state:await loadState(await viewerOf(req)),revision:1},noStore);}
  catch(e){console.error(e);return Response.json({error:'Não foi possível carregar o espaço. Tente novamente.'},{status:503});}
}

export async function PUT(req:Request){
  if(req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida.'},{status:403});
  try{
    const p:any=await req.json();
    if(!p?.state||!Array.isArray(p.state.clients)||!Array.isArray(p.state.tasks))return Response.json({error:'Dados inválidos.'},{status:400});
    const json=JSON.stringify(p.state);
    if(json.length>1800000||json.includes('data:image')||json.includes('data:video'))return Response.json({error:'Dados muito grandes. Envie as mídias pelo campo de anexo.'},{status:400});
    const r=await saveState(await viewerOf(req),p.state);
    if(r.status!==200)return Response.json({error:r.error},{status:r.status});
    return Response.json({revision:1,versions:r.versions},noStore);
  }catch(e){console.error(e);return Response.json({error:'Falha ao salvar online. Tente novamente.'},{status:503});}
}
