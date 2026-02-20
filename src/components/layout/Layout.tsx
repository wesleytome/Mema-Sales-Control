// Layout principal da aplicação — Mobile First
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/useTheme';
import { cn } from '@/lib/utils';
import { TrendingUp, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Alternar tema"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Spacer for fixed sidebar */}
      <div
        className={cn(
          'hidden md:block transition-all duration-300 shrink-0',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 w-full border-b border-border/60 glass shadow-sm">
          <div className="flex h-14 items-center px-4 gap-3">
            <div className="icon-chip gradient-brand shadow-md shadow-indigo-500/30 !w-8 !h-8 !rounded-lg shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold leading-tight text-foreground">
                MEMA
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                Gestão de Vendas
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggleButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Menu do usuário"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
