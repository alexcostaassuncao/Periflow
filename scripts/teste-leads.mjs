// Uso: com o servidor de teste no ar (npm run dev:teste), rode: node scripts/teste-leads.mjs
// Banco de TESTE. Confere a entrada automática de leads (/api/leads/entrada) e o funil (/api/leads).
// Usa a chave de teste definida em scripts/dev-teste.mjs e os usuários designer@ e gestor@local.dev.
import assert from 'node:assert';
const B='http://localhost:3000',O={Origin:B,'Content-Type':'application/json'},TOKEN='token-de-teste-leads-123';
const tag=String(Date.now()).slice(-7),fone=`(48) 9${tag.slice(0,4)}-${tag.slice(3,7)}`;
const entrada=(qs,body,type,headers={})=>fetch(`${B}/api/leads/entrada${qs}`,{method:'POST',headers:{'Content-Type':type,...headers},body});
async function login(email,password){const r=await fetch(B+'/api/auth/login',{method:'POST',headers:O,body:JSON.stringify({email,password})});assert.ok(r.ok,'login '+email);return (r.headers.get('set-cookie')||'').split(';')[0];}

let r=await entrada('?origem=site','your-name=X','application/x-www-form-urlencoded');assert.equal(r.status,401);
r=await entrada('?origem=site&token=errado-errado-errado-1','your-name=X','application/x-www-form-urlencoded');assert.equal(r.status,401);
console.log('1) Sem chave ou com chave errada: recusado ✔');

const form=new URLSearchParams({'your-name':'Maria Teste '+tag,'your-email':' Maria'+tag+'@Loja.com ',telefone:fone,'your-message':'Quero orçamento de site','como-conheceu':'Indicação',_wpcf7:'12'});
r=await entrada(`?origem=site&utm_source=instagram&token=${TOKEN}`,form.toString(),'application/x-www-form-urlencoded');let j=await r.json();
assert.equal(r.status,201);assert.equal(j.resultado,'criado');const leadId=j.lead_id;
console.log('2) Formulário do WordPress cria o lead ✔');

r=await entrada('?origem=google_forms',JSON.stringify({name:'Outro nome',whatsapp:'+55 '+fone,interesse:'Tráfego pago'}),'application/json',{'X-Leads-Token':TOKEN});j=await r.json();
assert.equal(r.status,200);assert.equal(j.resultado,'atualizado');assert.equal(j.lead_id,leadId);
console.log('3) Mesmo WhatsApp em outro formato (Google Forms): atualiza o mesmo lead, sem duplicar ✔');

r=await entrada(`?origem=landing&token=${TOKEN}`,new URLSearchParams({'fields[name][value]':'Elementor '+tag,'fields[email][value]':'el'+tag+'@x.com'}).toString(),'application/x-www-form-urlencoded');
assert.equal(r.status,201);console.log('4) Formato do Elementor (fields[x][value]) reconhecido ✔');
r=await entrada(`?token=${TOKEN}`,'outro=1','application/x-www-form-urlencoded');assert.equal(r.status,422);
r=await entrada('','{quebrado','application/json',{'X-Leads-Token':TOKEN});assert.equal(r.status,400);
console.log('5) Sem nome/contato ou JSON quebrado: recusado com mensagem ✔');

const ges=await login('gestor@local.dev','senha-gestor-123'),des=await login('designer@local.dev','senha-designer-123');
assert.equal((await fetch(B+'/api/leads',{headers:{Cookie:des}})).status,403);console.log('6) Designer não acessa o Comercial ✔');
const lista=await (await fetch(B+'/api/leads',{headers:{Cookie:ges}})).json();
let lead=lista.leads.find(l=>l.id===leadId);
assert.equal(lead.whatsapp,'55'+fone.replace(/\D/g,''));assert.equal(lead.email,'maria'+tag+'@loja.com');assert.equal(lead.nome,'Maria Teste '+tag);
assert.equal(lead.interesse,'gestao_campanha');assert.equal(lead.origem,'site');assert.equal(lead.utm_source,'instagram');
assert.ok(lead.observacoes.includes('Quero orçamento de site')&&lead.observacoes.includes('como-conheceu: Indicação')&&lead.observacoes.includes('google_forms'));
assert.ok(!JSON.stringify(lead.triagem).includes(TOKEN));
console.log('7) Telefone e e-mail normalizados, nome original mantido, campos extras nas observações, sem a chave gravada ✔');

const act=async(body)=>{const res=await fetch(B+'/api/leads',{method:'POST',headers:{...O,Cookie:ges},body:JSON.stringify(body)});return {status:res.status,body:await res.json()};};
let a=await act({action:'move',id:leadId,versao:lead.versao,etapa:'contato'});assert.equal(a.status,200);assert.ok(a.body.lead.primeiro_contato_em);lead=a.body.lead;
a=await act({action:'move',id:leadId,versao:lead.versao-1,etapa:'reuniao'});assert.equal(a.status,409);
console.log('8) Mover para "Em contato" registra o primeiro contato; versão velha é recusada ✔');
a=await act({action:'archive',id:leadId,versao:lead.versao,motivo:'outro'});assert.equal(a.status,400);
a=await act({action:'archive',id:leadId,versao:lead.versao,motivo:'preco',obs:'Achou caro'});assert.equal(a.status,200);lead=a.body.lead;assert.equal(lead.situacao,'arquivado');
a=await act({action:'move',id:leadId,versao:lead.versao,etapa:'proposta'});assert.equal(a.status,400);
a=await act({action:'reactivate',id:leadId,versao:lead.versao});assert.equal(a.status,200);lead=a.body.lead;assert.equal(lead.situacao,'andamento');
a=await act({action:'wait',id:leadId,versao:lead.versao,motivo:'retomada_futura'});assert.equal(a.status,400);
a=await act({action:'wait',id:leadId,versao:lead.versao,motivo:'retomada_futura',retomar_em:'2027-02-01'});assert.equal(a.status,200);
console.log('9) Arquivar exige motivo; arquivado não muda de etapa; reativar; espera exige data ✔');
const ev=(await (await fetch(B+'/api/leads?eventos='+leadId,{headers:{Cookie:ges}})).json()).eventos.map(e=>e.acao);
assert.deepEqual([...ev].reverse(),['criado','entrada_formulario','etapa','arquivado','reativado','espera']);
console.log('10) Linha do tempo completa e sem registros das tentativas recusadas ✔');
console.log('Todos os testes passaram.');
