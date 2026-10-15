import {database} from './raw';

// Aba Projetos (antigo GestãoPro): projetos de site/e-commerce por mês, notas, empresas e acessos.
// O nível de acesso vem do cadastro de funcionários do Periflow (cabeçalho x-periflow-user-access, definido no proxy.ts).

export type ProjetosRole='admin'|'collaborator'|'viewer';
export const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const STATUS=['Em Processo','Aguardando Informação','Finalizado','Não vai dar continuidade'];
export const TIPOS_EMPRESA=['Site','Site Catálogo','E-commerce'];
export const PROVEDORES=['Registro Br','Hostinger','Hostgator','Locaweb','Godaddy','Wix','Outros'];

export function projetosRole(req:Request):ProjetosRole{
  if(req.headers.get('x-periflow-admin')==='1')return 'admin';
  let access='';try{access=decodeURIComponent(req.headers.get('x-periflow-user-access')||'');}catch{}
  return access==='Gestor'||access==='Produção'?'collaborator':'viewer';
}

export const str=(v:unknown,max=500)=>typeof v==='string'?v.trim().slice(0,max):typeof v==='number'?String(v):'';
const json=(v:unknown,fallback:any)=>{try{return JSON.parse(String(v));}catch{return fallback;}};

export function projetoFromRow(r:any,notas:any[]){
  return {id:r.id,cliente:r.cliente,link:r.link,tipo:r.tipo,mes:r.mes,criadoEm:r.criado_em,inicio:r.inicio,entrega:r.entrega,status:r.status,
    ownerId:r.owner_id,ownerName:r.owner_name,pago:!!r.pago,historicoTransferencias:json(r.historico_transferencias,[]),timestamp:Number(r.timestamp),
    anotacoes:notas.map(n=>({id:n.id,title:n.title,text:n.text,date:n.date,author:n.author,isAlert:!!n.is_alert}))};
}

export function empresaFromRow(r:any,comSenhas:boolean){
  return {id:r.id,nome:r.nome,tipos:json(r.tipos,[]),temSuporte:!!r.tem_suporte,suporteInicio:r.suporte_inicio,suporteFim:r.suporte_fim,
    diaLembrete:r.dia_lembrete,linkGrupoWhatsapp:r.link_grupo_whatsapp,webhookUrl:comSenhas?r.webhook_url:(r.webhook_url?'•':''),
    codigoLoja:r.codigo_loja,usuarioLoja:r.usuario_loja,senhaLoja:comSenhas?r.senha_loja:(r.senha_loja?'••••••':''),
    dominio:r.dominio,usuarioDominio:r.usuario_dominio,senhaDominio:comSenhas?r.senha_dominio:(r.senha_dominio?'••••••':''),
    provedorDominio:r.provedor_dominio,ultimoLembreteEnviado:r.ultimo_lembrete_enviado};
}

// Converte "dd/mm/aaaa hh:mm" (data das notas) em milissegundos, para ordenar.
export function noteTime(date:string){
  const m=String(date||'').match(/(\d{2})\/(\d{2})\/(\d{4})(?:.*?(\d{2}):(\d{2}))?/);
  return m?new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0)).getTime():Date.now();
}

export async function loadAll(comSenhas:boolean){
  const db=database();
  const [projetos,notas,empresas]=await Promise.all([
    db.prepare('SELECT * FROM projetos').all(),
    db.prepare('SELECT * FROM projeto_notas ORDER BY created_at DESC').all(),
    db.prepare('SELECT * FROM projeto_empresas ORDER BY nome COLLATE NOCASE').all(),
  ]);
  const porProjeto=new Map<string,any[]>();
  for(const n of notas.results as any[]){const list=porProjeto.get(n.projeto_id)||[];list.push(n);porProjeto.set(n.projeto_id,list);}
  return {
    projetos:(projetos.results as any[]).map(r=>projetoFromRow(r,porProjeto.get(r.id)||[])),
    empresas:(empresas.results as any[]).map(r=>empresaFromRow(r,comSenhas)),
  };
}

// Data de hoje no fuso de Brasília (servidor e agendador rodam em UTC).
export function hojeBrasil(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
  const get=(type:string)=>parseInt(parts.find(p=>p.type===type)!.value,10);
  return {dia:get('day'),mes:get('month'),ano:get('year')};
}

// Empresas de E-commerce cujo dia de lembrete de banners já chegou neste mês e ainda não foram avisadas.
// Dia 29-31 em meses mais curtos vale como o último dia do mês.
export function lembretePendente(e:{tipos:string[];diaLembrete:string;ultimoLembreteEnviado:string},hoje=hojeBrasil()){
  if(!e.tipos?.includes('E-commerce')||!e.diaLembrete)return false;
  if(e.ultimoLembreteEnviado===`${hoje.mes}-${hoje.ano}`)return false;
  const ultimoDia=new Date(hoje.ano,hoje.mes,0).getDate();
  return hoje.dia>=Math.min(parseInt(e.diaLembrete,10),ultimoDia);
}

export const mensagemBanner=(nome:string)=>`Olá equipe da ${nome}!\n\nPassando para lembrar que, como parte do nosso serviço, vocês têm direito a solicitar até *2 banners* este mês para o E-commerce.\n\nLembramos que eles não são acumulativos, então nos enviem os pedidos de criação quando quiserem aproveitar!`;
