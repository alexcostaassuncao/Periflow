// Uso: com o servidor de teste no ar (npm run dev:teste), rode: node scripts/teste-seguranca-workspace.mjs
// Usa o banco de TESTE: precisa do usuário designer@local.dev (Designer/Produção, senha senha-designer-123); cria gestor@local.dev se faltar.
// Banco de TESTE: o remendo da rota /api/connect barra o que deve e deixa passar o trabalho normal?
import assert from 'node:assert';
const B='http://localhost:3000',O={Origin:B,'Content-Type':'application/json'};
async function login(email,password){const r=await fetch(B+'/api/auth/login',{method:'POST',headers:O,body:JSON.stringify({email,password})});assert.ok(r.ok,'login '+email);return (r.headers.get('set-cookie')||'').split(';')[0];}
const adm=await login('teste@local.dev','senha-de-teste-123');
await fetch(B+'/api/users',{method:'POST',headers:{...O,Cookie:adm},body:JSON.stringify({name:'Teste Gestor',email:'gestor@local.dev',phone:'',role:'Consultor',access:'Gestor',password:'senha-gestor-123'})});
const des=await login('designer@local.dev','senha-designer-123'),ges=await login('gestor@local.dev','senha-gestor-123');
const load=async c=>(await fetch(B+'/api/connect',{headers:{Cookie:c}})).json();
const put=async(c,state,revision)=>{const r=await fetch(B+'/api/connect',{method:'PUT',headers:{...O,Cookie:c},body:JSON.stringify({state,revision})});return {status:r.status,body:await r.json()};};
let w=await load(des),t=w.state.tasks.find(t=>!t.cancelled);
let r=await put(des,{...w.state,tasks:w.state.tasks.map(x=>x.id===t.id?{...x,caption:'legenda editada pelo designer'}:x)},w.revision);
assert.equal(r.status,200);console.log('1) Designer edita tarefa: aceito ✔');
w=await load(des);r=await put(des,{...w.state,tasks:w.state.tasks.filter(x=>x.id!==t.id)},w.revision);
assert.equal(r.status,403);console.log('2) Designer apaga tarefa: barrado ✔',r.body.error);
r=await put(des,{...w.state,clients:w.state.clients.map((c,i)=>i?c:{...c,name:'Alterado'})},w.revision);
assert.equal(r.status,403);console.log('3) Designer altera cliente: barrado ✔',r.body.error);
w=await load(ges);r=await put(ges,{...w.state,clients:w.state.clients.map((c,i)=>i?c:{...c,arts:(c.arts||0)+1})},w.revision);
assert.equal(r.status,200);console.log('4) Gestor altera plano do cliente: aceito ✔');
w=await load(ges);const back={...w.state,clients:w.state.clients.map((c,i)=>i?c:{...c,arts:(c.arts||1)-1})};await put(ges,back,w.revision);
w=await load(ges);r=await put(ges,{...w.state,clients:w.state.clients.slice(1)},w.revision);
assert.equal(r.status,403);console.log('5) Gestor apaga cliente: barrado ✔',r.body.error);
w=await load(adm);r=await put(adm,w.state,w.revision);
assert.equal(r.status,200);console.log('6) Admin grava normalmente ✔');
console.log('Todos os testes passaram.');
