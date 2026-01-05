// Hook para gerenciar pagamentos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Payment, PaymentStatus } from '@/types';
import { toast } from 'sonner';

export function usePayments(status?: PaymentStatus) {
  return useQuery({
    queryKey: ['payments', status],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          installment:installments(
            *,
            sale:sales(
              *,
              buyer:buyers(*)
            )
          )
        `);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          installment:installments(
            *,
            sale:sales(
              *,
              buyer:buyers(*)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Payment;
    },
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'installment'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Comprovante enviado com sucesso! Aguarde aprovação.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar comprovante');
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejection_reason,
    }: {
      id: string;
      status: PaymentStatus;
      rejection_reason?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status, rejection_reason })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(
        data.status === 'approved'
          ? 'Pagamento aprovado com sucesso!'
          : 'Pagamento rejeitado.'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar pagamento');
    },
  });
}

