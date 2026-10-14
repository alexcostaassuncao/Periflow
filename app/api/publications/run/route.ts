import {runDue} from '../../../../db/publications';
import {database} from '../../../../db/raw';
// Protected by the confirmed owner-private Site dispatch; cloud service calls carry no visitor identity.
export async function POST(req:Request){if(req.headers.get('Origin'))return Response.json({error:'Use a atualização da publicação.'},{status:403});await database().prepare("INSERT INTO connect_state (id,payload,revision) VALUES ('publication-scheduler','enabled',1) ON CONFLICT(id) DO UPDATE SET payload='enabled'").run();return Response.json({processed:await runDue(),schedulerReady:!!await database().prepare("SELECT id FROM connect_state WHERE id='publication-scheduler' AND payload='enabled'").first()});}
