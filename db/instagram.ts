import {env} from 'cloudflare:workers';
export const siteOrigin='https://periferica-connect.alexcostaa.chatgpt.site';
export const redirectUri=siteOrigin+'/api/instagram/callback';
export const scopes=['instagram_business_basic','instagram_business_content_publish'];
export function config(){return {id:env.INSTAGRAM_APP_ID,secret:env.INSTAGRAM_APP_SECRET,key:env.INSTAGRAM_TOKEN_KEY};}
export function ready(){const c=config();return Boolean(c.id&&c.secret&&c.key);}
export async function encryptToken(token:string){const c=config();if(!c.key)throw Error('Configuração incompleta');const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(c.key),v=>v.charCodeAt(0)),{name:'AES-GCM'},false,['encrypt']);const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(token));return btoa(String.fromCharCode(...iv))+'.'+btoa(String.fromCharCode(...new Uint8Array(data)));}
export function back(status:string){return new Response(null,{status:303,headers:{Location:siteOrigin+'/?instagram='+status,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}
export async function decryptToken(cipher:string){const c=config();if(!c.key)throw Error('Configuração incompleta');const [iv,data]=cipher.split('.');const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(c.key),v=>v.charCodeAt(0)),{name:'AES-GCM'},false,['decrypt']);const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:Uint8Array.from(atob(iv),v=>v.charCodeAt(0))},key,Uint8Array.from(atob(data),v=>v.charCodeAt(0)));return new TextDecoder().decode(clear);}
