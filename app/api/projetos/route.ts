import {database,type Statement} from '../../../db/raw';
import {currentUserId,currentUserName} from '../../../db/employees';
import {projetosRole,loadAll,str,noteTime,MESES,STATUS,TIPOS_EMPRESA,PROVEDORES} from '../../../db/projetos';

// API da aba Projetos (antigo GestãoPro). GET carrega tudo; POST recebe {action,...}.
// Administrador e Gestor/Produção editam; Somente leitura apenas consulta (sem ver senhas).

const fail=(error:string,status=400)=>Response.json({error},{status});
const noStore={headers:{'Cache-Control':'no-store'}};

export async function GET(req:Request){
  const role=projetosRole(req);
  try{
    const data=await loadAll(role!=='viewer');
    const equipe=await database().prepare("SELECT id,name FROM employees WHERE access<>'Somente leitura' ORDER BY name").all();
    return Response.json({me:{id:currentUserId(req),name:currentUserName(req),role},equipe:equipe.results,...data},noStore);
  }catch(e){console.error(e);return fail('Não foi possível carregar os projetos. Tente novamente.',503);}
}

function projetoFields(p:any){
  const mes=MESES.includes(p?.mes)?p.mes:MESES[new Date().getMonth()];
  return {cliente:str(p?.cliente,200),link:str(p?.link,500),tipo:str(p?.tipo,100)||'Site',mes,criado_em:str(p?.criadoEm,30),inicio:str(p?.inicio,30),
    entrega:str(p?.entrega,30),status:STATUS.includes(p?.status)?p.status:'Em Processo',owner_id:str(p?.ownerId,100),owner_name:str(p?.ownerName,150),pago:p?.pago?1:0};
}

function notaInsert(projetoId:string,n:any,author:string){
  const date=str(n?.date,40)||new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  return database().prepare('INSERT INTO projeto_notas (id,projeto_id,title,text,date,author,is_alert,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),projetoId,str(n?.title,300),str(n?.text,20000),date,str(n?.author,150)||author,n?.isAlert?1:0,n?.date?noteTime(date):Date.now());
}

function empresaFields(e:any){
  const dia=parseInt(e?.diaLembrete,10);
  return {nome:str(e?.nome,200),tipos:JSON.stringify((Array.isArray(e?.tipos)?e.tipos:[]).filter((t:string)=>TIPOS_EMPRESA.includes(t))),
    tem_suporte:e?.temSuporte?1:0,suporte_inicio:str(e?.suporteInicio,10),suporte_fim:str(e?.suporteFim,10),dia_lembrete:dia>=1&&dia<=31?String(dia):'',
    link_grupo_whatsapp:str(e?.linkGrupoWhatsapp,500),webhook_url:str(e?.webhookUrl,500),codigo_loja:str(e?.codigoLoja,100),usuario_loja:str(e?.usuarioLoja,200),
    senha_loja:str(e?.senhaLoja,200),dominio:str(e?.dominio,300),usuario_dominio:str(e?.usuarioDominio,200),senha_dominio:str(e?.senhaDominio,200),
    provedor_dominio:PROVEDORES.includes(e?.provedorDominio)?e.provedorDominio:'Registro Br'};
}

export async function POST(req:Request){
  const role=projetosRole(req);
  if(role==='viewer')return fail('Seu acesso é somente leitura.',403);
  if(req.headers.get('Origin')!==new URL(req.url).origin)return fail('Origem inválida.',403);
  const author=currentUserName(req);
  const db=database();const now=Date.now();
  try{
    const p:any=await req.json();
    switch(p.action){
      case 'saveProject':{
        const f=projetoFields(p.project);
        if(!f.cliente)return fail('Informe o cliente.');
        if(!f.owner_id){f.owner_id=currentUserId(req);f.owner_name=author;}
        if(p.project?.id){
          const r=await db.prepare('UPDATE projetos SET cliente=?,link=?,tipo=?,mes=?,criado_em=?,inicio=?,entrega=?,status=?,owner_id=?,owner_name=?,pago=?,updated_at=? WHERE id=?')
            .bind(f.cliente,f.link,f.tipo,f.mes,f.criado_em,f.inicio,f.entrega,f.status,f.owner_id,f.owner_name,f.pago,now,p.project.id).run();
          if(!r.meta.changes)return fail('Projeto não encontrado.',404);
          return Response.json({id:p.project.id});
        }
        // Projeto novo: as notas escritas antes de salvar vêm junto
        const id=crypto.randomUUID();
        const notas=(Array.isArray(p.project?.anotacoes)?p.project.anotacoes:[]).slice(0,200);
        await db.batch([
          db.prepare('INSERT INTO projetos (id,cliente,link,tipo,mes,criado_em,inicio,entrega,status,owner_id,owner_name,pago,historico_transferencias,timestamp,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
            .bind(id,f.cliente,f.link,f.tipo,f.mes,f.criado_em,f.inicio,f.entrega,f.status,f.owner_id,f.owner_name,f.pago,'[]',now,now),
          ...notas.map((n:any)=>notaInsert(id,n,author)),
        ]);
        return Response.json({id});
      }
      case 'togglePago':{
        await db.prepare('UPDATE projetos SET pago=?,updated_at=? WHERE id=?').bind(p.pago?1:0,now,str(p.id,100)).run();
        return Response.json({ok:true});
      }
      case 'transfer':{
        if(!MESES.includes(p.toMonth))return fail('Escolha o mês de destino.');
        const row:any=await db.prepare('SELECT mes,historico_transferencias FROM projetos WHERE id=?').bind(str(p.id,100)).first();
        if(!row)return fail('Projeto não encontrado.',404);
        let hist:any[]=[];try{hist=JSON.parse(row.historico_transferencias);}catch{}
        hist.push({de:row.mes,para:p.toMonth,motivo:str(p.motivo,2000),data:new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),author});
        await db.prepare('UPDATE projetos SET mes=?,historico_transferencias=?,updated_at=? WHERE id=?').bind(p.toMonth,JSON.stringify(hist),now,str(p.id,100)).run();
        return Response.json({ok:true});
      }
      case 'addNote':{
        const projetoId=str(p.projetoId,100);
        if(!await db.prepare('SELECT id FROM projetos WHERE id=?').bind(projetoId).first())return fail('Projeto não encontrado.',404);
        if(!str(p.note?.title)&&!str(p.note?.text))return fail('Escreva o assunto ou o texto da nota.');
        await notaInsert(projetoId,{title:p.note.title,text:p.note.text,isAlert:p.note.isAlert},author).run();
        return Response.json({ok:true});
      }
      case 'updateNote':{
        const r=await db.prepare('UPDATE projeto_notas SET title=?,text=?,is_alert=? WHERE id=?').bind(str(p.note?.title,300),str(p.note?.text,20000),p.note?.isAlert?1:0,str(p.id,100)).run();
        if(!r.meta.changes)return fail('Nota não encontrada.',404);
        return Response.json({ok:true});
      }
      case 'deleteNote':{
        await db.prepare('DELETE FROM projeto_notas WHERE id=?').bind(str(p.id,100)).run();
        return Response.json({ok:true});
      }
      case 'saveCompany':{
        const f=empresaFields(p.company);
        if(!f.nome)return fail('Informe o nome da empresa.');
        const cols=Object.keys(f) as (keyof typeof f)[];
        if(p.company?.id){
          const r=await db.prepare(`UPDATE projeto_empresas SET ${cols.map(c=>c+'=?').join(',')},updated_at=? WHERE id=?`).bind(...cols.map(c=>f[c]),now,p.company.id).run();
          if(!r.meta.changes)return fail('Empresa não encontrada.',404);
          return Response.json({id:p.company.id});
        }
        const id=crypto.randomUUID();
        await db.prepare(`INSERT INTO projeto_empresas (id,${cols.join(',')},updated_at) VALUES (?,${cols.map(()=>'?').join(',')},?)`).bind(id,...cols.map(c=>f[c]),now).run();
        return Response.json({id});
      }
      case 'deleteCompany':{
        await db.prepare('DELETE FROM projeto_empresas WHERE id=?').bind(str(p.id,100)).run();
        return Response.json({ok:true});
      }
      case 'setLembrete':{
        await db.prepare('UPDATE projeto_empresas SET ultimo_lembrete_enviado=?,updated_at=? WHERE id=?').bind(str(p.value,20),now,str(p.id,100)).run();
        return Response.json({ok:true});
      }
      case 'import':{
        if(p.wipe&&role!=='admin')return fail('Somente o administrador pode apagar os projetos existentes.',403);
        const rows=Array.isArray(p.rows)?p.rows.slice(0,5000):[];
        const statements:Statement[]=[];
        if(p.wipe)statements.push(db.prepare('DELETE FROM projeto_notas'),db.prepare('DELETE FROM projetos'));
        rows.forEach((row:any,i:number)=>{
          const f=projetoFields(row);if(!f.cliente)return;
          statements.push(db.prepare('INSERT INTO projetos (id,cliente,link,tipo,mes,criado_em,inicio,entrega,status,owner_id,owner_name,pago,historico_transferencias,timestamp,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
            .bind(crypto.randomUUID(),f.cliente,f.link,f.tipo,f.mes,f.criado_em,f.inicio,f.entrega,f.status,f.owner_id||currentUserId(req),f.owner_name||author,0,'[]',now+i,now));
        });
        await db.batch(statements);
        return Response.json({count:statements.length-(p.wipe?2:0)});
      }
      default:return fail('Ação inválida.');
    }
  }catch(e){console.error(e);return fail('Não foi possível salvar. Tente novamente.',503);}
}
