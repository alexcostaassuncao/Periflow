import {isAdmin} from '../../../../db/employees';
import {cloudinaryReady,fileInfo,signUpload} from '../../../../lib/cloudinary';
// Post final: valida e devolve a assinatura; imagens são convertidas para JPG (formato aceito pela Meta).
export async function POST(req:Request){
  if(!isAdmin(req)||req.headers.get('Origin')!==new URL(req.url).origin)return Response.json({error:'Acesso restrito.'},{status:403});
  if(!cloudinaryReady())return Response.json({error:'Armazenamento da mídia final ainda não configurado.'},{status:503});
  const file=await fileInfo(req);
  if(!(file.size>0)||file.size>30*1024*1024)return Response.json({error:'Use um arquivo de até 30 MB.'},{status:413});
  if(!['image/jpeg','image/png','image/webp','video/mp4'].includes(file.type))return Response.json({error:'Use JPG, PNG, WebP ou vídeo MP4.'},{status:400});
  const video=file.type==='video/mp4';
  return Response.json({upload:await signUpload({folder:'periferica-connect',video,format:video?undefined:'jpg'}),result:{name:file.name,type:video?'video/mp4':'image/jpeg',final:true}},{headers:{'Cache-Control':'no-store'}});
}
