import {database,type Statement} from '../../../db/raw';
import {comercialAccess,ETAPAS,INTERESSES,MOTIVOS_ESPERA,MOTIVOS_ARQUIVO,normalizePhone,normalizeEmail,eventosDe} from '../../../db/leads';

// Funil comercial. GET lista os leads (ou a linha do tempo de um, com ?eventos=<id>); POST recebe {action,...}.
// Só Administrador e Gestor. Cada lead tem `versao`: quem grava sobre alteração recente de outra pessoa é avisado.
const noStore={headers:{'Cache-Control':'no-store'}};
const fail=(error:string,status=400)=>Response.json({error},{status});
const s=(v:unknown,max=300)=>typeof v==='string'?v.trim().slice(0,max):'';
const isDate=(v:string)=>v===''||/^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(req:Request){
  if(!comercialAccess(req).ok)return fail('O Comercial é restrito a administradores e gestores.',403);
  try{
    const id=new URL(req.url).searchParams.get('eventos');
    if(id)return Response.json({eventos:await eventosDe(id)},noStore);
    const db=database();
    const [leads,equipe]=await Promise.all([
      db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all(),
      db.prepare("SELECT id,name FROM employees WHERE access IN ('Administrador','Gestor') ORDER BY name").all(),
    ]);
    return Response.json({leads:leads.results.map((l:any)=>({...l,triagem:JSON.parse(l.triagem||'{}')})),equipe:equipe.results},noStore);
  }catch(e){console.error(e);return fail('Não foi possível carregar os leads.',503);}
}

function campos(l:any){
  const out={nome:s(l?.nome,150),empresa:s(l?.empresa,150),whatsapp:normalizePhone(l?.whatsapp),email:normalizeEmail(l?.email),instagram:s(l?.instagram,100).replace(/^@/,''),
    segmento:s(l?.segmento,100),interesse:INTERESSES.includes(l?.interesse)?l.interesse:'',origem:s(l?.origem,60),responsavel_id:s(l?.responsavel_id,100),
    proximo_followup:s(l?.proximo_followup,10),observacoes:s(l?.observacoes,5000)};
  if(!isDate(out.proximo_followup))out.proximo_followup='';
  return out;
}

export async function POST(req:Request){
  const me=comercialAccess(req);
  if(!me.ok)return fail('O Comercial é restrito a administradores e gestores.',403);
  if(req.headers.get('Origin')!==new URL(req.url).origin)return fail('Origem inválida.',403);
  try{
    const p:any=await req.json(),db=database(),now=Date.now();
    // Com `guarda` (versão esperada depois da gravação), o evento só entra se a alteração do lead entrou.
    let guarda:number|null=null;
    const evento=(lead:string,acao:string,de='',para='',comentario='')=>db.prepare('INSERT INTO lead_eventos (id,lead_id,acao,de,para,autor_id,autor_nome,comentario,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE ? IS NULL OR (SELECT versao FROM leads WHERE id=?)=?').bind(crypto.randomUUID(),lead,acao,de,para,me.id,me.name,comentario.slice(0,2000),now,guarda,lead,guarda);

    if(p.action==='create'){
      const f=campos(p.lead);if(!f.nome&&!f.empresa)return fail('Informe o nome ou a empresa do lead.');
      const id=crypto.randomUUID(),cols=Object.keys(f);
      await db.batch([db.prepare(`INSERT INTO leads (id,${cols.join(',')},created_at,updated_at) VALUES (?,${cols.map(()=>'?').join(',')},?,?)`).bind(id,...Object.values(f),now,now),evento(id,'criado','','novo','Cadastrado manualmente')]);
      return Response.json({lead:await db.prepare('SELECT * FROM leads WHERE id=?').bind(id).first()});
    }

    const old:any=await db.prepare('SELECT * FROM leads WHERE id=?').bind(s(p.id,100)).first();
    if(!old)return fail('Lead não encontrado.',404);
    if(p.action==='note'){
      const texto=s(p.comentario,2000);if(!texto)return fail('Escreva a interação.');
      await db.batch([evento(old.id,'interacao','','',texto),db.prepare('UPDATE leads SET primeiro_contato_em=coalesce(primeiro_contato_em,?),updated_at=? WHERE id=?').bind(now,now,old.id)]);
      return Response.json({lead:await db.prepare('SELECT * FROM leads WHERE id=?').bind(old.id).first()});
    }
    if(p.versao!==old.versao)return fail('Outra pessoa alterou este lead agora há pouco. Recarregue antes de continuar.',409);
    guarda=old.versao+1;
    let sets:Record<string,unknown>={},ev:Statement[]=[];
    if(p.action==='update'){
      sets=campos({...old,...p.lead});if(!sets.nome&&!sets.empresa)return fail('Informe o nome ou a empresa do lead.');
      if(sets.responsavel_id!==old.responsavel_id)ev.push(evento(old.id,'responsavel',old.responsavel_id,String(sets.responsavel_id)));
      ev.push(evento(old.id,'editado'));
    }else if(p.action==='move'){
      if(!ETAPAS.includes(p.etapa))return fail('Etapa inválida.');
      if(old.situacao!=='andamento')return fail('Reative o lead antes de mudar a etapa.');
      sets={etapa:p.etapa};if(p.etapa!=='novo'&&!old.primeiro_contato_em)sets.primeiro_contato_em=now;if(p.etapa==='fechado')sets.fechado_em=now;
      ev.push(evento(old.id,'etapa',old.etapa,p.etapa));
    }else if(p.action==='wait'){
      const motivo=s(p.motivo,40),retomar=s(p.retomar_em,10);
      if(!MOTIVOS_ESPERA.includes(motivo))return fail('Escolha o motivo da espera.');
      if(!retomar||!isDate(retomar))return fail('Informe a data de retomada.');
      sets={situacao:'espera',espera_motivo:motivo,retomar_em:retomar,proximo_followup:retomar};if(s(p.responsavel_id,100))sets.responsavel_id=s(p.responsavel_id,100);
      ev.push(evento(old.id,'espera',old.situacao,'espera',s(p.comentario,1000)));
    }else if(p.action==='archive'){
      const motivo=s(p.motivo,40),obs=s(p.obs,1000);
      if(!MOTIVOS_ARQUIVO.includes(motivo))return fail('Escolha o motivo do encerramento.');
      if(motivo==='outro'&&!obs)return fail('Descreva o motivo.');
      sets={situacao:'arquivado',arquivo_motivo:motivo,arquivo_obs:obs};
      ev.push(evento(old.id,'arquivado',old.situacao,'arquivado',obs));
    }else if(p.action==='reactivate'){
      if(old.situacao==='andamento')return fail('Este lead já está em andamento.');
      sets={situacao:'andamento',espera_motivo:'',retomar_em:'',arquivo_motivo:'',arquivo_obs:''};
      ev.push(evento(old.id,'reativado',old.situacao,'andamento',s(p.comentario,1000)));
    }else return fail('Ação inválida.');
    const keys=Object.keys(sets);
    const r=await db.batch([db.prepare(`UPDATE leads SET ${keys.map(k=>k+'=?').join(',')},versao=versao+1,updated_at=? WHERE id=? AND versao=?`).bind(...Object.values(sets),now,old.id,old.versao),...ev]);
    if(!r[0].meta.changes)return fail('Outra pessoa alterou este lead agora há pouco. Recarregue antes de continuar.',409);
    return Response.json({lead:await db.prepare('SELECT * FROM leads WHERE id=?').bind(old.id).first()});
  }catch(e){console.error(e);return fail('Não foi possível salvar o lead.',503);}
}
