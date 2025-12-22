// Hook para gerenciar parcelas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Installment } from '@/types';
import { toast } from 'sonner';

export function useInstallments(saleId?: string) {
  return useQuery({
    queryKey: ['installments', saleId],
    queryFn: async () => {
      let query = supabase.from('installments').select('*');

      if (saleId) {
        query = query.eq('sale_id', saleId);
      }

      const { data, error } = await query.order('installment_number', {
        ascending: true,
      });

      if (error) throw error;
      return data as Installment[];
    },
    enabled: saleId !== undefined,
  });
}

export function useUpdateInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...installment
    }: Partial<Installment> & { id: string }) => {
      const { data, error } = await supabase
        .from('installments')
        .update(installment)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Installment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['sales', data.sale_id] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Parcela atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar parcela');
    },
  });
}

