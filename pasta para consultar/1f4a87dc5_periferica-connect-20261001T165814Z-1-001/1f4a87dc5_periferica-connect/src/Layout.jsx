import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { localApp } from '@/api/localClient';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  Clock, 
  User, 
  Trophy,
  Menu,
  X,
  LogOut,
  Flame,
  Building,
  MessageSquare,
  DollarSign,
  FolderUp,
  Package,
  TrendingUp
} from 'lucide-react';
import NotificationBell from './components/notifications/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);
      
      const employees = await localApp.entities.Employee.filter({ user_id: currentUser.id });
      if (employees.length > 0) {
        setEmployee(employees[0]);
      }

      // Carregar permissões do usuário
      const roles = await localApp.entities.UserRole.filter({ user_email: currentUser.email });
      if (roles.length > 0) {
        setUserPermissions(roles[0].permissions);
      }
    } catch (e) {
      console.log('User not logged in');
    }
  };

  const handleLogout = () => {
    localApp.auth.logout();
  };

  if (currentPageName === 'Login') {
    return <>{children}</>;
  }

  const getFilteredNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
        { name: 'Tarefas', icon: CheckSquare, page: 'Tasks' },
        { name: 'Calendário', icon: CalendarDays, page: 'Calendar' },
        { name: 'Ponto', icon: Clock, page: 'TimeTracker' },
        { name: 'Recompensas', icon: Trophy, page: 'Rewards' },
        { name: 'Chat', icon: MessageSquare, page: 'Chat' },
        { name: 'Comercial', icon: DollarSign, page: 'Comercial' },
        { name: 'CRM', icon: TrendingUp, page: 'CRM' },
        { name: 'Relatórios', icon: Trophy, page: 'Relatorios' },
        { name: 'Central de Dados', icon: FolderUp, page: 'Importacoes' },
        { name: 'Estoque', icon: Package, page: 'Estoque' },
        { name: 'Cadastros', icon: Building, page: 'Cadastros' },
        { name: 'Perfil', icon: User, page: 'Profile' },
      ];
    }

    if (!userPermissions) {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
        { name: 'Perfil', icon: User, page: 'Profile' },
      ];
    }

    const items = [
      { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    ];

    // Tarefas - se pode visualizar minhas ou todas
    if (userPermissions.tarefas_visualizar_minhas || userPermissions.tarefas_visualizar_todas) {
      items.push({ name: 'Tarefas', icon: CheckSquare, page: 'Tasks' });
    }

    // Calendário
    if (userPermissions.calendario_visualizar || userPermissions.eventos_visualizar) {
      items.push({ name: 'Calendário', icon: CalendarDays, page: 'Calendar' });
    }

    // Ponto
    if (userPermissions.ponto_bater) {
      items.push({ name: 'Ponto', icon: Clock, page: 'TimeTracker' });
    }

    // Recompensas
    if (userPermissions.recompensas_visualizar !== false) {
      items.push({ name: 'Recompensas', icon: Trophy, page: 'Rewards' });
    }

    // Chat
    if (userPermissions.chat_enviar_mensagens || userPermissions.chat_ler_mensagens) {
      items.push({ name: 'Chat', icon: MessageSquare, page: 'Chat' });
    }

    // Comercial
    if (userPermissions.comercial_criar_orcamento || userPermissions.comercial_criar_contrato) {
      items.push({ name: 'Comercial', icon: DollarSign, page: 'Comercial' });
    }

    // CRM
    if (userPermissions.crm_visualizar || userPermissions.comercial_criar_orcamento) {
      items.push({ name: 'CRM', icon: TrendingUp, page: 'CRM' });
    }

    // Relatórios
    if (userPermissions.relatorios_visualizar || userPermissions.tarefas_visualizar_todas || userPermissions.cadastros_visualizar) {
      items.push({ name: 'Relatórios', icon: Trophy, page: 'Relatorios' });
    }

    // Cadastros
    if (userPermissions.cadastros_visualizar) {
      items.push({ name: 'Cadastros', icon: Building, page: 'Cadastros' });
    }

    // Central de Dados
    if (userPermissions.central_dados_visualizar) {
      items.push({ name: 'Central de Dados', icon: FolderUp, page: 'Importacoes' });
    }

    // Estoque - sempre disponível
    items.push({ name: 'Estoque', icon: Package, page: 'Estoque' });

    // Perfil - sempre disponível
    items.push({ name: 'Perfil', icon: User, page: 'Profile' });

    return items;
  };

  const navItems = getFilteredNavItems();

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        :root {
          --primary: #ff5000;
          --primary-dark: #cc4000;
          --bg-dark: #0a0a0f;
          --bg-card: #12121a;
          --bg-card-hover: #1a1a2e;
          --border-color: rgba(255, 80, 0, 0.2);
        }
        
        .gradient-primary {
          background: linear-gradient(135deg, #ff5000 0%, #ff7f40 100%);
        }
        
        .glow-primary {
          box-shadow: 0 0 20px rgba(255, 80, 0, 0.3);
        }
        
        .glass-card {
          background: rgba(18, 18, 26, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 80, 0, 0.1);
        }
        
        .nav-active {
          background: linear-gradient(135deg, rgba(255, 80, 0, 0.2) 0%, rgba(255, 80, 0, 0.1) 100%);
          border-left: 3px solid #ff5000;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-xl font-black">P</span>
            </div>
            <span className="font-bold text-lg">Periférica</span>
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationBell userEmail={user.email} />}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="lg:hidden fixed inset-0 z-40 bg-[#0a0a0f] pt-20"
          >
            <nav className="px-4 py-6 space-y-2">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                      isActive 
                        ? 'gradient-primary text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon size={24} />
                    <span className="font-medium text-lg">{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-4 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all"
              >
                <LogOut size={24} />
                <span className="font-medium text-lg">Sair</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 flex-col glass-card border-r border-[var(--border-color)]">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <span className="text-2xl font-black">P</span>
              </div>
              <div>
                <h1 className="font-bold text-xl">Periférica</h1>
                <p className="text-xs text-gray-500">Marketing Agency</p>
              </div>
            </div>
            {user && <NotificationBell userEmail={user.email} />}
          </div>
        </div>

        {/* User Info */}
        {employee && (
          <div className="mx-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-[#ff5000]/10 to-transparent border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <span className="font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.full_name || 'Usuário'}</p>
                <p className="text-xs text-gray-500">Nível {employee.current_level || 1}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full gradient-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((employee.xp_total || 0) % 1000) / 10}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-gray-400">{employee.xp_total || 0} XP</span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'nav-active text-[#ff5000]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="ml-auto w-2 h-2 rounded-full bg-[#ff5000]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-[var(--border-color)] px-2 py-2 z-30">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-[#ff5000]' 
                    : 'text-gray-500'
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}