// Hook para gerenciar compradores
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Buyer } from '@/types';
import { toast } from 'sonner';

export function useBuyers() {
  return useQuery({
    queryKey: ['buyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Buyer[];
    },
  });
}

export function useBuyer(id: string) {
  return useQuery({
    queryKey: ['buyers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Buyer;
    },
    enabled: !!id,
  });
}

export function useCreateBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buyer: Omit<Buyer, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('buyers')
        .insert(buyer)
        .select()
        .single();

      if (error) throw error;
      return data as Buyer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast.success('Comprador criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar comprador');
    },
  });
}

export function useUpdateBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...buyer }: Partial<Buyer> & { id: string }) => {
      const { data, error } = await supabase
        .from('buyers')
        .update(buyer)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Buyer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      queryClient.invalidateQueries({ queryKey: ['buyers', variables.id] });
      toast.success('Comprador atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar comprador');
    },
  });
}

export function useDeleteBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      toast.success('Comprador excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir comprador');
    },
  });
}

