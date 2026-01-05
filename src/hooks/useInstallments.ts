// Hook para gerenciar parcelas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Installment } from '@/types';
import { toast } from 'sonner';

export function useInstallments(saleId?: string) {
  return useQuery({
    queryKey: ['installments', saleId],
    queryFn: async () => {
      let query = supabase
        .from('installments')
        .select(`
          *,
          sale:sales(
            id,
            product_description,
            sale_price,
            sale_date,
            delivery_status
          )
        `);

      if (saleId) {
        query = query.eq('sale_id', saleId);
      }

      const { data, error } = await query.order('installment_number', {
        ascending: true,
      });

      if (error) throw error;
      
      // Garantir que os dados da venda estejam acessíveis
      return (data || []).map((item: any) => ({
        ...item,
        sale: item.sale || null,
      })) as Installment[];
    },
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

export function useCreateInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installment: Omit<Installment, 'id' | 'created_at' | 'sale'>) => {
      const { data, error } = await supabase
        .from('installments')
        .insert(installment)
        .select()
        .single();

      if (error) throw error;
      return data as Installment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['sales', data.sale_id] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar parcela');
    },
  });
}

export function useDeleteInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('installments').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir parcela');
    },
  });
}

