import {sessionCookie} from '../../../../lib/session';

function logout(req:Request){
  return new Response(null,{status:303,headers:{Location:new URL('/login.html',req.url).toString(),'Set-Cookie':sessionCookie('',0),'Cache-Control':'no-store'}});
}
export const GET=logout;
export const POST=logout;
