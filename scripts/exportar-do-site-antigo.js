// EXPORTAR OS DADOS DO SITE ANTIGO (ChatGPT Sites)
// 1. Abra https://periferica-connect.alexcostaa.chatgpt.site/connect.html já logado.
// 2. Aperte F12 → aba "Console".
// 3. Cole TODO este arquivo e aperte Enter. (Se o navegador pedir, digite "allow pasting" antes.)
// 4. Aguarde: no fim, o arquivo periflow-export.json é baixado. Guarde-o com cuidado (tem dados reais).
(async()=>{
  const get=async path=>{const r=await fetch(path,{cache:'no-store'});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(path+': '+((d&&d.error)||('HTTP '+r.status)));return d;};
  const out={format:'periflow-export',version:1,exportedAt:new Date().toISOString(),source:location.origin};
  console.log('Exportando clientes e tarefas…');
  out.connect=await get('/api/connect');
  for(const [key,path] of [['modules','/api/modules'],['permissions','/api/permissions'],['users','/api/users']]){
    try{console.log('Exportando '+key+'…');out[key]=await get(path);}catch(e){console.warn('Não exportado ('+key+'):',e.message);}
  }
  const ids=[...new Set(JSON.stringify(out).match(/\/api\/media\/[0-9a-f-]{36}/g)||[])];
  out.media={};
  let done=0,failed=0;
  for(const path of ids){
    console.log(`Baixando mídia ${done+failed+1} de ${ids.length}…`);
    try{
      const r=await fetch(path);if(!r.ok)throw Error('HTTP '+r.status);
      const blob=await r.blob();
      const base64=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result).split(',')[1]);fr.onerror=reject;fr.readAsDataURL(blob);});
      out.media[path]={type:blob.type,base64};done++;
    }catch(e){failed++;console.warn('Mídia não baixada:',path,e.message);}
  }
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(out)],{type:'application/json'}));
  a.download='periflow-export.json';document.body.append(a);a.click();a.remove();
  const s=out.connect&&out.connect.state;
  console.log(`✔ Exportação concluída: ${s?s.clients.length:0} clientes, ${s?s.tasks.length:0} tarefas, ${out.users?out.users.users.length:0} funcionários, ${done} mídias${failed?` (${failed} falharam)`:''}.`);
})().catch(e=>console.error('✖ Exportação falhou:',e.message));
