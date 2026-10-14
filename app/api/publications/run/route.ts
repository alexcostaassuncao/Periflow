import {runDue} from '../../../../db/publications';
import {database} from '../../../../db/raw';
// Chamado de hora em hora pelo agendador (GitHub Actions: .github/workflows/publicacoes-agendadas.yml).
// Protegido pela chave CRON_SECRET, enviada no cabeçalho Authorization: Bearer <chave>.
function authorized(req:Request){
  const secret=process.env.CRON_SECRET||'';
  const sent=req.headers.get('Authorization')||'';
  const expected='Bearer '+secret;
  if(secret.length<16||sent.length!==expected.length)return false;
  let diff=0;for(let i=0;i<sent.length;i++)diff|=sent.charCodeAt(i)^expected.charCodeAt(i);
  return diff===0;
}
async function run(req:Request){if(!authorized(req))return Response.json({error:'Não autorizado.'},{status:401});await database().prepare("INSERT INTO connect_state (id,payload,revision) VALUES ('publication-scheduler','enabled',1) ON CONFLICT(id) DO UPDATE SET payload='enabled'").run();return Response.json({processed:await runDue(),schedulerReady:!!await database().prepare("SELECT id FROM connect_state WHERE id='publication-scheduler' AND payload='enabled'").first()});}
export const GET=run;
export const POST=run;
