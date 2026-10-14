import {database} from './raw';
export const roles=['Administrador','Gestão','Copy','Designer','Video Maker','Consultor','Gestor de tráfego','Editor de vídeo','Outro'];
export const accesses=['Administrador','Gestor','Produção','Somente leitura'];
// Os cabeçalhos x-periflow-* são definidos pelo proxy.ts a partir da sessão de login.
export function isAdmin(req:Request){return req.headers.get('x-periflow-admin')==='1';}
const header=(req:Request,name:string)=>{try{return decodeURIComponent(req.headers.get(name)||'');}catch{return '';}};
export function currentUserEmail(req:Request){return header(req,'x-periflow-user-email');}
export function currentUserName(req:Request){return header(req,'x-periflow-user-name')||'Adm';}
export function currentUserId(req:Request){return req.headers.get('x-periflow-user-id')||'';}
export async function ensureUsers(){const db=database();const now=new Date().toISOString();await db.batch([db.prepare('INSERT OR IGNORE INTO employees (id,name,email,role,access,created_at) VALUES (?,?,NULL,?,?,?)').bind('connect-admin','Adm','Administrador','Administrador',now),db.prepare('INSERT OR IGNORE INTO employees (id,name,email,role,access,created_at) VALUES (?,?,?,?,?,?)').bind('connect-alex','Alex costa','alexcosta@perferica.me','Designer','Produção',now)]);}
export async function passwordHash(password:string){const salt=crypto.randomUUID();const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const hash=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256);return 'pbkdf2:100000:'+salt+':'+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');}
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
