import {NextResponse,type NextRequest} from 'next/server';
import {SESSION_COOKIE} from './lib/session';
import {userFromToken} from './lib/auth';

// Protege o site inteiro: sem login, páginas redirecionam para /login.html e APIs respondem 401.
// O usuário logado é repassado às rotas pelos cabeçalhos x-periflow-* (sempre recriados aqui,
// nunca aceitos do navegador).

const PUBLIC_PATHS=new Set(['/login.html','/api/auth/login','/api/auth/logout','/favicon.svg','/api/publications/run','/api/projetos/banners']);
// Scripts, estilos e imagens da interface não têm dados; liberá-los evita consultas ao banco a cada arquivo.
const PUBLIC_ASSET=/\.(js|css|svg|png|jpg|jpeg|webp|ico|woff2?)$/i;
const IDENTITY_HEADERS=['x-periflow-user-id','x-periflow-user-email','x-periflow-user-name','x-periflow-admin','x-periflow-user-access'];

export async function proxy(req:NextRequest){
  const {pathname,search}=req.nextUrl;
  const headers=new Headers(req.headers);
  for(const name of IDENTITY_HEADERS)headers.delete(name);
  if(PUBLIC_PATHS.has(pathname)||PUBLIC_ASSET.test(pathname)&&!pathname.startsWith('/api/'))return NextResponse.next({request:{headers}});

  let user=null;
  try{user=await userFromToken(req.cookies.get(SESSION_COOKIE)?.value);}catch(e){console.error(e);}
  if(!user){
    if(pathname.startsWith('/api/'))return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401});
    const login=new URL('/login.html',req.url);
    login.searchParams.set('next',pathname+search);
    return NextResponse.redirect(login);
  }
  headers.set('x-periflow-user-id',user.id);
  headers.set('x-periflow-user-email',encodeURIComponent(user.email));
  headers.set('x-periflow-user-name',encodeURIComponent(user.name));
  headers.set('x-periflow-admin',user.admin?'1':'0');
  headers.set('x-periflow-user-access',encodeURIComponent(user.access));
  return NextResponse.next({request:{headers}});
}

export const config={matcher:['/((?!_next/static|_next/image).*)']};
