export function publicationMedia(task:any,format:string){
 const media=task.finalMedia;
 const kind=media?.type?.startsWith('video/')?'video':'image';
 if(format==='reels'&&kind!=='video')throw Error('Reels precisa de um vídeo. Use Post ou Stories para esta imagem.');
 if(format==='post'&&kind==='video')throw Error('Use Reels ou Stories para este vídeo.');
 const raw=String(task.finalPublicUrl||media?.publicUrl||'');
 if(!raw)throw Error('Anexe o post final em Criação e salve a tarefa.');
 const vertical=format!=='post';
 const height=vertical?1920:Number(media?.width)>0&&Math.abs(Number(media.height)/Number(media.width)-4/3)<0.02?1440:1350;
 let url=raw;
 const u=new URL(raw);
 if(u.hostname==='res.cloudinary.com'&&u.pathname.includes('/upload/')){
   const transform='c_pad,w_1080,h_'+height+',b_white'+(kind==='image'?',f_jpg':',f_mp4');
   u.pathname=u.pathname.replace('/upload/','/upload/'+transform+'/');url=u.href;
 }
 return {url,kind,width:1080,height,original:raw};
}
