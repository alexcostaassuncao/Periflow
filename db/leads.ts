import {database} from './raw';

// Comercial: regras do funil de leads (PDF págs. 4, 5 e 5.1). Tabelas na migração 0010.
export const ETAPAS=['novo','contato','reuniao','proposta','negociacao','fechado'];
export const SITUACOES_LEAD=['andamento','espera','arquivado'];
export const INTERESSES=['gestao','gestao_campanha','projeto','servidor'];
export const MOTIVOS_ESPERA=['sem_resposta','retomada_futura','aguardando_cliente'];
export const MOTIVOS_ARQUIVO=['sem_interesse','preco','desqualificado','nao_respondeu','outra_empresa','outro'];

// Só Administrador e Gestor usam o Comercial (bloqueado para os demais).
export function comercialAccess(req:Request){
  const admin=req.headers.get('x-periflow-admin')==='1';
  let access='',name='';try{access=decodeURIComponent(req.headers.get('x-periflow-user-access')||'');name=decodeURIComponent(req.headers.get('x-periflow-user-name')||'');}catch{}
  return {ok:admin||access==='Gestor',id:req.headers.get('x-periflow-user-id')||'',name};
}

// Telefone brasileiro: só dígitos, com DDI 55. "(48) 99999-1234" e "+55 48 99999-1234" viram "5548999991234".
export function normalizePhone(v:unknown){
  let d=String(v??'').replace(/\D/g,'');
  if(d.startsWith('0'))d=d.replace(/^0+/,'');
  if(d.length===10||d.length===11)d='55'+d;
  return d.length>=12&&d.length<=13?d:d.length>=8?d:'';
}
export function normalizeEmail(v:unknown){const e=String(v??'').trim().toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)&&e.length<=200?e:'';}

// Nomes de campo aceitos por formulário (WordPress/Contact Form 7, Elementor, Google Forms, JSON).
const FIELD_MAP:Record<string,string>={
  nome:'nome',name:'nome','your-name':'nome',nome_completo:'nome',full_name:'nome',first_name:'nome',seu_nome:'nome',
  empresa:'empresa',company:'empresa','your-company':'empresa',nome_empresa:'empresa',negocio:'empresa',nome_da_empresa:'empresa',
  whatsapp:'whatsapp',telefone:'whatsapp',phone:'whatsapp','your-phone':'whatsapp',celular:'whatsapp',tel:'whatsapp',fone:'whatsapp',mobile:'whatsapp',
  email:'email','e-mail':'email','your-email':'email',mail:'email',
  instagram:'instagram',insta:'instagram',
  segmento:'segmento',segment:'segmento',ramo:'segmento',nicho:'segmento',area_de_atuacao:'segmento',
  interesse:'interesse',servico:'interesse',service:'interesse',interest:'interesse',servico_de_interesse:'interesse',
  mensagem:'mensagem',message:'mensagem','your-message':'mensagem',observacoes:'mensagem',
};
const IGNORED=/^(token|origem|utm_[a-z]+|_wp.*|action|g-recaptcha-response|form_id|referer_title|queried_id|post_id)$/;
const keyOf=(k:string)=>k.normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase()
  .replace(/^(form_)?fields\[([^\]]+)\](\[value\])?$/,'$2').replace(/\s+/g,'_');

export function interesseDe(v:unknown){
  const t=String(v??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  if(INTERESSES.includes(t))return t;
  if(/hosped|servidor/.test(t))return 'servidor';
  if(/site|landing|loja|e-?commerce|identidade|logo|projeto/.test(t))return 'projeto';
  if(/campanha|trafego|anuncio|ads/.test(t))return 'gestao_campanha';
  if(/gestao|social|rede|conteudo|instagram/.test(t))return 'gestao';
  return '';
}

// Lê os campos de um formulário qualquer. O que não for reconhecido vai para as observações.
export function parseLeadFields(raw:Record<string,unknown>){
  const out:any={nome:'',empresa:'',whatsapp:'',email:'',instagram:'',segmento:'',interesse:'',mensagem:''},extras:string[]=[];
  for(const [k,v] of Object.entries(raw)){
    const value=Array.isArray(v)?v.join(', '):String(v??'').trim();if(!value)continue;
    const key=keyOf(k);if(IGNORED.test(key))continue;
    const field=FIELD_MAP[key];
    if(field&&!out[field])out[field]=value.slice(0,field==='mensagem'?3000:300);else extras.push(`${k}: ${value.slice(0,500)}`);
  }
  const email=normalizeEmail(out.email);if(out.email&&!email)extras.push('E-mail informado (inválido): '+out.email);
  return {nome:out.nome,empresa:out.empresa,whatsapp:normalizePhone(out.whatsapp),email,instagram:out.instagram.replace(/^@/,''),
    segmento:out.segmento,interesse:interesseDe(out.interesse),
    observacoes:[out.mensagem,...extras].filter(Boolean).join('\n').slice(0,5000),triagem:raw};
}

export async function eventosDe(leadId:string){
  return (await database().prepare('SELECT acao,de,para,autor_nome,comentario,created_at FROM lead_eventos WHERE lead_id=? ORDER BY created_at DESC LIMIT 200').bind(leadId).all()).results;
}
