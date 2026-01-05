// Layout principal da aplicação - Mobile First
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Espaçador para sidebar fixo */}
      <div
        className={cn(
          'hidden md:block transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      />
      
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="md:hidden sticky top-0 z-40 w-full border-b bg-white shadow-sm">
          <div className="flex h-14 items-center px-3">
            <MobileMenu />
            <h1 className="ml-3 text-base font-bold truncate">Vendas Parceladas</h1>
          </div>
        </header>
        
        {/* Conteúdo - Mobile First */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

