import {database} from './raw';
import {allClients} from './workspace';
export async function registeredClients():Promise<{id:string;name:string;wallet?:string;arts?:number;videos?:number}[]>{return allClients();}
