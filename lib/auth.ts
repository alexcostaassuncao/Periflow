import {database} from '../db/raw';
import {readSession,sha256,type SessionPayload} from './session';

export type SessionUser={id:string;name:string;email:string;access:string;admin:boolean};

// O administrador principal vem das variáveis ADMIN_EMAIL e ADMIN_PASSWORD (configuradas na Vercel)
// e entra como o perfil "Adm" (connect-admin). Assim sempre existe um acesso, mesmo com o banco vazio.
export function envAdmin(){
  const email=(process.env.ADMIN_EMAIL||'').trim().toLowerCase(),password=process.env.ADMIN_PASSWORD||'';
  return email&&password.length>=8?{email,password}:null;
}
export async function envAdminVersion(){const a=envAdmin();return a?(await sha256('env:'+a.email+':'+a.password)).slice(0,24):'';}
export async function passwordVersion(hash:string){return (await sha256('db:'+hash)).slice(0,24);}

export async function verifyPassword(password:string,stored:string|null|undefined){
  const [kind,iterations,salt,expected]=String(stored||'').split(':');
  if(kind!=='pbkdf2'||!salt||!expected)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:Number(iterations)},key,256);
  const actual=Array.from(new Uint8Array(bits),v=>v.toString(16).padStart(2,'0')).join('');
  if(actual.length!==expected.length)return false;
  let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return diff===0;
}

// Confere a sessão contra o banco a cada requisição: funcionário removido, senha trocada
// ou acesso alterado passam a valer imediatamente.
export async function userFromSession(session:SessionPayload|null):Promise<SessionUser|null>{
  if(!session)return null;
  if(session.m==='env'){
    const admin=envAdmin();
    if(!admin||session.uid!=='connect-admin'||session.pv!==await envAdminVersion())return null;
    return {id:'connect-admin',name:'Adm',email:admin.email,access:'Administrador',admin:true};
  }
  const row:any=await database().prepare('SELECT id,name,email,access,password_hash FROM employees WHERE id=?').bind(session.uid).first();
  if(!row||!row.password_hash||session.pv!==await passwordVersion(row.password_hash))return null;
  return {id:row.id,name:row.name,email:row.email||'',access:row.access,admin:row.access==='Administrador'};
}

export async function userFromToken(token:string|undefined){return userFromSession(await readSession(token));}
