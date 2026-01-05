// Componente de select com busca e scroll infinito para compradores
import { useState, useEffect, useRef, useCallback } from 'react';
import { useBuyers } from '@/hooks/useBuyers';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuyerSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onNewBuyer?: () => void;
}

const ITEMS_PER_PAGE = 20;

export function BuyerSelect({ value, onChange, placeholder = 'Selecione um comprador', disabled, onNewBuyer }: BuyerSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const { data: buyers, isLoading } = useBuyers();
  
  // Filtra compradores baseado na busca
  const filteredBuyers = buyers?.filter((buyer) =>
    buyer.name.toLowerCase().includes(search.toLowerCase()) ||
    buyer.cpf?.includes(search.replace(/\D/g, '')) ||
    buyer.phone?.includes(search.replace(/\D/g, ''))
  ) || [];
  
  // Paginação
  const paginatedBuyers = filteredBuyers.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginatedBuyers.length < filteredBuyers.length;
  
  const selectedBuyer = buyers?.find((b) => b.id === value);
  
  // Reset page quando busca muda
  useEffect(() => {
    setPage(1);
  }, [search]);
  
  // Intersection Observer para scroll infinito
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore]);
  
  const handleSelect = (buyerId: string) => {
    onChange?.(buyerId);
    setOpen(false);
    setSearch('');
    setPage(1);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedBuyer ? selectedBuyer.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3">
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : paginatedBuyers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Nenhum comprador encontrado
              </div>
            ) : (
              <>
                {paginatedBuyers.map((buyer, index) => (
                  <div
                    key={buyer.id}
                    ref={index === paginatedBuyers.length - 1 ? lastElementRef : null}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      value === buyer.id && 'bg-accent'
                    )}
                    onClick={() => handleSelect(buyer.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === buyer.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{buyer.name}</div>
                      {(buyer.cpf || buyer.phone) && (
                        <div className="text-xs text-gray-500">
                          {buyer.cpf && `CPF: ${buyer.cpf.length === 11 ? buyer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : buyer.cpf} `}
                          {buyer.phone && (
                            buyer.phone.length === 11
                              ? `Tel: ${buyer.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}`
                              : buyer.phone.length === 10
                              ? `Tel: ${buyer.phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')}`
                              : `Tel: ${buyer.phone}`
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <div ref={loadMoreRef} className="p-2 text-center text-xs text-gray-500">
                    Carregando mais...
                  </div>
                )}
              </>
            )}
          </div>
          {onNewBuyer && (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onNewBuyer();
                  setOpen(false);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Comprador
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

