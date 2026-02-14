// Sidebar de navegação
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
        'flex h-full flex-col',
        'bg-gradient-to-b from-white to-gray-50/50',
        'border-r border-border/60',
        'backdrop-blur-xl',
        'transition-all duration-300 fixed left-0 top-0 z-50',
        'shadow-sm',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-border/60 transition-all duration-300', isCollapsed ? 'px-2 justify-center' : 'px-4 md:px-6')}>
        {!isCollapsed && (
          <h1 className="text-lg md:text-xl font-bold truncate">Vendas Parceladas</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn('ml-auto', isCollapsed && 'mx-auto')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-2 md:px-3 py-4">
        <TooltipProvider delayDuration={0}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                  'transition-all duration-200',
                  isCollapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
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
      <div className="border-t border-border/60 p-4">
        <TooltipProvider delayDuration={0}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
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
              className="w-full justify-start"
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

