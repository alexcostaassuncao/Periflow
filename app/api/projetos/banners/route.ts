import {database} from '../../../../db/raw';
import {empresaFromRow,lembretePendente,hojeBrasil,mensagemBanner} from '../../../../db/projetos';
// Lembrete mensal de banners das empresas de E-commerce com webhook (Make/Zapier).
// Chamado 1x por dia pelo agendador (GitHub Actions: .github/workflows/lembretes-banners.yml).
// Protegido pela chave CRON_SECRET, enviada no cabeçalho Authorization: Bearer <chave>.
function authorized(req:Request){
  const secret=process.env.CRON_SECRET||'';
  const sent=req.headers.get('Authorization')||'';
  const expected='Bearer '+secret;
  if(secret.length<16||sent.length!==expected.length)return false;
  let diff=0;for(let i=0;i<sent.length;i++)diff|=sent.charCodeAt(i)^expected.charCodeAt(i);
  return diff===0;
}

export async function POST(req:Request){
  if(!authorized(req))return Response.json({error:'Não autorizado.'},{status:401});
  const db=database();const hoje=hojeBrasil();const mesAtual=`${hoje.mes}-${hoje.ano}`;
  const rows=(await db.prepare("SELECT * FROM projeto_empresas WHERE webhook_url<>''").all()).results as any[];
  const enviados:any[]=[];
  for(const row of rows){
    const e=empresaFromRow(row,true);
    if(!lembretePendente(e,hoje))continue;
    // Reserva o envio do mês antes de disparar: duas execuções simultâneas nunca enviam duas vezes
    const reserva=await db.prepare('UPDATE projeto_empresas SET ultimo_lembrete_enviado=? WHERE id=? AND ultimo_lembrete_enviado=?').bind(mesAtual,e.id,row.ultimo_lembrete_enviado).run();
    if(!reserva.meta.changes)continue;
    try{
      const resp=await fetch(e.webhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({empresa:e.nome,dia:e.diaLembrete,linkGrupo:e.linkGrupoWhatsapp,mensagem:mensagemBanner(e.nome)})});
      if(!resp.ok)throw Error('Webhook respondeu '+resp.status);
      enviados.push({empresa:e.nome,ok:true});
    }catch(err:any){
      // Libera a reserva para tentar de novo amanhã
      await db.prepare('UPDATE projeto_empresas SET ultimo_lembrete_enviado=? WHERE id=? AND ultimo_lembrete_enviado=?').bind(row.ultimo_lembrete_enviado,e.id,mesAtual).run();
      enviados.push({empresa:e.nome,ok:false,erro:String(err?.message||err)});
    }
  }
  return Response.json({data:`${hoje.dia}/${hoje.mes}/${hoje.ano}`,enviados});
}
