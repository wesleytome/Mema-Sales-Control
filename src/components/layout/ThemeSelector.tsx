import type { ComponentType } from 'react';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import type { Theme } from '@/contexts/theme-context';
import { useTheme } from '@/contexts/useTheme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: ComponentType<{ className?: string }> }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'purple', label: 'Purple', icon: Palette },
  { value: 'system', label: 'System', icon: Monitor },
];

interface ThemeSelectorProps {
  compact?: boolean;
  className?: string;
  align?: 'start' | 'end';
}

export function ThemeSelector({ compact = false, className, align = 'end' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const activeTheme = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[0];
  const ActiveIcon = activeTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={cn(
            compact ? 'h-8 w-8' : 'h-8 px-2.5 justify-start gap-2',
            className,
          )}
          aria-label="Selecionar tema"
        >
          <ActiveIcon className="h-4 w-4" />
          {!compact && <span className="text-xs font-medium">Tema: {activeTheme.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer">
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
