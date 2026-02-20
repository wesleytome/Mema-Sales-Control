// Bottom tab bar para navegação mobile
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Compradores', href: '/compradores', icon: Users },
  { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { name: 'Pagamentos', href: '/pagamentos', icon: CreditCard },
];

export function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'md:hidden',
        'glass border-t border-border/60',
        'pb-safe',
      )}
    >
      <div className="flex items-stretch h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 relative',
                'transition-all duration-200 select-none',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full gradient-brand" />
              )}
              <item.icon
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110',
                )}
              />
              <span
                className={cn(
                  'text-[11px] font-semibold leading-none tracking-wide',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
