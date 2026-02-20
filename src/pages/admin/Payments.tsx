// Página de aprovação de pagamentos - Mobile First
import { useState } from 'react';
import { usePayments, useUpdatePayment } from '@/hooks/usePayments';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { FilterableTable, type FilterableColumn } from '@/components/ui/filterable-table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { Payment } from '@/types';
import { PAYMENT_STATUS_OPTIONS } from '@/lib/constants';

export function Payments() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: payments, isLoading } = usePayments();
  const updatePayment = useUpdatePayment();

  const handleApprove = async (payment: Payment) => {
    try {
      await updatePayment.mutateAsync({
        id: payment.id,
        status: 'approved',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    try {
      await updatePayment.mutateAsync({
        id: selectedPayment.id,
        status: 'rejected',
        rejection_reason: rejectionReason || null,
      });
      setIsDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenRejectDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="icon-chip bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 mt-0.5 hidden sm:flex">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pagamentos</h1>
            <p className="text-sm text-muted-foreground mt-1">Aprove ou rejeite pagamentos pendentes</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <FilterableTable
          data={payments || []}
          columns={[
            {
              id: 'date',
              header: 'Data',
              accessor: (payment: Payment) =>
                format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'product',
              header: 'Produto',
              accessor: (payment: Payment) => payment.installment?.sale?.product_description || '-',
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'installment',
              header: 'Parcela',
              accessor: (payment: Payment) => payment.installment?.installment_number || '-',
              filterable: false,
              defaultVisible: true,
            },
            {
              id: 'buyer',
              header: 'Comprador',
              accessor: (payment: Payment) => payment.installment?.sale?.buyer?.name || '-',
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'amount',
              header: 'Valor',
              accessor: (payment: Payment) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(payment.amount),
              filterable: false,
              defaultVisible: true,
            },
            {
              id: 'status',
              header: 'Status',
              accessor: (p: Payment) => {
                const statusMap: Record<string, string> = {
                  pending: 'status-warning',
                  approved: 'status-success',
                  rejected: 'status-danger',
                };
                const labelMap: Record<string, string> = {
                  pending: 'Pendente',
                  approved: 'Aprovado',
                  rejected: 'Rejeitado',
                };
                return (
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusMap[p.status] ?? 'status-neutral')}>
                    {labelMap[p.status] ?? p.status}
                  </span>
                );
              },
              filterable: true,
              filterType: 'select',
              filterOptions: PAYMENT_STATUS_OPTIONS.map((opt) => ({
                label: opt.label,
                value: opt.value,
              })),
              defaultVisible: true,
            },
            {
              id: 'rejection_reason',
              header: 'Motivo',
              accessor: (payment: Payment) =>
                payment.rejection_reason ? (
                  <span className="text-sm text-red-600">{payment.rejection_reason}</span>
                ) : (
                  '-'
                ),
              filterable: false,
              defaultVisible: false,
            },
          ] as FilterableColumn<Payment>[]}
          keyExtractor={(payment: Payment) => payment.id}
          emptyMessage="Nenhum pagamento encontrado"
          searchPlaceholder="Buscar pagamentos..."
          mobileCardTitle={(payment: Payment) =>
            payment.installment?.sale?.product_description || 'Produto não identificado'
          }
          mobileCardSubtitle={(payment: Payment) => (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-gray-600">
                {payment.installment?.sale?.buyer?.name || 'Sem comprador'}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </span>
            </div>
          )}
          actions={(payment: Payment) => (
            <>
              {payment.status === 'pending' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(payment)}
                    disabled={updatePayment.isPending}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                    Confirmar Recebimento
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRejectDialog(payment)}
                    disabled={updatePayment.isPending}
                  >
                    <X className="h-4 w-4 text-red-600" />
                    Não Recebi
                  </Button>
                </>
              ) : null}
              {payment.proof_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(payment.proof_url!, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  Ver comprovante
                </Button>
              )}
            </>
          )}
        />
      )}

      <ResponsiveDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Rejeitar Pagamento"
        description="Informe o motivo da rejeição (opcional)"
        className="space-y-4"
      >
        <div className="space-y-4 pt-4">
          <div>
            <Label>Motivo da Rejeição</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Comprovante ilegível, valor incorreto, etc."
              rows={4}
              className="mt-2"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updatePayment.isPending}
              className="w-full sm:w-auto"
            >
              Rejeitar
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
