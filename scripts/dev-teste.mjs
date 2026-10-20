// Abre o Periflow para TESTE no computador, com um banco local separado (periflow-teste.db).
// Nunca toca no Turso de produção, mesmo que o .env.local aponte para ele.
// Uso: npm run dev:teste   → http://localhost:3000/connect.html
// Login de teste: teste@local.dev / senha-de-teste-123
import {spawn} from 'node:child_process';

const env={
  ...process.env,
  TURSO_DATABASE_URL:'file:periflow-teste.db',
  TURSO_AUTH_TOKEN:'',
  ADMIN_EMAIL:'teste@local.dev',
  ADMIN_PASSWORD:'senha-de-teste-123',
  SESSION_SECRET:'segredo-de-sessao-local-de-teste-1234567890',
  CRON_SECRET:'cron-secreto-de-teste-123',
};
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{env,stdio:'inherit',shell:true});p.on('exit',code=>code?reject(Error(cmd+' saiu com código '+code)):resolve());});

await run('node',['scripts/db-migrate.mjs']);
console.log('\n  Banco de TESTE: periflow-teste.db (produção não é usada)');
console.log('  Abra: http://localhost:3000/connect.html');
console.log('  Login: teste@local.dev / senha-de-teste-123\n');
await run('npx',['next','dev','-p','3000']);
