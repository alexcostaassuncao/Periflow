// Moldura igual à aba Projetos (GestãoPro): logo, usuário e botão de tema dentro do menu lateral, Sair embaixo.
// O tema claro/escuro fica salvo em localStorage ('periflow-theme') e vale também para projetos.html.
(()=>{
const THEME_KEY='periflow-theme';
const MOON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
const SUN='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const LOGOUT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>';
const html=document.documentElement;
const side=document.querySelector('.layout>aside');
if(!side)return;

// Topo: logo
const top=document.createElement('div');top.className='side-brand';
top.innerHTML='<img src="/brand/simbolo-periferica.png" alt=""><strong>Peri<span>flow</span></strong>';

// Usuário + botão de tema (os ids userName/userRole continuam sendo preenchidos pelo connect.html)
const user=document.createElement('div');user.className='side-user';
const info=document.createElement('div');info.innerHTML='<small class="side-user-label">Usuário</small>';
const name=document.getElementById('userName'),role=document.getElementById('userRole');
const roleLine=document.createElement('div');roleLine.className='side-user-role';roleLine.innerHTML='<i></i>';
if(name)info.append(name);if(role)roleLine.append(role);info.append(roleLine);
const toggle=document.createElement('button');toggle.type='button';toggle.className='theme-toggle';
user.append(info,toggle);

// Itens do menu (montados pelo modules.js) passam para uma área com rolagem própria
const nav=document.createElement('nav');nav.className='side-nav';nav.append(...side.childNodes);

// Rodapé: Sair
const foot=document.createElement('div');foot.className='side-foot';
const logout=document.querySelector('header .logout');
if(logout){logout.innerHTML=LOGOUT+'<span>Sair</span>';foot.append(logout);}

side.classList.add('side-shell');side.append(top,user,nav,foot);
// "Salvo online / Carregando…" vai para o topo da área de conteúdo
const sync=document.querySelector('.syncbar'),main=document.querySelector('.layout>main');
if(sync&&main)main.prepend(sync);
document.body.classList.add('shell-ready');

function apply(dark){html.classList.toggle('dark',dark);toggle.innerHTML=dark?SUN:MOON;const label=dark?'Usar tema claro':'Usar tema escuro';toggle.title=label;toggle.setAttribute('aria-label',label);}
let dark=false;try{dark=localStorage.getItem(THEME_KEY)==='dark';}catch{}
apply(dark);
toggle.onclick=()=>{dark=!html.classList.contains('dark');apply(dark);try{localStorage.setItem(THEME_KEY,dark?'dark':'light');}catch{}};
})();
