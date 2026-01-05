// Formulário de venda com parcelas híbridas
import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths } from 'date-fns';
import { useCreateSale, useUpdateSale } from '@/hooks/useSales';
import { supabase } from '@/lib/supabase';
import type { SaleWithDetails } from '@/types';
import { useBuyers, useCreateBuyer } from '@/hooks/useBuyers';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { ProductAutocomplete } from '@/components/ui/product-autocomplete';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuyerSelect } from '@/components/ui/buyer-select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { CPFInput, validateCPF } from '@/components/ui/cpf-input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, CalendarIcon, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DELIVERY_STATUS_OPTIONS } from '@/lib/constants';

const buyerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf: z.string().optional().refine((val) => !val || val.length === 0 || validateCPF(val), {
    message: 'CPF inválido',
  }),
});

// Schema base da venda (buyer_id será validado condicionalmente)
const baseSaleSchema = z.object({
  buyer_id: z.string().optional(),
  product_description: z.string().min(1, 'Descrição do produto é obrigatória'),
  purchase_price: z.number().min(0).optional().nullable(),
  sale_price: z.number().min(0.01, 'Valor de venda deve ser maior que zero'),
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


type SaleFormData = z.infer<typeof baseSaleSchema>;
type BuyerFormData = z.infer<typeof buyerSchema>;

interface SaleFormProps {
  onSuccess: () => void;
  sale?: SaleWithDetails;
}

export function SaleForm({ onSuccess, sale }: SaleFormProps) {
  const isEditMode = !!sale;
  const [parcelMode, setParcelMode] = useState<'auto' | 'manual'>('auto');
  const [numParcels, setNumParcels] = useState(1);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  useBuyers(); // Pre-fetch buyers para o BuyerSelect
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const createBuyer = useCreateBuyer();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(baseSaleSchema),
    defaultValues: {
      buyer_id: sale?.buyer_id || '',
      product_description: sale?.product_description || '',
      purchase_price: sale?.purchase_price || null,
      sale_price: sale?.sale_price || 0,
      sale_date: sale?.sale_date ? new Date(sale.sale_date) : new Date(),
      delivery_status: sale?.delivery_status || 'pending',
      notes: sale?.notes || '',
      installments: sale?.installments?.map((inst) => ({
        amount: inst.amount,
        due_date: new Date(inst.due_date),
        installment_number: inst.installment_number,
      })) || [],
    },
  });

  // Limpar erro do buyer_id quando showBuyerForm mudar
  useEffect(() => {
    if (showBuyerForm) {
      form.clearErrors('buyer_id');
    }
  }, [showBuyerForm, form]);

  const buyerForm = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      cpf: '',
    },
  });


  // Resetar formulário quando a venda mudar
  useEffect(() => {
    if (sale) {
      form.reset({
        buyer_id: sale.buyer_id,
        product_description: sale.product_description,
        purchase_price: sale.purchase_price || null,
        sale_price: sale.sale_price,
        sale_date: sale.sale_date ? new Date(sale.sale_date) : new Date(),
        delivery_status: sale.delivery_status,
        notes: sale.notes || '',
        installments: sale.installments?.map((inst) => ({
          amount: inst.amount,
          due_date: new Date(inst.due_date),
          installment_number: inst.installment_number,
        })) || [],
      });
    } else {
      form.reset({
        buyer_id: '',
        product_description: '',
        purchase_price: null,
        sale_price: 0,
        sale_date: new Date(),
        delivery_status: 'pending',
        notes: '',
        installments: [],
      });
    }
  }, [sale, form]);

  // Cleanup do timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const { fields, append } = useFieldArray({
    control: form.control,
    name: 'installments',
  });

  const salePrice = form.watch('sale_price');
  const saleDate = form.watch('sale_date');
  const installments = form.watch('installments');

  // Sincroniza o número de parcelas com a quantidade real
  useEffect(() => {
    if (fields.length > 0) {
      setNumParcels(fields.length);
    } else if (parcelMode === 'auto') {
      // Se está no modo automático e não há parcelas, mantém o valor mínimo
      setNumParcels(1);
    }
  }, [fields.length, parcelMode]);

  // Quando entrar em modo de edição, definir modo manual se houver parcelas
  useEffect(() => {
    if (isEditMode && sale?.installments && sale.installments.length > 0) {
      setParcelMode('manual');
    }
  }, [isEditMode, sale]);

  const handleAutoSplit = () => {
    if (!salePrice || salePrice <= 0 || !numParcels || numParcels < 1) {
      return;
    }

    const parcelAmount = salePrice / numParcels;
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
    const currentInstallments = form.getValues('installments');
    const salePrice = form.getValues('sale_price');
    const nextNumber = currentInstallments.length + 1;
    
    // Calcula o valor restante
    const sumOfCurrent = currentInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    const remainingAmount = salePrice - sumOfCurrent;
    
    // Se há valor restante, distribui entre todas as parcelas (incluindo a nova)
    let newAmount = 0;
    if (remainingAmount > 0 && currentInstallments.length > 0) {
      // Distribui o restante igualmente entre todas as parcelas (incluindo a nova)
      const amountPerParcel = remainingAmount / (currentInstallments.length + 1);
      newAmount = amountPerParcel;
      
      // Ajusta as parcelas existentes
      const updatedInstallments = currentInstallments.map((inst) => ({
        ...inst,
        amount: inst.amount + amountPerParcel,
      }));
      form.setValue('installments', updatedInstallments);
    } else if (remainingAmount > 0) {
      newAmount = remainingAmount;
    } else if (salePrice > 0 && currentInstallments.length === 0) {
      // Se não há parcelas, divide o total igualmente (será ajustado depois)
      newAmount = salePrice;
    }
    
    append({
      amount: newAmount,
      due_date: addMonths(saleDate || new Date(), nextNumber),
      installment_number: nextNumber,
    });
  };

  const handleRemoveInstallment = (index: number) => {
    const currentInstallments = form.getValues('installments');
    const salePrice = form.getValues('sale_price');
    
    if (currentInstallments.length <= 1) {
      // Não permite remover se só há uma parcela
      return;
    }
    
    // Remove a parcela da lista
    const remainingInstallments = currentInstallments.filter((_, i) => i !== index);
    
    // Recalcula os números das parcelas
    const renumberedInstallments = remainingInstallments.map((inst, i) => ({
      ...inst,
      installment_number: i + 1,
    }));
    
    // Calcula a soma atual das parcelas restantes
    const sumOfRemaining = renumberedInstallments.reduce(
      (sum, inst) => sum + inst.amount,
      0
    );
    
    // Calcula a diferença que precisa ser redistribuída
    const difference = salePrice - sumOfRemaining;
    
    if (Math.abs(difference) < 0.01) {
      // Se não há diferença significativa, apenas remove e renumerar
      form.setValue('installments', renumberedInstallments);
      return;
    }
    
    // Redistribui a diferença proporcionalmente entre as parcelas restantes
    if (renumberedInstallments.length > 0) {
      const sumOfOthers = renumberedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      
      if (sumOfOthers > 0) {
        // Distribui proporcionalmente
        const updatedInstallments = renumberedInstallments.map((inst) => {
          const proportion = inst.amount / sumOfOthers;
          const addition = difference * proportion;
          return {
            ...inst,
            amount: Math.max(0.01, inst.amount + addition),
          };
        });
        form.setValue('installments', updatedInstallments);
      } else {
        // Se não há outras parcelas com valor, distribui igualmente
        const amountPerParcel = salePrice / renumberedInstallments.length;
        const updatedInstallments = renumberedInstallments.map((inst) => ({
          ...inst,
          amount: amountPerParcel,
        }));
        form.setValue('installments', updatedInstallments);
      }
    }
  };

  // Ref para rastrear qual campo está sendo editado
  const editingIndexRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleInstallmentAmountChange = (index: number, _newAmount: number) => {
    // Atualiza apenas o valor da parcela atual sem recalcular
    // Marca que este campo está sendo editado
    editingIndexRef.current = index;
    
    // Limpa o timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleInstallmentAmountBlur = (index: number) => {
    // Só recalcula quando o campo perder o foco
    if (editingIndexRef.current !== index) return;
    
    editingIndexRef.current = null;
    
    // Usa um pequeno delay para garantir que o valor foi atualizado
    timeoutRef.current = setTimeout(() => {
      const currentInstallments = form.getValues('installments');
      const salePrice = form.getValues('sale_price');
      
      if (!salePrice || salePrice <= 0) return;
      
      // Calcula a soma das parcelas
      const sumOfInstallments = currentInstallments.reduce(
        (sum, inst) => sum + inst.amount,
        0
      );
      
      const difference = salePrice - sumOfInstallments;
      
      // Se não há diferença significativa, não precisa ajustar
      if (Math.abs(difference) < 0.01) {
        return;
      }
      
      // Se a soma for maior que o total, reduz proporcionalmente das outras parcelas
      if (sumOfInstallments > salePrice) {
        const otherInstallments = currentInstallments.filter((_, i) => i !== index);
        const sumOfOthers = otherInstallments.reduce((sum, inst) => sum + inst.amount, 0);
        
        if (sumOfOthers > 0) {
          // Reduz proporcionalmente das outras parcelas
          const updatedInstallments = currentInstallments.map((inst, i) => {
            if (i === index) return inst;
            const proportion = inst.amount / sumOfOthers;
            const reduction = difference * proportion;
            return {
              ...inst,
              amount: Math.max(0.01, inst.amount + reduction), // difference é negativo
            };
          });
          form.setValue('installments', updatedInstallments);
        } else {
          // Se não há outras parcelas com valor, limita a parcela alterada ao total
          const updatedInstallments = currentInstallments.map((inst, i) =>
            i === index ? { ...inst, amount: salePrice } : inst
          );
          form.setValue('installments', updatedInstallments);
        }
      } else {
        // Se a soma for menor, distribui a diferença proporcionalmente nas outras parcelas
        const otherInstallments = currentInstallments.filter((_, i) => i !== index);
        const sumOfOthers = otherInstallments.reduce((sum, inst) => sum + inst.amount, 0);
        
        if (sumOfOthers > 0) {
          // Distribui proporcionalmente nas outras parcelas
          const updatedInstallments = currentInstallments.map((inst, i) => {
            if (i === index) return inst;
            const proportion = inst.amount / sumOfOthers;
            const addition = difference * proportion;
            return {
              ...inst,
              amount: inst.amount + addition,
            };
          });
          form.setValue('installments', updatedInstallments);
        } else {
          // Se não há outras parcelas com valor, distribui igualmente
          const otherCount = otherInstallments.length;
          if (otherCount > 0) {
            const amountPerOther = difference / otherCount;
            const updatedInstallments = currentInstallments.map((inst, i) => {
              if (i === index) return inst;
              return {
                ...inst,
                amount: Math.max(0.01, inst.amount + amountPerOther),
              };
            });
            form.setValue('installments', updatedInstallments);
          }
        }
      }
    }, 100);
  };

  const onSubmit = async (data: SaleFormData) => {
    try {
      let buyerId = data.buyer_id;

      // Validação condicional do buyer_id
      if (!showBuyerForm && (!buyerId || buyerId.trim() === '')) {
        form.setError('buyer_id', {
          type: 'manual',
          message: 'Comprador é obrigatório',
        });
        return;
      }

      // Se o formulário de comprador estiver visível e preenchido, criar o comprador primeiro
      if (showBuyerForm) {
        const buyerData = buyerForm.getValues();
        // Valida se o formulário de comprador está válido
        const isValid = await buyerForm.trigger();
        if (isValid && buyerData.name) {
          try {
            const newBuyer = await createBuyer.mutateAsync({
              ...buyerData,
              phone: buyerData.phone || null,
              email: buyerData.email || null,
              cpf: buyerData.cpf || null,
              cep: null,
              address: null,
              address_number: null,
              address_complement: null,
              neighborhood: null,
              city: null,
              state: null,
              address_reference: null,
            });
            buyerId = newBuyer.id;
            // Atualiza o select com o novo comprador
            form.setValue('buyer_id', newBuyer.id);
          } catch (error) {
            // Se houver erro ao criar o comprador, não continua com a venda
            console.error('Erro ao criar comprador:', error);
            return;
          }
        } else {
          // Se o formulário de comprador está visível mas inválido, não continua
          return;
        }
      }

      if (isEditMode && sale) {
        // Modo de edição
        await updateSale.mutateAsync({
          id: sale.id,
          buyer_id: data.buyer_id,
          product_description: data.product_description,
          purchase_price: data.purchase_price || null,
          sale_price: data.sale_price,
          sale_date: format(data.sale_date, 'yyyy-MM-dd'),
          delivery_status: data.delivery_status,
          notes: data.notes || null,
        });

        // Gerenciar parcelas: atualizar, criar novas e deletar removidas
        const existingInstallments = sale.installments;
        const existingIds = existingInstallments.map((inst) => inst.id);
        
        // Mapear parcelas do formulário para IDs existentes (por número de parcela)
        const formToExistingMap = new Map<string, string>();
        data.installments.forEach((formInst) => {
          const existing = existingInstallments.find(
            (e) => e.installment_number === formInst.installment_number
          );
          if (existing) {
            formToExistingMap.set(formInst.installment_number.toString(), existing.id);
          }
        });

        const formIds = Array.from(formToExistingMap.values());

        // Deletar parcelas removidas (que não estão mais no formulário)
        const toDelete = existingIds.filter((id) => !formIds.includes(id));
        for (const id of toDelete) {
          const { error } = await supabase.from('installments').delete().eq('id', id);
          if (error) throw error;
        }

        // Atualizar ou criar parcelas
        for (let i = 0; i < data.installments.length; i++) {
          const inst = data.installments[i];
          const existingId = formToExistingMap.get(inst.installment_number.toString());
          const existingInst = existingId
            ? existingInstallments.find((e) => e.id === existingId)
            : null;

          if (existingInst) {
            // Atualizar parcela existente (preservar paid_amount e status)
            const { error } = await supabase
              .from('installments')
              .update({
                amount: inst.amount,
                due_date: format(inst.due_date, 'yyyy-MM-dd'),
                installment_number: inst.installment_number,
                // Preservar paid_amount e status
                paid_amount: existingInst.paid_amount,
                status: existingInst.status,
              })
              .eq('id', existingInst.id);
            if (error) throw error;
          } else {
            // Criar nova parcela
            const { error } = await supabase.from('installments').insert({
              sale_id: sale.id,
              amount: inst.amount,
              due_date: format(inst.due_date, 'yyyy-MM-dd'),
              status: 'pending',
              paid_amount: 0,
              installment_number: inst.installment_number,
            });
            if (error) throw error;
          }
        }
      } else {
        // Modo de criação
        if (!buyerId) {
          form.setError('buyer_id', {
            type: 'manual',
            message: 'Selecione ou crie um comprador',
          });
          return;
        }
        await createSale.mutateAsync({
          sale: {
            buyer_id: buyerId,
            product_description: data.product_description,
            purchase_price: data.purchase_price || null,
            sale_price: data.sale_price,
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
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Venda */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="buyer_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Comprador *</FormLabel>
                  <FormControl>
                    <BuyerSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione um comprador"
                      onNewBuyer={() => setShowBuyerForm(true)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Formulário de Novo Comprador */}
          {showBuyerForm && (
            <div className="border rounded-lg p-5 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Novo Comprador
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Preencha os dados do comprador antes de criar a venda
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowBuyerForm(false);
                    buyerForm.reset();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Form {...buyerForm}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={buyerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome completo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={buyerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={buyerForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <CPFInput
                              value={field.value || ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              validate={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={buyerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="email@exemplo.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </div>
          )}

          <Separator className={showBuyerForm ? '' : 'hidden'} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField
            control={form.control}
            name="sale_date"
            render={({ field }) => (
              <FormItem className="space-y-2">
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
            <FormItem className="space-y-2">
              <FormLabel>Descrição do Produto *</FormLabel>
              <FormControl>
                <ProductAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex: Geladeira Brastemp"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchase_price"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Valor de Compra</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={(value) => field.onChange(value || null)}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sale_price"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Valor de Venda *</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="delivery_status"
            render={({ field }) => (
              <FormItem className="space-y-2">
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
            <FormItem className="space-y-2">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-48">
                  <NumberInput
                    value={numParcels}
                    onChange={(newValue) => setNumParcels(newValue)}
                    min={1}
                    max={100}
                    placeholder="Número de parcelas"
                    className="w-full"
                  />
                </div>
                <Button type="button" onClick={handleAutoSplit} className="w-full sm:w-auto">
                  Gerar Parcelas
                </Button>
              </div>
              {fields.length > 0 && (
                <p className="text-sm text-gray-500">
                  {fields.length} parcela(s) cadastrada(s) - Total: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(
                    installments.reduce((sum, inst) => sum + inst.amount, 0)
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Button type="button" onClick={handleAddManualParcel} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Parcela
              </Button>
              {fields.length > 0 && (
                <p className="text-sm text-gray-500">
                  {fields.length} parcela(s) cadastrada(s) - Total: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }                  ).format(
                    installments.reduce((sum, inst) => sum + inst.amount, 0)
                  )} / {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(salePrice)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-end p-5 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name={`installments.${index}.amount`}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onChange={(newValue) => {
                              field.onChange(newValue);
                              handleInstallmentAmountChange(index, newValue);
                            }}
                            onBlur={(_e) => {
                              field.onBlur();
                              handleInstallmentAmountBlur(index);
                            }}
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
                      <FormItem className="space-y-2">
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
                  onClick={() => handleRemoveInstallment(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {isEditMode ? (
            <Button type="submit" disabled={createSale.isPending || updateSale.isPending}>
              {createSale.isPending || updateSale.isPending
                ? 'Salvando...'
                : 'Salvar Alterações'}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSale.isPending || updateSale.isPending}>
                {createSale.isPending ? 'Salvando...' : 'Criar Venda'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
    </div>
  );
}

