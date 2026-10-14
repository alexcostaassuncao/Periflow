import {env} from 'cloudflare:workers';
import {isAdmin} from '../../../../db/employees';

export async function POST(req:Request){
  if(!isAdmin(req)||req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Acesso restrito.'},{status:403});
  const c=env as unknown as Record<string,string>;
  if(!c.CLOUDINARY_CLOUD_NAME||!c.CLOUDINARY_API_KEY||!c.CLOUDINARY_API_SECRET)return Response.json({error:'Armazenamento da mídia final ainda não configurado.'},{status:503});
  try{
    const input=await req.formData(),file=input.get('file');
    if(!(file instanceof File))return Response.json({error:'Selecione um arquivo.'},{status:400});
    if(!file.size||file.size>30*1024*1024)return Response.json({error:'Use um arquivo de até 30 MB.'},{status:413});
    if(!['image/jpeg','image/png','image/webp','video/mp4'].includes(file.type))return Response.json({error:'Use JPG, PNG, WebP ou vídeo MP4.'},{status:400});
    const video=file.type==='video/mp4',timestamp=String(Math.floor(Date.now()/1000));
    const publicId='periferica-connect/'+crypto.randomUUID();
    const params:Record<string,string>={public_id:publicId,timestamp,...(!video?{format:'jpg'}:{})};
    const signing=Object.keys(params).sort().map(k=>k+'='+params[k]).join('&')+c.CLOUDINARY_API_SECRET;
    const signature=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(signing))),b=>b.toString(16).padStart(2,'0')).join('');
    const body=new FormData();body.set('file',file);for(const [k,v]of Object.entries(params))body.set(k,v);body.set('api_key',c.CLOUDINARY_API_KEY);body.set('signature',signature);
    const r=await fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(c.CLOUDINARY_CLOUD_NAME)+'/'+(video?'video':'image')+'/upload',{method:'POST',body,signal:AbortSignal.timeout(60000)});
    const result=await r.json() as {secure_url?:string;public_id?:string;bytes?:number;width?:number;height?:number};
    if(!r.ok||!result.secure_url||new URL(result.secure_url).hostname!=='res.cloudinary.com')return Response.json({error:'O Cloudinary não aceitou o arquivo. Confira a conexão e tente novamente.'},{status:502});
    return Response.json({name:file.name,type:video?'video/mp4':'image/jpeg',data:result.secure_url,publicUrl:result.secure_url,publicId:result.public_id,width:result.width,height:result.height},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Não foi possível enviar a mídia final. Seu conteúdo foi preservado; tente novamente.'},{status:503});}
}
