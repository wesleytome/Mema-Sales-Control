// Hook para buscar sugestões de produtos similares
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useProductSuggestions(searchTerm: string, limit = 10) {
  return useQuery({
    queryKey: ['product-suggestions', searchTerm, limit],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('sales')
        .select('product_description')
        .ilike('product_description', `%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      // Remove duplicatas e retorna apenas descrições únicas
      const uniqueProducts = Array.from(
        new Set(data.map((sale) => sale.product_description))
      );

      return uniqueProducts;
    },
    enabled: searchTerm.length >= 2,
  });
}

