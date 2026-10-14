import {currentUserEmail,currentUserId,currentUserName,isAdmin} from '../../../../db/employees';

export async function GET(req:Request){
  return Response.json({id:currentUserId(req),name:currentUserName(req),email:currentUserEmail(req),admin:isAdmin(req)},{headers:{'Cache-Control':'no-store'}});
}
