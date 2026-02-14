import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { Installment, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus } from 'lucide-react';
import { AddFlexiblePaymentForm } from './AddFlexiblePaymentForm';

interface FlexiblePaymentSectionProps {
  installment: Installment;
}

export function FlexiblePaymentSection({ installment }: FlexiblePaymentSectionProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const { data: payments, refetch } = useQuery({
    queryKey: ['payments', 'installment', installment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('installment_id', installment.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    }
  });

  const totalPaid = installment.paid_amount;
  const totalSale = installment.amount;
  const remaining = totalSale - totalPaid;
  const progress = totalSale > 0 ? (totalPaid / totalSale) * 100 : 0;

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600">Rejeitado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalSale)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPaid)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Restante</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progresso do pagamento</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Botão adicionar pagamento */}
      {remaining > 0 && !showPaymentForm && (
        <Button onClick={() => setShowPaymentForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Pagamento
        </Button>
      )}

      {/* Formulário de adicionar pagamento */}
      {showPaymentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <AddFlexiblePaymentForm
              installmentId={installment.id}
              maxAmount={remaining}
              onSuccess={() => {
                setShowPaymentForm(false);
                refetch();
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Lista de pagamentos */}
      <div className="space-y-3">
        <h4 className="font-semibold text-lg">Histórico de Pagamentos</h4>
        {!payments || payments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                      {payment.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Motivo da rejeição: {payment.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="text-xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(payment.amount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
