// Sidebar de navegação – dark premium
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/useTheme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/useSidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Compradores', href: '/compradores', icon: Users },
  { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { name: 'Pagamentos', href: '/pagamentos', icon: CreditCard },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col fixed left-0 top-0 z-50',
        'transition-all duration-300',
        'bg-sidebar border-r border-sidebar-border',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-sidebar-border',
          'transition-all duration-300',
          isCollapsed ? 'px-0 justify-center' : 'px-4 gap-3',
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="icon-chip gradient-brand shadow-lg shadow-indigo-900/40 shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate leading-tight">
                Vendas
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 font-medium tracking-widest uppercase truncate">
                Parceladas
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="icon-chip gradient-brand shadow-lg shadow-indigo-900/40">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            'h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            isCollapsed && 'hidden',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Collapsed toggle */}
      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-[18px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 hover:text-sidebar-foreground shadow-md"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        <TooltipProvider>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium',
                  'transition-all duration-200',
                  isCollapsed ? 'justify-center px-0 w-full' : 'px-3',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-sidebar-primary' : '',
                  )}
                />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </TooltipProvider>
      </nav>

      {/* Sign out + Theme */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <TooltipProvider>
          {/* Theme toggle */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isDark ? 'Modo Claro' : 'Modo Escuro'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </Button>
          )}

          {/* Sign out */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </Button>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}
