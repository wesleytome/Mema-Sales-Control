// Página de vendas - Mobile First
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSales, useDeleteSale } from '@/hooks/useSales';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { FilterableTable, type FilterableColumn } from '@/components/ui/filterable-table';
import { Plus, Trash2, Eye, Pencil, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DELIVERY_STATUS_OPTIONS } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Sale } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SaleForm } from '@/components/sales/SaleForm';

export function Sales() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: sales, isLoading } = useSales();
  const deleteSale = useDeleteSale();

  const handleDelete = async (id: string) => {
    try {
      await deleteSale.mutateAsync(id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="icon-chip bg-blue-100 text-blue-600 dark:bg-blue-900/40 mt-0.5 hidden sm:flex">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie suas vendas e parcelas</p>
          </div>
        </div>
        <ResponsiveDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          trigger={
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          }
          title="Nova Venda"
          description="Crie uma nova venda e configure as parcelas"
          className="space-y-6"
        >
          <SaleForm
            onSuccess={() => {
              setIsDialogOpen(false);
            }}
          />
        </ResponsiveDialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <FilterableTable
          data={sales || []}
          columns={[
            {
              id: 'date',
              header: 'Data',
              accessor: (sale: Sale) =>
                format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR }),
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'buyer',
              header: 'Comprador',
              accessor: (sale: Sale) => sale.buyer?.name || '-',
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'product',
              header: 'Produto',
              accessor: 'product_description',
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'sale_price',
              header: 'Valor de Venda',
              accessor: (sale: Sale) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(sale.sale_price),
              filterable: false,
              defaultVisible: true,
            },
            {
              id: 'purchase_price',
              header: 'Valor de Compra',
              accessor: (sale: Sale) =>
                sale.purchase_price
                  ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(sale.purchase_price)
                  : '-',
              filterable: false,
              defaultVisible: false,
            },
            {
              id: 'profit',
              header: 'Lucro',
              accessor: (sale: Sale) => {
                if (!sale.purchase_price) return '-';
                const profit = sale.sale_price - sale.purchase_price;
                return (
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(profit)}
                  </span>
                );
              },
              filterable: false,
              defaultVisible: false,
            },
            {
              id: 'delivery_status',
              header: 'Status',
              accessor: (sale: Sale) => (
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    sale.delivery_status === 'delivered'
                      ? 'status-success'
                      : sale.delivery_status === 'sent'
                        ? 'status-info'
                        : 'status-neutral',
                  )}
                >
                  {
                    DELIVERY_STATUS_OPTIONS.find(
                      (opt) => opt.value === sale.delivery_status
                    )?.label
                  }
                </span>
              ),
              filterable: true,
              filterType: 'select',
              filterOptions: DELIVERY_STATUS_OPTIONS.map((opt) => ({
                label: opt.label,
                value: opt.value,
              })),
              defaultVisible: true,
            },
          ] as FilterableColumn<Sale>[]}
          keyExtractor={(sale: Sale) => sale.id}
          emptyMessage="Nenhuma venda cadastrada"
          searchPlaceholder="Buscar vendas..."
          mobileCardTitle={(sale: Sale) => sale.product_description}
          mobileCardSubtitle={(sale: Sale) => (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-muted-foreground">{sale.buyer?.name || 'Sem comprador'}</span>
              <span className="text-xs text-muted-foreground/70">
                {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          )}
          actions={(sale: Sale) => (
            <>
              <Button variant="default" size="sm" asChild>
                <Link to={`/vendas/${sale.id}`}>
                  <Eye className="h-4 w-4" />
                  Visualizar
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/vendas/${sale.id}/editar`)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 text-ehite" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(sale.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        />
      )}
    </div>
  );
}

