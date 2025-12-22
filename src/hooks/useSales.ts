// Hook para gerenciar vendas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Sale, SaleWithDetails, Installment } from '@/types';
import { toast } from 'sonner';

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          buyer:buyers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: async () => {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          buyer:buyers(*)
        `)
        .eq('id', id)
        .single();

      if (saleError) throw saleError;

      const { data: installmentsData, error: installmentsError } = await supabase
        .from('installments')
        .select('*')
        .eq('sale_id', id)
        .order('installment_number', { ascending: true });

      if (installmentsError) throw installmentsError;

      return {
        ...saleData,
        installments: installmentsData,
      } as SaleWithDetails;
    },
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sale,
      installments,
    }: {
      sale: Omit<Sale, 'id' | 'created_at' | 'buyer'>;
      installments: Omit<Installment, 'id' | 'created_at' | 'sale_id' | 'sale'>[];
    }) => {
      // Criar venda
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar parcelas
      if (installments.length > 0) {
        const installmentsToInsert = installments.map((inst) => ({
          ...inst,
          sale_id: saleData.id,
        }));

        const { error: installmentsError } = await supabase
          .from('installments')
          .insert(installmentsToInsert);

        if (installmentsError) throw installmentsError;
      }

      return saleData as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar venda');
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...sale }: Partial<Sale> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales')
        .update(sale)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Sale;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', variables.id] });
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar venda');
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir venda');
    },
  });
}

