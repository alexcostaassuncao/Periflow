// Uso: com o servidor de teste no ar (npm run dev:teste), rode: node scripts/teste-seguranca-workspace.mjs
// Banco de TESTE. Confere, pela API, quem vê e quem grava clientes e tarefas (regras em db/workspace.ts).
// Precisa do usuário designer@local.dev (Designer/Produção, senha senha-designer-123); cria os demais se faltarem.
import assert from 'node:assert';
const B='http://localhost:3000',O={Origin:B,'Content-Type':'application/json'};
async function login(email,password){const r=await fetch(B+'/api/auth/login',{method:'POST',headers:O,body:JSON.stringify({email,password})});assert.ok(r.ok,'login '+email);return (r.headers.get('set-cookie')||'').split(';')[0];}
const adm=await login('teste@local.dev','senha-de-teste-123');
const post=(ck,url,body,method='POST')=>fetch(B+url,{method,headers:{...O,Cookie:ck},body:JSON.stringify(body)});
for(const [name,email,role,access,password] of [['Teste Gestor','gestor@local.dev','Consultor','Gestor','senha-gestor-123'],['Teste Leitura','leitura@local.dev','Outro','Somente leitura','senha-leitura-123']])
  await post(adm,'/api/users',{name,email,phone:'',role,access,password});
const users=(await (await fetch(B+'/api/users',{headers:{Cookie:adm}})).json()).users;
const designer=users.find(u=>u.email==='designer@local.dev');
const setWallet=async wallet=>{const m=await (await fetch(B+'/api/modules',{headers:{Cookie:adm}})).json();assert.ok((await post(adm,'/api/modules',{action:'employeeWallet',id:designer.id,wallet,revision:m.revision})).ok,'carteira');};
const load=async ck=>(await (await fetch(B+'/api/connect',{headers:{Cookie:ck}})).json()).state;
const put=async(ck,state)=>{const r=await post(ck,'/api/connect',{state,revision:1},'PUT');return {status:r.status,body:await r.json()};};
const edit=(state,id,change)=>({...state,tasks:state.tasks.map(t=>t.id===id?{...t,...change}:t)});

// Cenário: cliente na C2 com uma tarefa atribuída ao Designer e outra não.
let s=await load(adm);
const scenario={clients:[{id:'teste-c2',name:'Cliente C2 Teste',wallet:'C2',status:'ativo'}],
  tasks:[{id:'c2-minha',clientId:'teste-c2',name:'C2 atribuída ao designer',type:'Arte',month:s.month,workflowStage:'designer',currentOwner:'',stageOwners:{designer:designer.id}},
         {id:'c2-outra',clientId:'teste-c2',name:'C2 de outra pessoa',type:'Arte',month:s.month,workflowStage:'designer',currentOwner:''}]};
const missing={clients:scenario.clients.filter(c=>!s.clients.some(x=>x.id===c.id)),tasks:scenario.tasks.filter(t=>!s.tasks.some(x=>x.id===t.id))};
if(missing.clients.length||missing.tasks.length)assert.equal((await put(adm,{...s,clients:[...s.clients,...missing.clients],tasks:[...s.tasks,...missing.tasks]})).status,200);
await setWallet('C1');
const des=await login('designer@local.dev','senha-designer-123'),ges=await login('gestor@local.dev','senha-gestor-123'),lei=await login('leitura@local.dev','senha-leitura-123');
const all=await load(adm);
try{
  let d=await load(des);
  assert.ok(d.clients.every(c=>(c.wallet||'C1')==='C1'||c.id==='teste-c2')&&d.tasks.some(t=>t.id==='c2-minha')&&!d.tasks.some(t=>t.id==='c2-outra'));
  console.log(`1) Designer (C1) vê ${d.clients.length} de ${all.clients.length} clientes e ${d.tasks.length} de ${all.tasks.length} tarefas: a C1 e a tarefa da C2 atribuída a ele ✔`);
  const c1=d.tasks.find(t=>t.clientId!=='teste-c2'&&!t.cancelled);
  let r=await put(des,edit(d,c1.id,{summary:'editado pelo designer '+Date.now()}));
  assert.equal(r.status,200);assert.ok(r.body.versions.tasks[c1.id]);console.log('2) Designer edita tarefa da C1: aceito ✔');
  d=await load(des);r=await put(des,edit(d,'c2-minha',{summary:'ajuda '+Date.now()}));assert.equal(r.status,200);console.log('3) Designer edita a tarefa da C2 atribuída a ele: aceito ✔');
  d=await load(des);const outra=all.tasks.find(t=>t.id==='c2-outra');
  r=await put(des,{...d,tasks:[...d.tasks,{...outra,summary:'invasão'}]});assert.equal(r.status,403);console.log('4) Designer tenta gravar tarefa da C2 que não é dele: barrado ✔',r.body.error);
  r=await put(des,{...d,clients:d.clients.map((c,i)=>i?c:{...c,name:'Alterado'})});assert.equal(r.status,403);console.log('5) Designer altera cliente: barrado ✔',r.body.error);
  r=await put(des,{...d,tasks:d.tasks.slice(1)});assert.equal(r.status,200);
  assert.equal((await load(adm)).tasks.length,all.tasks.length);console.log('6) Designer manda a lista sem uma tarefa: nada é apagado ✔');
  d=await load(des);const g=await load(ges);
  assert.equal((await put(ges,edit(g,c1.id,{summary:'gestor '+Date.now()}))).status,200);
  r=await put(des,edit(d,c1.id,{summary:'designer atrasado'}));assert.equal(r.status,409);console.log('7) Duas pessoas na mesma tarefa: a segunda é avisada para recarregar ✔',r.body.error);
  const g2=await load(ges);
  r=await put(ges,{...g2,clients:[...g2.clients,{id:'gestor-novo-'+Date.now(),name:'Cliente do Gestor',wallet:'C3',status:'onboarding'}]});assert.equal(r.status,200);console.log('8) Gestor (todas as carteiras) cadastra cliente: aceito ✔');
  const l=await load(lei);r=await put(lei,edit(l,l.tasks[0].id,{summary:'x'}));assert.equal(r.status,403);console.log('9) Somente leitura vê, mas não grava ✔',r.body.error);
  assert.equal((await fetch(B+'/api/connect')).status,401);console.log('10) Sem login: barrado ✔');
  const m=await (await fetch(B+'/api/modules',{headers:{Cookie:des}})).json();
  r=await fetch(B+'/api/tasks',{method:'DELETE',headers:{...O,Cookie:des},body:JSON.stringify({id:c1.id,modulesRevision:m.revision})});assert.equal(r.status,403);console.log('11) Designer tenta excluir tarefa: barrado ✔');
}finally{await setWallet('all');}
console.log('Todos os testes passaram.');
