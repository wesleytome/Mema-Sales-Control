// Formulário de venda com parcelas híbridas
import { useState, useEffect, useRef } from 'react';
import { useFieldArray, useForm, type Resolver } from 'react-hook-form';
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
import { CPFInput } from '@/components/ui/cpf-input';
import { CEPInput } from '@/components/ui/cep-input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, CalendarIcon, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateCPF } from '@/lib/cpf';
import { DELIVERY_STATUS_OPTIONS, BRAZILIAN_STATES } from '@/lib/constants';
import { toast } from 'sonner';

const buyerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf: z.string().optional().refine((val) => !val || val.length === 0 || validateCPF(val), {
    message: 'CPF inválido',
  }),
  cep: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address_reference: z.string().optional(),
});

// Schema base da venda (buyer_id será validado condicionalmente)
const baseSaleSchema = z.object({
  buyer_id: z.string().optional(),
  product_description: z.string().min(1, 'Descrição do produto é obrigatória'),
  purchase_price: z.number().min(0).optional().nullable(),
  sale_price: z.number().min(0.01, 'Valor de venda deve ser maior que zero'),
  sale_date: z.date(),
  delivery_status: z.enum(['pending', 'sent', 'delivered']),
  payment_mode: z.enum(['fixed', 'flexible']).default('fixed'),
  notes: z.string().optional(),
  installments: z.array(
    z.object({
      amount: z.number().min(0.01),
      due_date: z.date().nullable(),
      installment_number: z.number(),
      original_id: z.string().optional(),
      paid_amount: z.number().min(0).optional(),
    })
  ),
}).refine(
  (data) => {
    // Modo fixo: exige pelo menos 1 parcela
    if (data.payment_mode === 'fixed') {
      return data.installments.length >= 1;
    }
    // Modo flexível: parcelas são opcionais (será criada automaticamente)
    return true;
  },
  {
    message: 'Pelo menos uma parcela é obrigatória no modo fixo',
    path: ['installments'],
  }
);


type SaleFormData = z.infer<typeof baseSaleSchema>;
type BuyerFormData = z.infer<typeof buyerSchema>;

interface SaleFormProps {
  onSuccess: () => void;
  sale?: SaleWithDetails;
}

export function SaleForm({ onSuccess, sale }: SaleFormProps) {
  const isEditMode = !!sale;
  const [paymentMode, setPaymentMode] = useState<'fixed' | 'flexible'>(sale?.payment_mode || 'fixed');
  const [parcelMode, setParcelMode] = useState<'auto' | 'manual'>('auto');
  const [numParcels, setNumParcels] = useState(1);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [editPaidInstallmentIds, setEditPaidInstallmentIds] = useState<string[]>([]);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [adjustmentConfirmText, setAdjustmentConfirmText] = useState('');
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    type: 'edit' | 'delete';
    index: number;
    installmentNumber: number;
    originalId?: string;
  } | null>(null);
  useBuyers(); // Pre-fetch buyers para o BuyerSelect
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const createBuyer = useCreateBuyer();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(baseSaleSchema) as Resolver<SaleFormData>,
    defaultValues: {
      buyer_id: sale?.buyer_id || '',
      product_description: sale?.product_description || '',
      purchase_price: sale?.purchase_price || null,
      sale_price: sale?.sale_price || 0,
      sale_date: sale?.sale_date ? new Date(sale.sale_date) : new Date(),
      delivery_status: sale?.delivery_status || 'pending',
      payment_mode: sale?.payment_mode || 'fixed',
      notes: sale?.notes || '',
      installments: sale?.installments?.map((inst) => ({
        amount: inst.amount,
        due_date: inst.due_date ? new Date(inst.due_date) : null,
        installment_number: inst.installment_number,
        original_id: inst.id,
        paid_amount: inst.paid_amount,
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
      cep: '',
      address: '',
      address_number: '',
      address_complement: '',
      neighborhood: '',
      city: '',
      state: '',
      address_reference: '',
    },
  });

  const handleAddressFound = (address: {
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
    complemento?: string;
  }) => {
    buyerForm.setValue('address', address.logradouro);
    buyerForm.setValue('neighborhood', address.bairro);
    buyerForm.setValue('city', address.cidade);
    buyerForm.setValue('state', address.estado);
    if (address.complemento) {
      buyerForm.setValue('address_complement', address.complemento);
    }
  };


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
        payment_mode: sale.payment_mode || 'fixed',
        notes: sale.notes || '',
        installments: sale.installments?.map((inst) => ({
          amount: inst.amount,
          due_date: inst.due_date ? new Date(inst.due_date) : null,
          installment_number: inst.installment_number,
          original_id: inst.id,
          paid_amount: inst.paid_amount,
        })) || [],
      });
      setPaymentMode(sale.payment_mode || 'fixed');
      setEditPaidInstallmentIds([]);
    } else {
      form.reset({
        buyer_id: '',
        product_description: '',
        purchase_price: null,
        sale_price: 0,
        sale_date: new Date(),
        delivery_status: 'pending',
        payment_mode: 'fixed',
        notes: '',
        installments: [],
      });
      setPaymentMode('fixed');
      setEditPaidInstallmentIds([]);
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

  const { fields } = useFieldArray({
    control: form.control,
    name: 'installments',
  });

  const salePrice = form.watch('sale_price');
  const saleDate = form.watch('sale_date');
  const installments = form.watch('installments');
  const hasAnyPaidInstallment = installments.some((inst) => (inst.paid_amount || 0) > 0);
  const originalTotalPaid = sale?.installments.reduce((sum, inst) => sum + inst.paid_amount, 0) || 0;
  const isFullyPaidSale = Boolean(isEditMode && sale && originalTotalPaid >= sale.sale_price);

  const isInstallmentPaid = (installment: SaleFormData['installments'][number]) =>
    (installment.paid_amount || 0) > 0;

  const isPaidInstallmentEditable = (installment: SaleFormData['installments'][number]) => {
    if (!isInstallmentPaid(installment)) return true;
    if (!installment.original_id) return false;
    return editPaidInstallmentIds.includes(installment.original_id);
  };

  const getLockedInstallmentIndexes = (
    values: SaleFormData['installments'],
    options?: { ignoreIndex?: number },
  ) => {
    const lockedIndexes = new Set<number>();
    values.forEach((installment, idx) => {
      if (options?.ignoreIndex === idx) return;
      if (isInstallmentPaid(installment) && !isPaidInstallmentEditable(installment)) {
        lockedIndexes.add(idx);
      }
    });
    return lockedIndexes;
  };

  const rebalanceEditableInstallments = (
    values: SaleFormData['installments'],
    totalSalePrice: number,
  ): { installments: SaleFormData['installments']; error: string | null } => {
    if (!values.length) {
      return { installments: values, error: null };
    }

    const lockedIndexes = getLockedInstallmentIndexes(values);
    const editableIndexes = values
      .map((_, index) => index)
      .filter((index) => !lockedIndexes.has(index));

    const fixedAmount = values.reduce(
      (sum, inst, index) => (lockedIndexes.has(index) ? sum + inst.amount : sum),
      0,
    );
    const targetEditableAmount = totalSalePrice - fixedAmount;

    if (editableIndexes.length === 0) {
      const diff = totalSalePrice - fixedAmount;
      if (Math.abs(diff) < 0.01) {
        return { installments: values, error: null };
      }
      return {
        installments: values,
        error:
          'Não há parcelas editáveis para redistribuir. Libere uma parcela paga para ajuste ou revise o valor total.',
      };
    }

    if (targetEditableAmount < editableIndexes.length * 0.01) {
      return {
        installments: values,
        error: `Saldo insuficiente para manter ${editableIndexes.length} parcelas editáveis com valor mínimo.`,
      };
    }

    const sumEditableCurrent = editableIndexes.reduce((sum, index) => sum + values[index].amount, 0);
    const updatedInstallments = [...values];

    if (sumEditableCurrent > 0.01) {
      editableIndexes.forEach((index) => {
        const proportion = values[index].amount / sumEditableCurrent;
        updatedInstallments[index] = {
          ...values[index],
          amount: Math.max(0.01, targetEditableAmount * proportion),
        };
      });
    } else {
      const amountPerInstallment = targetEditableAmount / editableIndexes.length;
      editableIndexes.forEach((index) => {
        updatedInstallments[index] = {
          ...values[index],
          amount: Math.max(0.01, amountPerInstallment),
        };
      });
    }

    const finalSum = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    const finalDiff = totalSalePrice - finalSum;

    if (Math.abs(finalDiff) >= 0.01) {
      const lastEditableIndex = editableIndexes[editableIndexes.length - 1];
      const adjustedLastAmount = updatedInstallments[lastEditableIndex].amount + finalDiff;
      if (adjustedLastAmount < 0.01) {
        return {
          installments: values,
          error: 'Não foi possível redistribuir mantendo os limites mínimos das parcelas.',
        };
      }

      updatedInstallments[lastEditableIndex] = {
        ...updatedInstallments[lastEditableIndex],
        amount: adjustedLastAmount,
      };
    }

    return { installments: updatedInstallments, error: null };
  };

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
    if (isEditMode && hasAnyPaidInstallment) {
      return;
    }

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
        paid_amount: 0,
      });
    }

    form.clearErrors('installments');
    form.setValue('installments', installments);
  };

  const handleAddManualParcel = () => {
    const currentInstallments = form.getValues('installments');
    const nextNumber = currentInstallments.length + 1;
    const salePriceValue = form.getValues('sale_price');

    const withNewInstallment = [
      ...currentInstallments,
      {
        amount: 0.01,
        due_date: addMonths(saleDate || new Date(), nextNumber),
        installment_number: nextNumber,
        paid_amount: 0,
      },
    ];

    const { installments: rebalancedInstallments, error } = rebalanceEditableInstallments(
      withNewInstallment,
      salePriceValue,
    );

    if (error) {
      form.setError('installments', {
        type: 'manual',
        message: error,
      });
      return;
    }

    form.clearErrors('installments');
    form.setValue('installments', rebalancedInstallments);
  };

  const removeInstallmentAndRebalance = (index: number) => {
    const currentInstallments = form.getValues('installments');
    const salePriceValue = form.getValues('sale_price');
    
    if (currentInstallments.length <= 1) {
      // Não permite remover se só há uma parcela
      return;
    }

    const removedInstallment = currentInstallments[index];
    
    // Remove a parcela da lista
    const remainingInstallments = currentInstallments.filter((_, i) => i !== index);
    
    // Recalcula os números das parcelas
    const renumberedInstallments = remainingInstallments.map((inst, i) => ({
      ...inst,
      installment_number: i + 1,
    }));

    const { installments: rebalancedInstallments, error } = rebalanceEditableInstallments(
      renumberedInstallments,
      salePriceValue,
    );

    if (error) {
      form.setError('installments', {
        type: 'manual',
        message: error,
      });
      return;
    }

    if (removedInstallment.original_id) {
      setEditPaidInstallmentIds((prev) => prev.filter((id) => id !== removedInstallment.original_id));
    }

    form.clearErrors('installments');
    form.setValue('installments', rebalancedInstallments);
  };

  const handleRemoveInstallment = (index: number) => {
    const currentInstallments = form.getValues('installments');
    const installment = currentInstallments[index];
    if (!installment) return;

    const isPaid = isInstallmentPaid(installment);
    if (isPaid) {
      openPaidInstallmentAdjustmentDialog('delete', index);
      return;
    }

    removeInstallmentAndRebalance(index);
  };

  // Ref para rastrear qual campo está sendo editado
  const editingIndexRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleInstallmentAmountChange = (index: number) => {
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
      const salePriceValue = form.getValues('sale_price');
      
      if (!salePriceValue || salePriceValue <= 0) return;
      
      // Não altera parcelas anteriores e preserva parcelas pagas bloqueadas
      const previousInstallments = currentInstallments.slice(0, index);
      const sumOfPrevious = previousInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      const changedAmount = currentInstallments[index].amount;

      const lockedIndexes = getLockedInstallmentIndexes(currentInstallments, { ignoreIndex: index });
      const nextIndexes = currentInstallments
        .map((_, i) => i)
        .filter((i) => i > index);
      const lockedNextIndexes = nextIndexes.filter((i) => lockedIndexes.has(i));
      const editableNextIndexes = nextIndexes.filter((i) => !lockedIndexes.has(i));
      const lockedNextSum = lockedNextIndexes.reduce(
        (sum, i) => sum + currentInstallments[i].amount,
        0,
      );

      const remainingForNextEditable = salePriceValue - sumOfPrevious - changedAmount - lockedNextSum;

      if (remainingForNextEditable < 0) {
        form.setError(`installments.${index}.amount`, {
          type: 'manual',
          message: `Valor excede o saldo disponível (máx: R$ ${(salePriceValue - sumOfPrevious - lockedNextSum).toFixed(2)})`,
        });
        return;
      }

      if (editableNextIndexes.length === 0) {
        const lockedAndPreviousSum = sumOfPrevious + changedAmount + lockedNextSum;
        if (Math.abs(lockedAndPreviousSum - salePriceValue) < 0.01) {
          form.clearErrors(`installments.${index}.amount`);
          return;
        }

        form.setError(`installments.${index}.amount`, {
          type: 'manual',
          message: `Valor deve totalizar R$ ${salePriceValue.toFixed(2)} (atual: R$ ${lockedAndPreviousSum.toFixed(2)})`,
        });
        return;
      }

      if (remainingForNextEditable < editableNextIndexes.length * 0.01) {
        form.setError(`installments.${index}.amount`, {
          type: 'manual',
          message: `Saldo insuficiente para ${editableNextIndexes.length} parcelas editáveis posteriores`,
        });
        return;
      }

      const sumOfEditableNext = editableNextIndexes.reduce(
        (sum, i) => sum + currentInstallments[i].amount,
        0,
      );
      const updatedInstallments = [...currentInstallments];

      if (sumOfEditableNext > 0.01) {
        editableNextIndexes.forEach((i) => {
          const proportion = currentInstallments[i].amount / sumOfEditableNext;
          const newAmount = remainingForNextEditable * proportion;
          updatedInstallments[i] = {
            ...currentInstallments[i],
            amount: Math.max(0.01, newAmount),
          };
        });
      } else {
        const amountPerNext = remainingForNextEditable / editableNextIndexes.length;
        editableNextIndexes.forEach((i) => {
          updatedInstallments[i] = {
            ...currentInstallments[i],
            amount: Math.max(0.01, amountPerNext),
          };
        });
      }

      const finalSum = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      const finalDiff = salePriceValue - finalSum;

      if (Math.abs(finalDiff) >= 0.01) {
        const lastEditableNextIndex = editableNextIndexes[editableNextIndexes.length - 1];
        const adjustedLastAmount = updatedInstallments[lastEditableNextIndex].amount + finalDiff;
        if (adjustedLastAmount < 0.01) {
          form.setError(`installments.${index}.amount`, {
            type: 'manual',
            message: 'Não foi possível redistribuir mantendo os limites mínimos.',
          });
          return;
        }
        updatedInstallments[lastEditableNextIndex] = {
          ...updatedInstallments[lastEditableNextIndex],
          amount: adjustedLastAmount,
        };
      }
      
      form.clearErrors('installments');
      form.clearErrors(`installments.${index}.amount`);
      form.setValue('installments', updatedInstallments);
    }, 100);
  };

  const openPaidInstallmentAdjustmentDialog = (type: 'edit' | 'delete', index: number) => {
    const installment = form.getValues('installments')[index];
    if (!installment) return;

    setPendingAdjustment({
      type,
      index,
      installmentNumber: installment.installment_number,
      originalId: installment.original_id,
    });
    setAdjustmentConfirmText('');
    setAdjustmentDialogOpen(true);
  };

  const confirmPaidInstallmentAdjustment = () => {
    if (!pendingAdjustment) return;

    if (pendingAdjustment.type === 'edit') {
      const { originalId } = pendingAdjustment;
      if (originalId) {
        setEditPaidInstallmentIds((prev) =>
          prev.includes(originalId)
            ? prev
            : [...prev, originalId],
        );
      }
    } else {
      removeInstallmentAndRebalance(pendingAdjustment.index);
    }

    setAdjustmentDialogOpen(false);
    setAdjustmentConfirmText('');
    setPendingAdjustment(null);
  };

  const onSubmit = async (data: SaleFormData) => {
    try {
      let buyerId = data.buyer_id;
      const getInstallmentStatus = (paidAmount: number, amount: number) => {
        if (amount <= 0 || paidAmount >= amount) return 'paid';
        if (paidAmount > 0) return 'partial';
        return 'pending';
      };

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
              cep: buyerData.cep || null,
              address: buyerData.address || null,
              address_number: buyerData.address_number || null,
              address_complement: buyerData.address_complement || null,
              neighborhood: buyerData.neighborhood || null,
              city: buyerData.city || null,
              state: buyerData.state || null,
              address_reference: buyerData.address_reference || null,
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
        const originalInstallmentById = new Map(sale.installments.map((inst) => [inst.id, inst]));

        if (isFullyPaidSale) {
          if (Math.abs(data.sale_price - sale.sale_price) >= 0.01) {
            form.setError('sale_price', {
              type: 'manual',
              message: 'Venda quitada não permite alterar o valor total.',
            });
            return;
          }

          if (data.payment_mode !== sale.payment_mode) {
            form.setError('installments', {
              type: 'manual',
              message: 'Venda quitada não permite alterar a forma de pagamento.',
            });
            return;
          }

          const hasInstallmentChange =
            data.installments.length !== sale.installments.length ||
            data.installments.some((installment) => {
              if (!installment.original_id) return true;
              const originalInstallment = originalInstallmentById.get(installment.original_id);
              if (!originalInstallment) return true;

              const dueDate = installment.due_date ? format(installment.due_date, 'yyyy-MM-dd') : null;
              const originalDueDate = originalInstallment.due_date || null;

              return (
                Math.abs(installment.amount - originalInstallment.amount) >= 0.01 ||
                dueDate !== originalDueDate ||
                installment.installment_number !== originalInstallment.installment_number
              );
            });

          if (hasInstallmentChange) {
            form.setError('installments', {
              type: 'manual',
              message: 'Venda quitada não permite alterar parcelas.',
            });
            return;
          }
        }

        for (let i = 0; i < data.installments.length; i++) {
          const installment = data.installments[i];
          if (!installment.original_id) continue;
          const originalInstallment = originalInstallmentById.get(installment.original_id);
          if (!originalInstallment) continue;

          if (
            originalInstallment.paid_amount > 0 &&
            editPaidInstallmentIds.includes(originalInstallment.id) &&
            installment.amount < originalInstallment.paid_amount
          ) {
            form.setError(`installments.${i}.amount`, {
              type: 'manual',
              message: `Valor não pode ser menor que o total já pago (R$ ${originalInstallment.paid_amount.toFixed(2)}).`,
            });
            return;
          }

          if (
            originalInstallment.paid_amount > 0 &&
            !editPaidInstallmentIds.includes(originalInstallment.id)
          ) {
            form.clearErrors(`installments.${i}.amount`);
          }
        }

        // Modo de edição
        await updateSale.mutateAsync({
          id: sale.id,
          buyer_id: buyerId,
          product_description: data.product_description,
          purchase_price: data.purchase_price || null,
          sale_price: data.sale_price,
          sale_date: format(data.sale_date, 'yyyy-MM-dd'),
          delivery_status: data.delivery_status,
          payment_mode: data.payment_mode,
          notes: data.notes || null,
        });

        const existingInstallments = sale.installments;

        if (data.payment_mode === 'flexible') {
          const switchedFromFixed = sale.payment_mode === 'fixed';
          const totalPaid = existingInstallments.reduce((sum, inst) => sum + inst.paid_amount, 0);
          const remainingBalance = Math.max(0, data.sale_price - totalPaid);

          if (switchedFromFixed) {
            const installmentsWithHistory = existingInstallments.filter((inst) => inst.paid_amount > 0);
            const installmentsWithoutHistory = existingInstallments.filter((inst) => inst.paid_amount <= 0);

            if (installmentsWithoutHistory.length > 0) {
              const { error } = await supabase
                .from('installments')
                .delete()
                .in(
                  'id',
                  installmentsWithoutHistory.map((inst) => inst.id),
                );
              if (error) throw error;
            }

            for (const historicalInstallment of installmentsWithHistory) {
              const settledAmount = historicalInstallment.paid_amount;
              const { error } = await supabase
                .from('installments')
                .update({
                  amount: settledAmount,
                  paid_amount: settledAmount,
                  status: 'paid',
                })
                .eq('id', historicalInstallment.id);
              if (error) throw error;
            }

            if (remainingBalance > 0 || installmentsWithHistory.length === 0) {
              const nextInstallmentNumber =
                installmentsWithHistory.length > 0
                  ? Math.max(...installmentsWithHistory.map((inst) => inst.installment_number)) + 1
                  : 1;

              const { error } = await supabase.from('installments').insert({
                sale_id: sale.id,
                amount: remainingBalance,
                due_date: null,
                status: getInstallmentStatus(0, remainingBalance),
                paid_amount: 0,
                installment_number: nextInstallmentNumber,
              });
              if (error) throw error;
            }
          } else {
            const sortedInstallments = [...existingInstallments].sort(
              (a, b) => b.installment_number - a.installment_number,
            );
            const activeFlexibleInstallment =
              sortedInstallments.find((inst) => inst.amount > inst.paid_amount) ||
              sortedInstallments[0] ||
              null;

            if (!activeFlexibleInstallment) {
              const { error } = await supabase.from('installments').insert({
                sale_id: sale.id,
                amount: remainingBalance,
                due_date: null,
                status: getInstallmentStatus(0, remainingBalance),
                paid_amount: 0,
                installment_number: 1,
              });
              if (error) throw error;
            } else {
              const adjustedAmount = activeFlexibleInstallment.paid_amount + remainingBalance;
              const { error: activeUpdateError } = await supabase
                .from('installments')
                .update({
                  amount: adjustedAmount,
                  due_date: null,
                  status: getInstallmentStatus(activeFlexibleInstallment.paid_amount, adjustedAmount),
                })
                .eq('id', activeFlexibleInstallment.id);
              if (activeUpdateError) throw activeUpdateError;

              const installmentsToFreeze = existingInstallments.filter(
                (inst) => inst.id !== activeFlexibleInstallment.id && inst.amount > inst.paid_amount,
              );

              for (const installmentToFreeze of installmentsToFreeze) {
                const settledAmount = installmentToFreeze.paid_amount;
                const { error } = await supabase
                  .from('installments')
                  .update({
                    amount: settledAmount,
                    paid_amount: settledAmount,
                    status: 'paid',
                  })
                  .eq('id', installmentToFreeze.id);
                if (error) throw error;
              }
            }
          }
        } else {
          // Gerenciar parcelas fixas: atualizar, criar novas e deletar removidas
          const existingIds = existingInstallments.map((inst) => inst.id);

          // Mapear parcelas do formulário para IDs existentes (prioriza original_id)
          const formToExistingMap = new Map<string, string>();
          data.installments.forEach((formInst) => {
            const existing = formInst.original_id
              ? existingInstallments.find((e) => e.id === formInst.original_id)
              : existingInstallments.find((e) => e.installment_number === formInst.installment_number);
            if (existing) {
              const formKey = formInst.original_id || formInst.installment_number.toString();
              formToExistingMap.set(formKey, existing.id);
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
            const formKey = inst.original_id || inst.installment_number.toString();
            const existingId = formToExistingMap.get(formKey);
            const existingInst = existingId
              ? existingInstallments.find((e) => e.id === existingId)
              : null;

            if (existingInst) {
              const isProtectedPaidInstallment =
                existingInst.paid_amount > 0 && !editPaidInstallmentIds.includes(existingInst.id);
              const amountToPersist = isProtectedPaidInstallment ? existingInst.amount : inst.amount;
              const dueDateToPersist = isProtectedPaidInstallment
                ? existingInst.due_date
                : inst.due_date
                ? format(inst.due_date, 'yyyy-MM-dd')
                : null;

              // Atualizar parcela existente (preservar paid_amount e status)
              const { error } = await supabase
                .from('installments')
                .update({
                  amount: amountToPersist,
                  due_date: dueDateToPersist,
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
                due_date: inst.due_date ? format(inst.due_date, 'yyyy-MM-dd') : null,
                status: 'pending',
                paid_amount: 0,
                installment_number: inst.installment_number,
              });
              if (error) throw error;
            }
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

        // Preparar installments baseado no modo de pagamento
        let installmentsData;
        if (data.payment_mode === 'flexible') {
          // Modo flexível: criar 1 installment virtual
          installmentsData = [{
            amount: data.sale_price,
            due_date: format(data.sale_date, 'yyyy-MM-dd'),
            status: 'pending' as const,
            paid_amount: 0,
            installment_number: 1,
          }];
        } else {
          // Modo fixo: usar parcelas do formulário
          installmentsData = data.installments.map((inst) => ({
            amount: inst.amount,
            due_date: inst.due_date ? format(inst.due_date, 'yyyy-MM-dd') : null,
            status: 'pending' as const,
            paid_amount: 0,
            installment_number: inst.installment_number,
          }));
        }

        await createSale.mutateAsync({
          sale: {
            buyer_id: buyerId,
            product_description: data.product_description,
            purchase_price: data.purchase_price || null,
            sale_price: data.sale_price,
            sale_date: format(data.sale_date, 'yyyy-MM-dd'),
            delivery_status: data.delivery_status,
            payment_mode: data.payment_mode,
            notes: data.notes || null,
          },
          installments: installmentsData,
        });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar as alterações da venda.');
    }
  };

  const isSubmitting = createSale.isPending || updateSale.isPending;

  return (
    <div className="space-y-6 sm:space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
          <Card className="border-border/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Comprador</CardTitle>
              <CardDescription>Selecione um comprador para vincular a venda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  control={form.control}
                  name="buyer_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:col-span-2">
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

              {showBuyerForm && (
                <div className="border border-border/70 rounded-2xl p-5 space-y-5 bg-input">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Novo Comprador
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Preencha os dados do comprador antes de criar a venda.
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
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

                      <Separator className="my-5 border-border/60" />

                      <div className="space-y-1.5">
                        <h3 className="text-sm font-semibold text-foreground">Dados de Endereço</h3>
                        <p className="text-xs text-muted-foreground">Preencha os dados de endereço do comprador.</p>
                      </div>

                      <FormField
                        control={buyerForm.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <CEPInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                onAddressFound={handleAddressFound}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={buyerForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="space-y-2 sm:col-span-2">
                              <FormLabel>Logradouro</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Rua, Avenida, etc." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={buyerForm.control}
                          name="address_number"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="123" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={buyerForm.control}
                        name="address_complement"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apto, Bloco, Sala, etc." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={buyerForm.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome do bairro" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={buyerForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome da cidade" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={buyerForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Estado (UF)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o estado" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BRAZILIAN_STATES.map((state) => (
                                    <SelectItem key={state.value} value={state.value}>
                                      {state.label} ({state.value})
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
                        control={buyerForm.control}
                        name="address_reference"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Referência</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ponto de referência para entregas" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">Dados do Produto</CardTitle>
              <CardDescription>Preencha os dados da venda e condições de pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Selecione uma data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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

              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Custo do produto</FormLabel>
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
                          disabled={isFullyPaidSale}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

              <div className="space-y-4 pt-2 border-t border-border/70">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Pagamento</h3>
                  <Tabs
                    value={paymentMode}
                    onValueChange={(v) => {
                      if (isFullyPaidSale) return;
                      const mode = v as 'fixed' | 'flexible';
                      setPaymentMode(mode);
                      form.setValue('payment_mode', mode);

                      if (mode === 'flexible') {
                        form.setValue('installments', []);
                      }
                    }}
                  >
                    <TabsList>
                      <TabsTrigger value="fixed" disabled={isFullyPaidSale}>
                        Parcelamento Fixo
                      </TabsTrigger>
                      <TabsTrigger value="flexible" disabled={isFullyPaidSale}>
                        Pagamento Flexível
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {isFullyPaidSale && (
                  <Alert>
                    <AlertDescription>
                      Esta venda já está totalmente paga. As parcelas e a forma de pagamento não podem ser alteradas.
                    </AlertDescription>
                  </Alert>
                )}

                {!isFullyPaidSale && hasAnyPaidInstallment && paymentMode === 'fixed' && (
                  <Alert>
                    <AlertDescription>
                      Parcelas com histórico de pagamento ficam protegidas. Para alterar ou excluir uma parcela paga, use o fluxo de ajuste com confirmação forte.
                    </AlertDescription>
                  </Alert>
                )}

                {paymentMode === 'flexible' ? (
                  <div className="border border-border/70 rounded-2xl p-4 bg-input">
                    <h4 className="font-semibold text-sm mb-2">Modo Flexível Ativo</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cliente pagará valores variáveis em datas livres. Os pagamentos serão registrados após a criação da venda.
                    </p>
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">Total a receber: </span>
                      <span className="text-lg font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(salePrice || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Parcelas</h3>
                      <Tabs value={parcelMode} onValueChange={(v) => setParcelMode(v as 'auto' | 'manual')}>
                        <TabsList>
                          <TabsTrigger value="auto" disabled={isFullyPaidSale || (isEditMode && hasAnyPaidInstallment)}>
                            Automático
                          </TabsTrigger>
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
                              disabled={isFullyPaidSale || (isEditMode && hasAnyPaidInstallment)}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleAutoSplit}
                            className="w-full sm:w-auto"
                            disabled={isFullyPaidSale || (isEditMode && hasAnyPaidInstallment)}
                          >
                            Gerar Parcelas
                          </Button>
                        </div>
                        {isEditMode && hasAnyPaidInstallment && (
                          <p className="text-xs text-muted-foreground">
                            O modo automático foi bloqueado porque há parcelas com pagamento registrado.
                          </p>
                        )}
                        {fields.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {fields.length} parcela(s) cadastrada(s) - Total:{' '}
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              installments.reduce((sum, inst) => sum + inst.amount, 0),
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          onClick={handleAddManualParcel}
                          variant="outline"
                          disabled={isFullyPaidSale}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Parcela
                        </Button>
                        {fields.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {fields.length} parcela(s) cadastrada(s) - Total:{' '}
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              installments.reduce((sum, inst) => sum + inst.amount, 0),
                            )}{' '}
                            /{' '}
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(salePrice)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {fields.map((field, index) => {
                        const installmentData = installments[index];
                        const installmentPaid = installmentData ? isInstallmentPaid(installmentData) : false;
                        const installmentEditable = installmentData
                          ? isPaidInstallmentEditable(installmentData)
                          : true;
                        const disableInstallment = isFullyPaidSale || (installmentPaid && !installmentEditable);

                        return (
                          <div key={field.id} className="flex gap-3 items-end p-5 border border-border/70 rounded-2xl bg-input">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-sm font-medium">
                                  Parcela {installmentData?.installment_number || index + 1}
                                </div>
                                {installmentPaid && (
                                  <Badge className="bg-green-600 text-white">Pago</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <FormField
                                  control={form.control}
                                  name={`installments.${index}.amount`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel>Valor</FormLabel>
                                      <FormControl>
                                        <CurrencyInput
                                          value={field.value}
                                          disabled={disableInstallment}
                                          onChange={(newValue) => {
                                            field.onChange(newValue);
                                            handleInstallmentAmountChange(index);
                                          }}
                                          onBlur={() => {
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
                                        <PopoverTrigger asChild disabled={disableInstallment}>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              disabled={disableInstallment}
                                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                            >
                                              {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Selecione uma data</span>}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value || undefined}
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
                              {installmentPaid && !installmentEditable && !isFullyPaidSale && (
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPaidInstallmentAdjustmentDialog('edit', index)}
                                  >
                                    Ajustar
                                  </Button>
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveInstallment(index)}
                              disabled={isFullyPaidSale || fields.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    {typeof form.formState.errors.installments?.message === 'string' && (
                      <p className="text-sm text-destructive">{form.formState.errors.installments.message}</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-1">
          {isEditMode ? (
            <>
              <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting}>
                Cancelar Edição
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                ? 'Salvando...'
                : 'Salvar Alterações'}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {createSale.isPending ? 'Salvando...' : 'Criar Venda'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>

    <Dialog
      open={adjustmentDialogOpen}
      onOpenChange={(open) => {
        setAdjustmentDialogOpen(open);
        if (!open) {
          setPendingAdjustment(null);
          setAdjustmentConfirmText('');
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirmar ajuste de parcela paga</DialogTitle>
          <DialogDescription>
            {pendingAdjustment?.type === 'delete'
              ? `Você está prestes a excluir a parcela ${pendingAdjustment?.installmentNumber}, que possui pagamento registrado. Esta ação vai redistribuir o saldo restante entre as parcelas editáveis.`
              : `Você está prestes a liberar a parcela ${pendingAdjustment?.installmentNumber} para edição manual, mesmo com pagamento registrado.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Para confirmar, digite <span className="font-semibold">AJUSTAR</span>.
          </p>
          <Input
            id="adjustment-confirmation"
            name="adjustment-confirmation"
            value={adjustmentConfirmText}
            onChange={(event) => setAdjustmentConfirmText(event.target.value)}
            placeholder="Digite AJUSTAR"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAdjustmentDialogOpen(false);
              setPendingAdjustment(null);
              setAdjustmentConfirmText('');
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={confirmPaidInstallmentAdjustment}
            disabled={adjustmentConfirmText.trim().toUpperCase() !== 'AJUSTAR'}
          >
            Confirmar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}
