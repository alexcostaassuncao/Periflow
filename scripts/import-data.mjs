// IMPORTAR periflow-export.json NO BANCO NOVO (Turso) E AS MÍDIAS NO CLOUDINARY
// Uso: npm run db:import -- caminho/para/periflow-export.json [--force]
// Lê as credenciais do arquivo .env.local (TURSO_*, CLOUDINARY_*).
import {createClient} from '@libsql/client';
import {readFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';

const args=process.argv.slice(2);
const file=args.find(a=>!a.startsWith('--'));
const force=args.includes('--force');
if(!file){console.error('Uso: npm run db:import -- periflow-export.json [--force]');process.exit(1);}
const env=process.env;
if(!env.TURSO_DATABASE_URL){console.error('✖ Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no arquivo .env.local.');process.exit(1);}

const data=JSON.parse((await readFile(file,'utf8')).replace(/^﻿/,''));
if(data.format!=='periflow-export'||!data.connect)throw Error('Arquivo de exportação inválido.');
const db=createClient({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN||undefined});

const hasTables=(await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='connect_state'")).rows.length>0;
if(!hasTables){console.error('✖ As tabelas ainda não existem. Rode antes: npm run db:migrate');process.exit(1);}
const existing=(await db.execute("SELECT revision FROM connect_state WHERE id='workspace'")).rows[0];
if(existing&&!force){console.error('✖ O banco novo já tem dados. Para sobrescrever com a exportação, rode de novo com --force.');process.exit(1);}

// 1. Mídias do site antigo → Cloudinary
const media=Object.entries(data.media||{});
const replacements=new Map();
if(media.length){
  if(!env.CLOUDINARY_CLOUD_NAME||!env.CLOUDINARY_API_KEY||!env.CLOUDINARY_API_SECRET){console.error('✖ Há mídias para importar: defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no .env.local.');process.exit(1);}
  let i=0;
  for(const [path,item] of media){
    i++;process.stdout.write(`Enviando mídia ${i}/${media.length}… `);
    const video=String(item.type).startsWith('video/');
    const params={public_id:'periflow/importado/'+randomUUID(),timestamp:String(Math.floor(Date.now()/1000))};
    const signature=createHash('sha1').update(Object.keys(params).sort().map(k=>k+'='+params[k]).join('&')+env.CLOUDINARY_API_SECRET).digest('hex');
    const body=new FormData();
    body.set('file',new Blob([Buffer.from(item.base64,'base64')],{type:item.type}));
    for(const [k,v] of Object.entries(params))body.set(k,v);
    body.set('api_key',env.CLOUDINARY_API_KEY);body.set('signature',signature);
    const r=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/${video?'video':'image'}/upload`,{method:'POST',body});
    const result=await r.json();
    if(!r.ok||!result.secure_url){console.log('falhou:',result.error?.message||r.status);continue;}
    replacements.set(path,result.secure_url);console.log('ok');
  }
}
// Troca os links antigos (/api/media/<id>, com ou sem o domínio do site antigo) pelos links do Cloudinary.
const relink=value=>{
  let text=JSON.stringify(value);
  for(const [path,url] of replacements){
    if(data.source)text=text.split(data.source+path).join(url);
    text=text.split(path).join(url);
  }
  return JSON.parse(text);
};

// 2. Dados do sistema (mesmo formato usado pelas rotas)
const statements=[];
const upsert=(id,payload)=>statements.push({sql:'INSERT INTO connect_state (id,payload,revision) VALUES (?,?,1) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=connect_state.revision+1',args:[id,JSON.stringify(payload)]});
if(data.connect.state)upsert('workspace',relink(data.connect.state));
if(data.modules){const {records=[],employeeWallets={},preferences={},audit=[]}=data.modules;upsert('connect-modules-v1',relink({records,employeeWallets,preferences,audit}));}
if(data.permissions?.profiles)upsert('connect-permission-profiles-v1',{profiles:data.permissions.profiles,assignments:data.permissions.assignments||{}});

// 3. Funcionários (as senhas não saem do site antigo: defina-as de novo em Cadastros)
let people=0;
for(const u of data.users?.users||[]){
  statements.push({sql:'INSERT INTO employees (id,name,email,phone,role,access,password_hash,verified,created_at) VALUES (?,?,?,?,?,?,NULL,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,phone=excluded.phone,role=excluded.role,access=excluded.access',args:[u.id,u.name,(u.email==='alexcosta@perferica.me'?'alexcosta@periferica.me':u.email)||null,u.phone||'',u.role,u.access,u.verified?1:0,u.created_at||new Date().toISOString()]});
  people++;
}

await db.batch(statements,'write');
const s=data.connect.state;
console.log(`\n✔ Importação concluída: ${s?.clients?.length||0} clientes, ${s?.tasks?.length||0} tarefas, ${people} funcionários, ${replacements.size}/${media.length} mídias.`);
console.log('Próximo passo: entre com o ADMIN_EMAIL/ADMIN_PASSWORD e defina as senhas dos funcionários em Cadastros.');
db.close();
