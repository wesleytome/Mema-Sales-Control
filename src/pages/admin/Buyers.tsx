// Página de compradores
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBuyers, useCreateBuyer, useUpdateBuyer, useDeleteBuyer } from '@/hooks/useBuyers';
import { Button } from '@/components/ui/button';
import { FilterableTable, type FilterableColumn } from '@/components/ui/filterable-table';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { CPFInput, validateCPF } from '@/components/ui/cpf-input';
import { CEPInput } from '@/components/ui/cep-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Pencil, Trash2, Eye, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Buyer } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BRAZILIAN_STATES } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

// Funções auxiliares para formatação
const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length < 10) return phone;
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

type BuyerFormData = z.infer<typeof buyerSchema>;

export function Buyers() {
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const { data: buyers, isLoading } = useBuyers();
  const createBuyer = useCreateBuyer();
  const updateBuyer = useUpdateBuyer();
  const deleteBuyer = useDeleteBuyer();

  // Verificar se há um buyerId no state para abrir o dialog de edição
  useEffect(() => {
    const editBuyerId = (location.state as any)?.editBuyerId;
    if (editBuyerId && buyers) {
      const buyer = buyers.find((b) => b.id === editBuyerId);
      if (buyer) {
        setEditingBuyer(buyer);
        form.reset({
          name: buyer.name,
          phone: buyer.phone || '',
          email: buyer.email || '',
          cpf: buyer.cpf || '',
          cep: buyer.cep || '',
          address: buyer.address || '',
          address_number: buyer.address_number || '',
          address_complement: buyer.address_complement || '',
          neighborhood: buyer.neighborhood || '',
          city: buyer.city || '',
          state: buyer.state || '',
          address_reference: buyer.address_reference || '',
        });
        setIsDialogOpen(true);
        // Limpar o state
        window.history.replaceState({}, document.title);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, buyers]);

  const form = useForm<BuyerFormData>({
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

  const handleOpenDialog = (buyer?: Buyer) => {
    if (buyer) {
      setEditingBuyer(buyer);
      form.reset({
        name: buyer.name,
        phone: buyer.phone || '',
        email: buyer.email || '',
        cpf: buyer.cpf || '',
        cep: buyer.cep || '',
        address: buyer.address || '',
        address_number: buyer.address_number || '',
        address_complement: buyer.address_complement || '',
        neighborhood: buyer.neighborhood || '',
        city: buyer.city || '',
        state: buyer.state || '',
        address_reference: buyer.address_reference || '',
      });
    } else {
      setEditingBuyer(null);
      form.reset({
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
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBuyer(null);
    form.reset();
  };

  const handleAddressFound = (address: {
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
    complemento?: string;
  }) => {
    form.setValue('address', address.logradouro);
    form.setValue('neighborhood', address.bairro);
    form.setValue('city', address.cidade);
    form.setValue('state', address.estado);
    if (address.complemento) {
      form.setValue('address_complement', address.complemento);
    }
  };

  const onSubmit = async (data: BuyerFormData) => {
    try {
      if (editingBuyer) {
        await updateBuyer.mutateAsync({
          id: editingBuyer.id,
          ...data,
          phone: data.phone || null,
          email: data.email || null,
          cpf: data.cpf || null,
          cep: data.cep || null,
          address: data.address || null,
          address_number: data.address_number || null,
          address_complement: data.address_complement || null,
          neighborhood: data.neighborhood || null,
          city: data.city || null,
          state: data.state || null,
          address_reference: data.address_reference || null,
        });
      } else {
        await createBuyer.mutateAsync({
          ...data,
          phone: data.phone || null,
          email: data.email || null,
          cpf: data.cpf || null,
          cep: data.cep || null,
          address: data.address || null,
          address_number: data.address_number || null,
          address_complement: data.address_complement || null,
          neighborhood: data.neighborhood || null,
          city: data.city || null,
          state: data.state || null,
          address_reference: data.address_reference || null,
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBuyer.mutateAsync(id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="icon-chip bg-violet-100 text-violet-600 dark:bg-violet-900/40 mt-0.5 hidden sm:flex">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Compradores</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie seus compradores</p>
          </div>
        </div>
        <ResponsiveDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          trigger={
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Comprador
            </Button>
          }
          title={editingBuyer ? 'Editar Comprador' : 'Novo Comprador'}
          description={
            editingBuyer
              ? 'Atualize as informações do comprador'
              : 'Adicione um novo comprador ao sistema'
          }
          className="space-y-6"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

              <Separator className="my-4" />

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Dados de Endereço</h3>
                <p className="text-xs text-muted-foreground">Preencha os dados de endereço do comprador</p>
              </div>

              <FormField
                control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
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

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createBuyer.isPending || updateBuyer.isPending}>
                  {editingBuyer ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </ResponsiveDialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <FilterableTable
          data={buyers || []}
          columns={[
            {
              id: 'name',
              header: 'Nome',
              accessor: 'name',
              filterable: true,
              defaultVisible: true,
              className: 'hidden', // Ocultar no card mobile, já que está no título
            },
            {
              id: 'cpf',
              header: 'CPF',
              accessor: (buyer) => (buyer.cpf ? formatCPF(buyer.cpf) : '-'),
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'phone',
              header: 'Telefone',
              accessor: (buyer) => (buyer.phone ? formatPhone(buyer.phone) : '-'),
              filterable: true,
              defaultVisible: true,
            },
            {
              id: 'email',
              header: 'Email',
              accessor: (buyer) => buyer.email || '-',
              filterable: true,
              defaultVisible: true,
            },
          ] as FilterableColumn<Buyer>[]}
          keyExtractor={(buyer) => buyer.id}
          emptyMessage="Nenhum comprador cadastrado"
          searchPlaceholder="Buscar compradores..."
          mobileCardTitle={(buyer) => buyer.name}
          mobileCardSubtitle={() => null}
          actions={(buyer) => (
            <>
              <Button variant="default" size="sm" asChild>
                <Link to={`/compradores/${buyer.id}`}>
                  <Eye className="h-4 w-4" />
                  Visualizar
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleOpenDialog(buyer)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 text-white" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir {buyer.name}? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(buyer.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        />
      )}
    </div>
  );
}

