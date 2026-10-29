import {currentUserEmail,currentUserId,currentUserName,isAdmin} from '../../../../db/employees';

export async function GET(req:Request){
  return Response.json({id:currentUserId(req),name:currentUserName(req),email:currentUserEmail(req),admin:isAdmin(req),access:(()=>{try{return decodeURIComponent(req.headers.get('x-periflow-user-access')||'');}catch{return '';}})()},{headers:{'Cache-Control':'no-store'}});
}
