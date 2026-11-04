/* Menu lateral em grupos (PDF pág. 21). Só reorganiza os botões de área que já existem e cria os das áreas
   novas (ex.: Clientes); nenhuma área some. Cada área continua conferindo a permissão no servidor. */
NAV_ICONS.clientes='<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>';
Object.assign(MODULES.dashboard,{name:'Início'});Object.assign(MODULES.crm,{name:'CRM antigo'});
NAV_ICONS.comercial='<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>';Object.assign(MODULES.commercial,{name:'Contratos'});
const MENU_GROUPS=[['',['dashboard']],['Clientes',['comercial','commercial','clientes']],['Operação',['management','tasks','projects']],['Agenda',['calendar']],['Equipe',['registrations','time','rewards','chat']],['Mais',['reports','data','stock','profile','crm']]];
(()=>{
  const side=document.querySelector('.layout aside');if(!side)return;
  const wallets=side.querySelector('.wallet-group');
  const button=key=>{let b=side.querySelector(`[data-area="${key}"]`);
    if(!b){b=document.createElement('button');b.type='button';b.className='nav';b.dataset.area=key;b.onclick=()=>navigateArea(key);}
    b.innerHTML=navIcon(key)+`<span>${esc(MODULES[key].name)}</span>`;return b;};
  const listed=new Set(MENU_GROUPS.flatMap(([,keys])=>keys));
  const extras=Object.keys(MODULES).filter(k=>k!=='campaigns'&&!listed.has(k)&&side.querySelector(`[data-area="${k}"]`));
  const frag=document.createDocumentFragment();
  MENU_GROUPS.forEach(([title,keys],i)=>{
    if(title){const l=document.createElement('div');l.className='label menu-group';l.textContent=title;frag.append(l);}
    for(const key of [...keys,...(i===MENU_GROUPS.length-1?extras:[])]){if(!MODULES[key])continue;frag.append(button(key));if(key==='management'&&wallets)frag.append(wallets);}
  });
  side.replaceChildren(frag);
})();
