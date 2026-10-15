// EXPORTAR OS DADOS DO GESTÃOPRO (WordPress + Firebase) PARA A ABA PROJETOS DO PERIFLOW
// 1. Abra a página do GestãoPro no WordPress e entre com a conta de administrador.
// 2. Aperte F12 → aba "Console".
// 3. Cole TODO este arquivo e aperte Enter. (Se o navegador pedir, digite "allow pasting" antes.)
// 4. Aguarde: no fim, o arquivo gestaopro-export.json é baixado. Guarde-o com cuidado (tem senhas de clientes).
// Depois, no projeto do Periflow: npm run db:import-projetos -- gestaopro-export.json

// Troque para false para NÃO exportar as senhas de loja/domínio dos clientes (você as digita de novo depois
// em Projetos → Empresas). As senhas de login das pessoas nunca são exportadas: cada um entra com o login do Periflow.
const INCLUIR_SENHAS=true;

(async()=>{
  if(!window.firebase?.firestore)throw Error('Abra a página do GestãoPro (WordPress) antes de colar este script.');
  if(!window.firebase.auth().currentUser)throw Error('Entre no GestãoPro com a conta de administrador antes de exportar.');
  const base=window.firebase.firestore().collection('artifacts').doc('gestao-leads-pro-final-v1').collection('public').doc('data');
  const out={format:'gestaopro-export',version:1,exportedAt:new Date().toISOString(),source:location.origin,semSenhas:!INCLUIR_SENHAS};
  for(const name of ['projects','companies','users']){
    console.log('Exportando '+name+'…');
    const snap=await base.collection(name).get();
    out[name]=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(name==='companies'&&!INCLUIR_SENHAS)out[name].forEach(c=>{delete c.senhaLoja;delete c.senhaDominio;});
    console.log(`  ${out[name].length} registro(s)`);
  }
  const blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='gestaopro-export.json';document.body.appendChild(a);a.click();a.remove();
  console.log(`✔ Exportação concluída: ${out.projects.length} projetos, ${out.companies.length} empresas, ${out.users.length} usuários.`);
})().catch(e=>console.error('✖ Falha na exportação:',e.message||e));
