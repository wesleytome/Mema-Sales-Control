// Componente Dialog responsivo (Drawer em mobile, Dialog em desktop)
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { ReactNode } from 'react';

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <div className="px-6 pt-6 pb-4">
            <SheetHeader className="!p-0">
              {title && <SheetTitle>{title}</SheetTitle>}
              {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>
          </div>
          <div className={`px-6 pb-6 ${className || ''}`}>{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={`max-w-lg max-h-[90vh] !grid-rows-[auto_1fr] ${className || ''}`}>
        <DialogHeader className="pb-2 flex-shrink-0">
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="-mx-2 px-2 overflow-y-auto overflow-x-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

