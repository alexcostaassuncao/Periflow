import {cloudinaryReady,fileInfo,signUpload} from '../../../../lib/cloudinary';

export async function POST(req:Request){
  if(req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida.'},{status:403});
  if(!cloudinaryReady())return Response.json({error:'Armazenamento de mídias ainda não configurado.'},{status:503});
  const file=await fileInfo(req);
  if(!(file.size>0)||file.size>5*1024*1024)return Response.json({error:'O limite para a logo é 5 MB.'},{status:413});
  if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type))return Response.json({error:'Use uma imagem PNG, JPG, WebP, GIF ou AVIF.'},{status:400});
  return Response.json({upload:await signUpload({folder:'periflow/client-logos',video:false}),result:{name:file.name,type:file.type}},{headers:{'Cache-Control':'no-store'}});
}
