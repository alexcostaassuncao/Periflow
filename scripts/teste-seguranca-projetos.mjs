// Uso: com o servidor de teste no ar (npm run dev:teste), rode: node scripts/teste-seguranca-projetos.mjs
// Pré-requisitos no banco de TESTE: usuário designer@local.dev (Designer/Produção, senha senha-designer-123)
// e a empresa 'EMPRESA TESTE SEGURANCA' com senhas falsas, cadastradas pelo admin de teste.
// Teste de segurança no banco de TESTE (npm run dev:teste): senhas de Projetos → Acessos pela API.
import assert from 'node:assert';
const B='http://localhost:3000',O={Origin:B,'Content-Type':'application/json'};
async function login(email,password){const r=await fetch(B+'/api/auth/login',{method:'POST',headers:O,body:JSON.stringify({email,password})});assert.ok(r.ok,'login '+email);return (r.headers.get('set-cookie')||'').split(';')[0];}
const get=async c=>(await (await fetch(B+'/api/projetos',{headers:{Cookie:c}})).json()).empresas.find(e=>e.nome==='EMPRESA TESTE SEGURANCA');
const save=(c,company)=>fetch(B+'/api/projetos',{method:'POST',headers:{...O,Cookie:c},body:JSON.stringify({action:'saveCompany',company})});
const adm=await login('teste@local.dev','senha-de-teste-123'),des=await login('designer@local.dev','senha-designer-123');

let d=await get(des);
assert.equal(d.senhaLoja,'••••••');assert.equal(d.senhaDominio,'••••••');
console.log('1) Designer pela API: recebe só ••••••  ✔');
let a=await get(adm);
assert.equal(a.senhaLoja,'SENHA-FALSA-LOJA-123');
console.log('2) Admin pela API: continua vendo a senha  ✔');
assert.ok((await save(des,{...d,codigoLoja:'alterado-pelo-designer'})).ok);
a=await get(adm);
assert.equal(a.senhaLoja,'SENHA-FALSA-LOJA-123');assert.equal(a.senhaDominio,'SENHA-FALSA-DOMINIO-456');assert.equal(a.codigoLoja,'alterado-pelo-designer');
console.log('3) Designer salva a empresa: os outros campos mudam e a senha real continua intacta  ✔');
assert.ok((await save(des,{...d,senhaLoja:'TROCADA-PELO-DESIGNER'})).ok);
a=await get(adm);
assert.equal(a.senhaLoja,'SENHA-FALSA-LOJA-123');
console.log('4) Designer tenta trocar a senha pela API: ignorado  ✔');
console.log('Todos os testes passaram.');
