import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';

const flexiblePaymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor mínimo: R$ 0.01'),
  notes: z.string().optional(),
});

type FlexiblePaymentFormData = z.infer<typeof flexiblePaymentSchema>;

interface AddFlexiblePaymentFormProps {
  installmentId: string;
  maxAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddFlexiblePaymentForm({ 
  installmentId, 
  maxAmount,
  onSuccess,
  onCancel,
}: AddFlexiblePaymentFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<FlexiblePaymentFormData>({
    resolver: zodResolver(
      flexiblePaymentSchema.refine(
        (data) => data.amount <= maxAmount,
        {
          message: `Valor máximo: R$ ${maxAmount.toFixed(2)}`,
          path: ['amount'],
        }
      )
    ),
    defaultValues: {
      amount: 0,
      notes: '',
    },
  });

  const createPayment = useMutation({
    mutationFn: async (data: FlexiblePaymentFormData) => {
      const { data: paymentData, error } = await supabase
        .from('payments')
        .insert({
          installment_id: installmentId,
          amount: data.amount,
          proof_url: 'manual-admin',
          status: 'approved',
        })
        .select()
        .single();
      
      if (error) throw error;
      return paymentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Pagamento registrado com sucesso!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar pagamento');
    },
  });

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit((data) => createPayment.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Recebido *</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <p className="text-sm text-gray-500">
                Saldo restante: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(maxAmount)}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Informações adicionais sobre o pagamento (opcional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={createPayment.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createPayment.isPending}>
            {createPayment.isPending ? 'Salvando...' : 'Confirmar Pagamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
