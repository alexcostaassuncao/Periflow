import {database} from '../../../../db/raw';
import {parseLeadFields} from '../../../../db/leads';

// Entrada automática de leads por formulário (site WordPress, Google Forms, landing pages).
// Sem login: protegida pela chave LEADS_TOKEN (cabeçalho X-Leads-Token ou ?token=). Aceita JSON e formulário.
// Lead já existente (mesmo WhatsApp ou e-mail) é atualizado, não duplicado. Toda chamada vai para lead_entradas.
const reply=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});

function tokenOk(req:Request,url:URL){
  const expected=process.env.LEADS_TOKEN||'',sent=req.headers.get('x-leads-token')||url.searchParams.get('token')||'';
  if(expected.length<16||sent.length!==expected.length)return false;
  let diff=0;for(let i=0;i<sent.length;i++)diff|=sent.charCodeAt(i)^expected.charCodeAt(i);
  return diff===0;
}

export async function POST(req:Request){
  const url=new URL(req.url),db=database(),now=Date.now(),type=(req.headers.get('content-type')||'').split(';')[0].trim();
  if(!process.env.LEADS_TOKEN)return reply({error:'Entrada de leads não configurada no servidor (LEADS_TOKEN).'},503);
  if(!tokenOk(req,url))return reply({error:'Chave inválida.'},401);
  let raw:Record<string,unknown>={},texto='',semToken:Record<string,unknown>={};
  try{
    texto=await req.text();
    if(texto.length>50000)return reply({error:'Conteúdo grande demais.'},413);
    if(type==='application/json'){const j=JSON.parse(texto||'{}');if(!j||typeof j!=='object'||Array.isArray(j))throw Error('JSON precisa ser um objeto.');raw=j;}
    else raw=Object.fromEntries(new URLSearchParams(texto));
  }catch(e:any){await log('rejeitado',null,'Formato inválido: '+String(e?.message||e));return reply({error:'Não consegui ler os dados enviados. Use JSON ou formulário.'},400);}
  const origem=String(url.searchParams.get('origem')||raw.origem||'formulario').slice(0,60);
  const utmSource=String(url.searchParams.get('utm_source')||raw.utm_source||'').slice(0,100),utmCampaign=String(url.searchParams.get('utm_campaign')||raw.utm_campaign||'').slice(0,100);
  {const {token:_t,...rest}=raw as any;semToken=rest;} // a chave nunca vai para o log nem para o lead
  async function log(resultado:string,leadId:string|null,erro=''){
    await db.prepare('INSERT INTO lead_entradas (id,recebido_em,origem,content_type,payload,resultado,lead_id,erro) VALUES (?,?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(),now,String(url.searchParams.get('origem')||'').slice(0,60),type.slice(0,100),JSON.stringify(semToken).slice(0,5000),resultado,leadId,erro.slice(0,500)).run().catch(e=>console.error(e));
  }
  try{
    const f=parseLeadFields(semToken);
    if(!f.nome&&!f.whatsapp&&!f.email){await log('rejeitado',null,'Sem nome, WhatsApp ou e-mail');return reply({error:'Envie pelo menos nome, WhatsApp ou e-mail.'},422);}
    const existing:any=await db.prepare("SELECT * FROM leads WHERE (whatsapp<>'' AND whatsapp=?) OR (email<>'' AND email=?) ORDER BY created_at LIMIT 1").bind(f.whatsapp,f.email).first();
    const nota=`Nova entrada pelo formulário "${origem}"`+(f.observacoes?`:\n${f.observacoes}`:'');
    if(existing){
      // Só completa o que estava vazio; nada que a equipe já preencheu é sobrescrito.
      const fill=(k:string,v:string)=>existing[k]?existing[k]:v;
      await db.batch([
        db.prepare('UPDATE leads SET nome=?,empresa=?,whatsapp=?,email=?,instagram=?,segmento=?,interesse=?,observacoes=?,versao=versao+1,updated_at=? WHERE id=?')
          .bind(fill('nome',f.nome),fill('empresa',f.empresa),fill('whatsapp',f.whatsapp),fill('email',f.email),fill('instagram',f.instagram),fill('segmento',f.segmento),fill('interesse',f.interesse),(existing.observacoes?existing.observacoes+'\n\n':'')+nota,now,existing.id),
        db.prepare("INSERT INTO lead_eventos (id,lead_id,acao,autor_nome,comentario,created_at) VALUES (?,?,'entrada_formulario','Formulário',?,?)").bind(crypto.randomUUID(),existing.id,nota.slice(0,2000),now),
      ]);
      await log('atualizado',existing.id);
      return reply({ok:true,resultado:'atualizado',lead_id:existing.id});
    }
    const id=crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO leads (id,nome,empresa,whatsapp,email,instagram,segmento,interesse,origem,utm_source,utm_campaign,responsavel_id,observacoes,triagem,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id,f.nome,f.empresa,f.whatsapp,f.email,f.instagram,f.segmento,f.interesse,origem,utmSource,utmCampaign,String(process.env.LEADS_RESPONSAVEL_PADRAO||'').slice(0,100),f.observacoes,JSON.stringify(f.triagem).slice(0,10000),now,now),
      db.prepare("INSERT INTO lead_eventos (id,lead_id,acao,para,autor_nome,comentario,created_at) VALUES (?,?,'criado','novo','Formulário',?,?)").bind(crypto.randomUUID(),id,`Entrada pelo formulário "${origem}"`,now),
    ]);
    await log('criado',id);
    return reply({ok:true,resultado:'criado',lead_id:id},201);
  }catch(e:any){console.error(e);await log('erro',null,String(e?.message||e));return reply({error:'Não foi possível registrar o lead.'},503);}
}
