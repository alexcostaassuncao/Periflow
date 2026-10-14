import {database} from './raw';
export async function registeredClients():Promise<{id:string;name:string;wallet?:string;arts?:number;videos?:number}[]>{const row=await database().prepare('SELECT payload FROM connect_state WHERE id=?').bind('workspace').first<{payload:string}>();if(!row)return [];try{return JSON.parse(row.payload).clients||[];}catch{return [];}}
