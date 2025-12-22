// Formulário de venda com parcelas híbridas
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths } from 'date-fns';
import { useCreateSale } from '@/hooks/useSales';
import { useBuyers } from '@/hooks/useBuyers';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DELIVERY_STATUS_OPTIONS } from '@/lib/constants';

const saleSchema = z.object({
  buyer_id: z.string().min(1, 'Comprador é obrigatório'),
  product_description: z.string().min(1, 'Descrição do produto é obrigatória'),
  total_amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  sale_date: z.date(),
  delivery_status: z.enum(['pending', 'sent', 'delivered']),
  notes: z.string().optional(),
  installments: z.array(
    z.object({
      amount: z.number().min(0.01),
      due_date: z.date(),
      installment_number: z.number(),
    })
  ).min(1, 'Pelo menos uma parcela é obrigatória'),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  onSuccess: () => void;
}

export function SaleForm({ onSuccess }: SaleFormProps) {
  const [parcelMode, setParcelMode] = useState<'auto' | 'manual'>('auto');
  const [numParcels, setNumParcels] = useState(1);
  const { data: buyers } = useBuyers();
  const createSale = useCreateSale();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      buyer_id: '',
      product_description: '',
      total_amount: 0,
      sale_date: new Date(),
      delivery_status: 'pending',
      notes: '',
      installments: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'installments',
  });

  const totalAmount = form.watch('total_amount');
  const saleDate = form.watch('sale_date');

  const handleAutoSplit = () => {
    if (!totalAmount || totalAmount <= 0 || !numParcels || numParcels < 1) {
      return;
    }

    const parcelAmount = totalAmount / numParcels;
    const installments = [];

    for (let i = 0; i < numParcels; i++) {
      installments.push({
        amount: parcelAmount,
        due_date: addMonths(saleDate || new Date(), i + 1),
        installment_number: i + 1,
      });
    }

    form.setValue('installments', installments);
  };

  const handleAddManualParcel = () => {
    const nextNumber = fields.length + 1;
    append({
      amount: 0,
      due_date: addMonths(saleDate || new Date(), nextNumber),
      installment_number: nextNumber,
    });
  };

  const onSubmit = async (data: SaleFormData) => {
    try {
      await createSale.mutateAsync({
        sale: {
          buyer_id: data.buyer_id,
          product_description: data.product_description,
          total_amount: data.total_amount,
          sale_date: format(data.sale_date, 'yyyy-MM-dd'),
          delivery_status: data.delivery_status,
          notes: data.notes || null,
        },
        installments: data.installments.map((inst) => ({
          amount: inst.amount,
          due_date: format(inst.due_date, 'yyyy-MM-dd'),
          status: 'pending' as const,
          paid_amount: 0,
          installment_number: inst.installment_number,
        })),
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="buyer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comprador *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um comprador" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {buyers?.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.id}>
                        {buyer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sale_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Venda *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="product_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Produto *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Geladeira Brastemp" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Total *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delivery_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status de Entrega</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DELIVERY_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Observações adicionais..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Parcelas</h3>
            <Tabs value={parcelMode} onValueChange={(v) => setParcelMode(v as 'auto' | 'manual')}>
              <TabsList>
                <TabsTrigger value="auto">Automático</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {parcelMode === 'auto' ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={numParcels}
                  onChange={(e) => setNumParcels(parseInt(e.target.value) || 1)}
                  placeholder="Número de parcelas"
                  className="w-48"
                />
                <Button type="button" onClick={handleAutoSplit}>
                  Gerar Parcelas
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" onClick={handleAddManualParcel} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Parcela
            </Button>
          )}

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name={`installments.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`installments.${index}.due_date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'dd/MM/yyyy')
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createSale.isPending}>
            {createSale.isPending ? 'Salvando...' : 'Criar Venda'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

