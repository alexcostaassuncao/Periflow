// IMPORTAR gestaopro-export.json (GestãoPro / Firebase) NA ABA PROJETOS DO PERIFLOW (Turso)
// Uso: npm run db:import-projetos -- caminho/para/gestaopro-export.json
// Lê as credenciais do arquivo .env.local (TURSO_*).
// Pode ser rodado de novo com uma exportação mais recente: os projetos e empresas importados são
// atualizados (a exportação mais recente vence) e as notas vindas do Firebase são substituídas.
// Notas criadas no Periflow não são apagadas.
import {createClient} from '@libsql/client';
import {readFile} from 'node:fs/promises';

const file=process.argv.slice(2).find(a=>!a.startsWith('--'));
if(!file){console.error('Uso: npm run db:import-projetos -- gestaopro-export.json');process.exit(1);}
if(!process.env.TURSO_DATABASE_URL)console.warn('⚠ TURSO_DATABASE_URL não definida: importando no banco local periflow-local.db.');

const data=JSON.parse((await readFile(file,'utf8')).replace(/^﻿/,''));
if(data.format!=='gestaopro-export')throw Error('Arquivo de exportação inválido.');
const db=createClient({url:process.env.TURSO_DATABASE_URL||'file:periflow-local.db',authToken:process.env.TURSO_AUTH_TOKEN||undefined});

const hasTables=(await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projetos'")).rows.length>0;
if(!hasTables){console.error('✖ As tabelas da aba Projetos ainda não existem. Rode antes: npm run db:migrate');process.exit(1);}

const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const STATUS=['Em Processo','Aguardando Informação','Finalizado','Não vai dar continuidade'];
const txt=v=>v===null||v===undefined?'':String(v).trim();
const noteTime=date=>{const m=txt(date).match(/(\d{2})\/(\d{2})\/(\d{4})(?:.*?(\d{2}):(\d{2}))?/);return m?new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0)).getTime():0;};

// Responsáveis: o usuário do Firebase vira o funcionário do Periflow com o mesmo email
const employees=(await db.execute('SELECT id,email FROM employees WHERE email IS NOT NULL')).rows;
const employeeByEmail=new Map(employees.map(r=>[String(r.email).toLowerCase(),String(r.id)]));
const fbEmail=new Map((data.users||[]).map(u=>[u.id,txt(u.email).toLowerCase()]));
const ownerId=uid=>uid?employeeByEmail.get(fbEmail.get(uid)||'')||'firebase:'+uid:'';
let semFuncionario=new Set();

const now=Date.now();const statements=[];
for(const p of data.projects||[]){
  if(!txt(p.cliente))continue;
  const owner=ownerId(p.ownerId);if(owner.startsWith('firebase:'))semFuncionario.add(p.ownerName||p.ownerId);
  const status=STATUS.find(s=>s.toLowerCase()===txt(p.status).toLowerCase())||'Em Processo';
  statements.push({sql:`INSERT INTO projetos (id,cliente,link,tipo,mes,criado_em,inicio,entrega,status,owner_id,owner_name,pago,historico_transferencias,timestamp,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET cliente=excluded.cliente,link=excluded.link,tipo=excluded.tipo,mes=excluded.mes,criado_em=excluded.criado_em,inicio=excluded.inicio,
    entrega=excluded.entrega,status=excluded.status,owner_id=excluded.owner_id,owner_name=excluded.owner_name,pago=excluded.pago,historico_transferencias=excluded.historico_transferencias,updated_at=excluded.updated_at`,
    args:[p.id,txt(p.cliente),txt(p.link),txt(p.tipo)||'Site',MESES.includes(p.mes)?p.mes:MESES[new Date().getMonth()],txt(p.criadoEm),txt(p.inicio),txt(p.entrega),status,
      owner,txt(p.ownerName),p.pago?1:0,JSON.stringify(Array.isArray(p.historicoTransferencias)?p.historicoTransferencias:[]),Number(p.timestamp)||now,now]});
  statements.push({sql:"DELETE FROM projeto_notas WHERE projeto_id=? AND id LIKE 'fb:%'",args:[p.id]});
  (Array.isArray(p.anotacoes)?p.anotacoes:[]).forEach((n,i)=>{
    statements.push({sql:'INSERT INTO projeto_notas (id,projeto_id,title,text,date,author,is_alert,created_at) VALUES (?,?,?,?,?,?,?,?)',
      args:[`fb:${p.id}:${i}`,p.id,txt(n.title),txt(n.text),txt(n.date),txt(n.author),n.isAlert?1:0,noteTime(n.date)||now-i]});
  });
}

const TIPOS=['Site','Site Catálogo','E-commerce'];
for(const c of data.companies||[]){
  if(!txt(c.nome))continue;
  const cols={nome:txt(c.nome),tipos:JSON.stringify((c.tipos||[]).filter(t=>TIPOS.includes(t))),tem_suporte:c.temSuporte?1:0,suporte_inicio:txt(c.suporteInicio),suporte_fim:txt(c.suporteFim),
    dia_lembrete:txt(c.diaLembrete),link_grupo_whatsapp:txt(c.linkGrupoWhatsapp),webhook_url:txt(c.webhookUrl),codigo_loja:txt(c.codigoLoja),usuario_loja:txt(c.usuarioLoja),
    senha_loja:txt(c.senhaLoja),dominio:txt(c.dominio),usuario_dominio:txt(c.usuarioDominio),senha_dominio:txt(c.senhaDominio),provedor_dominio:txt(c.provedorDominio)||'Registro Br',
    ultimo_lembrete_enviado:txt(c.ultimoLembreteEnviado),updated_at:now};
  const keys=Object.keys(cols);
  // Exportação sem senhas: não sobrescreve as senhas já digitadas no Periflow
  const updateKeys=data.semSenhas?keys.filter(k=>k!=='senha_loja'&&k!=='senha_dominio'):keys;
  statements.push({sql:`INSERT INTO projeto_empresas (id,${keys.join(',')}) VALUES (?,${keys.map(()=>'?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${updateKeys.map(k=>`${k}=excluded.${k}`).join(',')}`,
    args:[c.id,...keys.map(k=>cols[k])]});
}

// Tudo numa transação: ou entra inteiro, ou nada muda
await db.batch(statements,'write');
console.log(`✔ Importados: ${(data.projects||[]).length} projetos e ${(data.companies||[]).length} empresas.`);
if(semFuncionario.size)console.log(`ℹ Responsáveis sem funcionário com o mesmo email no Periflow (mantidos pelo nome): ${[...semFuncionario].join(', ')}`);
db.close();
