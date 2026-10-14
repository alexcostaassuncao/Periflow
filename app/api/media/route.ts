import {cloudinaryReady,fileInfo,signUpload} from '../../../lib/cloudinary';
// Mídias de referência do briefing: valida e devolve a assinatura para o navegador enviar ao Cloudinary.
export async function POST(req:Request){
  if(req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida.'},{status:403});
  if(!cloudinaryReady())return Response.json({error:'Armazenamento de mídias ainda não configurado.'},{status:503});
  const file=await fileInfo(req);
  if(!(file.size>0)||file.size>30*1024*1024)return Response.json({error:'O limite é 30 MB por arquivo.'},{status:413});
  if(!/^image\/(png|jpeg|webp|gif|avif)$|^video\/(mp4|webm|quicktime)$/.test(file.type))return Response.json({error:'Use imagens PNG, JPG, WebP, GIF ou vídeos MP4, WebM e MOV.'},{status:400});
  return Response.json({upload:await signUpload({folder:'periflow/referencias',video:file.type.startsWith('video/')}),result:{name:file.name,type:file.type}},{headers:{'Cache-Control':'no-store'}});
}
