import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSale } from '@/hooks/useSales';
import { useCreatePayment, usePaymentsBySale, useUpdatePayment } from '@/hooks/usePayments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Copy,
  Calendar,
  DollarSign,
  Hash,
  User,
  Package,
  Pencil,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Banknote,
  CalendarIcon,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INSTALLMENT_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { FlexiblePaymentSection } from '@/components/sales/FlexiblePaymentSection';
import type { Installment, Payment } from '@/types';

export function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id || '');
  const { data: payments } = usePaymentsBySale(id || '');
  const isMobile = useIsMobile();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();

  const [showInstallments, setShowInstallments] = useState(false);
  const [sellerPaymentOpen, setSellerPaymentOpen] = useState(false);
  const [sellerPaymentAmount, setSellerPaymentAmount] = useState<number>(0);
  const [sellerPaymentTarget, setSellerPaymentTarget] = useState<Installment | null>(null);
  const [sellerPaymentDate, setSellerPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const publicLink = `${window.location.origin}/customer/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success('Link copiado para a área de transferência!');
  };

  const totalPaid = useMemo(
    () => sale?.installments.reduce((sum, inst) => sum + inst.paid_amount, 0) || 0,
    [sale]
  );
  const totalPending = useMemo(
    () => (sale ? sale.sale_price - totalPaid : 0),
    [sale, totalPaid]
  );
  const profit = useMemo(
    () => (sale?.purchase_price ? sale.sale_price - sale.purchase_price : null),
    [sale]
  );

  const nextPendingInstallment = useMemo(() => {
    if (!sale) return null;
    return sale.installments.find((inst) => inst.status !== 'paid') || null;
  }, [sale]);

  const flexibleInstallment = useMemo(() => {
    if (!sale || sale.payment_mode !== 'flexible') return null;

    const sortedInstallments = [...sale.installments].sort(
      (a, b) => b.installment_number - a.installment_number,
    );

    return sortedInstallments.find((inst) => inst.status !== 'paid') || sortedInstallments[0] || null;
  }, [sale]);

  const handleOpenSellerPayment = (installment: Installment) => {
    const remaining = installment.amount - installment.paid_amount;
    setSellerPaymentTarget(installment);
    setSellerPaymentAmount(remaining);
    setSellerPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setSellerPaymentOpen(true);
  };

  const handleOpenSellerPaymentFlexible = () => {
    if (!sale) return;
    const inst = flexibleInstallment;
    if (!inst) return;
    setSellerPaymentTarget(inst);
    setSellerPaymentAmount(totalPending);
    setSellerPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setSellerPaymentOpen(true);
  };

  const handleConfirmSellerPayment = async () => {
    if (!sellerPaymentTarget || sellerPaymentAmount <= 0) return;
    setSubmittingPayment(true);
    try {
      await createPayment.mutateAsync({
        installment_id: sellerPaymentTarget.id,
        amount: sellerPaymentAmount,
        proof_url: null,
        status: 'approved',
        origin: 'seller',
        payment_date: sellerPaymentDate,
        rejection_reason: null,
      });
      setSellerPaymentOpen(false);
      setSellerPaymentTarget(null);
      toast.success('Pagamento registrado com sucesso!');
    } catch {
      toast.error('Erro ao registrar pagamento');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Venda não encontrada</p>
        <Button asChild className="mt-4">
          <Link to="/vendas">Voltar para Vendas</Link>
        </Button>
      </div>
    );
  }

  const isQuitada = totalPending <= 0;

  const renderInstallmentCard = (installment: Installment) => {
    const remaining = installment.amount - installment.paid_amount;
    return (
      <Card key={installment.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {installment.installment_number}
              </div>
              <span className="font-medium">Parcela {installment.installment_number}</span>
            </div>
            <Badge
              className={
                installment.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : installment.status === 'late'
                  ? 'bg-red-100 text-red-800'
                  : installment.status === 'partial'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {INSTALLMENT_STATUS_OPTIONS.find((opt) => opt.value === installment.status)?.label}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Valor:</span>
              <p className="font-medium">{formatBRL(installment.amount)}</p>
            </div>
            <div>
              <span className="text-gray-500">Pago:</span>
              <p className="font-medium text-green-600">{formatBRL(installment.paid_amount)}</p>
            </div>
            {installment.due_date && (
              <div className="col-span-2">
                <span className="text-gray-500">Vencimento:</span>
                <p className="font-medium">
                  {format(new Date(installment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
          {remaining > 0 && installment.status !== 'paid' && (
            <Button
              className="w-full mt-3"
              size="sm"
              onClick={() => handleOpenSellerPayment(installment)}
            >
              <Banknote className="mr-2 h-4 w-4" />
              Já Recebi
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/vendas">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">Voltar</span>
            </Link>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">Detalhes da Venda</h1>
              {isQuitada && <Badge className="bg-green-600 text-white">Quitada</Badge>}
            </div>
            <p className="text-sm sm:text-base text-gray-600 mt-1 flex items-center gap-2">
              <Package className="h-4 w-4" />
              {sale.product_description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleCopyLink} className="w-full sm:w-auto">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Link Público
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/vendas/${id}/editar`)}
              className="w-full sm:w-auto"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar Venda
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor de Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold">{formatBRL(sale.sale_price)}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {formatBRL(totalPaid)}
              </div>
            </CardContent>
          </Card>

          <Card className={totalPending > 0 ? 'border-orange-200 bg-orange-50/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-600" />
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {formatBRL(totalPending)}
              </div>
            </CardContent>
          </Card>
        </div>

        {(sale.purchase_price || profit !== null) && (
          <div
            className={`grid gap-3 sm:gap-4 ${
              sale.purchase_price && profit !== null ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {sale.purchase_price && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Custo do produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {formatBRL(sale.purchase_price)}
                  </div>
                </CardContent>
              </Card>
            )}

            {profit !== null && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <DollarSign
                      className={`h-4 w-4 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    />
                    Lucro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-xl sm:text-2xl font-bold ${
                      profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatBRL(profit)}
                  </div>
                  {sale.purchase_price && sale.purchase_price > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Margem: {((profit / sale.purchase_price) * 100).toFixed(1)}%
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Comprador</p>
                <p className="font-medium">{sale.buyer?.name || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Data da Venda</p>
                <p className="font-medium">
                  {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Status de Entrega</p>
                <Badge
                  className={
                    sale.delivery_status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : sale.delivery_status === 'sent'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {DELIVERY_STATUS_OPTIONS.find((opt) => opt.value === sale.delivery_status)
                    ?.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Modo de Pagamento</p>
                <Badge className={sale.payment_mode === 'flexible' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}>
                  {sale.payment_mode === 'flexible' ? 'Flexível' : 'Parcelamento Fixo'}
                </Badge>
              </div>
            </div>
            {sale.notes && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Observações</p>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Link Público</CardTitle>
            <CardDescription>
              Compartilhe este link com o comprador para envio de comprovantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 rounded-md break-all text-sm font-mono">
              {publicLink}
            </div>
            <Button variant="outline" onClick={handleCopyLink} className="w-full mt-3">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Link
            </Button>
          </CardContent>
        </Card>
      </div>

      {!isQuitada && sale.payment_mode === 'fixed' && nextPendingInstallment && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Próxima Parcela
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Parcela {nextPendingInstallment.installment_number}
                  </span>
                  <Badge
                    className={
                      nextPendingInstallment.status === 'late'
                        ? 'bg-red-100 text-red-800'
                        : nextPendingInstallment.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {INSTALLMENT_STATUS_OPTIONS.find(
                      (o) => o.value === nextPendingInstallment.status
                    )?.label}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">
                  {formatBRL(
                    nextPendingInstallment.amount - nextPendingInstallment.paid_amount
                  )}
                </p>
                {nextPendingInstallment.due_date && (
                  <p className="text-sm text-gray-500">
                    Vencimento:{' '}
                    {format(new Date(nextPendingInstallment.due_date), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>
              <Button
                size="lg"
                className="h-12"
                onClick={() => handleOpenSellerPayment(nextPendingInstallment)}
              >
                <Banknote className="mr-2 h-5 w-5" />
                Já Recebi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isQuitada && sale.payment_mode === 'flexible' && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Registrar Recebimento
            </CardTitle>
            <CardDescription>
              Registre um valor recebido do cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Saldo pendente</p>
                <p className="text-2xl font-bold text-orange-600">{formatBRL(totalPending)}</p>
              </div>
              <Button
                size="lg"
                className="h-12"
                onClick={handleOpenSellerPaymentFlexible}
              >
                <Banknote className="mr-2 h-5 w-5" />
                Já Recebi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sale.payment_mode === 'flexible' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pagamento Flexível
                </CardTitle>
                <CardDescription>
                  Cliente paga valores variáveis em datas livres
                </CardDescription>
              </div>
              <Badge className="bg-blue-600">FLEXÍVEL</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {flexibleInstallment ? (
              <FlexiblePaymentSection installment={flexibleInstallment} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma parcela disponível para o modo flexível.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <Button
            variant="ghost"
            className="w-full text-sm text-gray-500 mb-2"
            onClick={() => setShowInstallments(!showInstallments)}
          >
            {showInstallments ? (
              <ChevronUp className="mr-2 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-2 h-4 w-4" />
            )}
            {showInstallments ? 'Ocultar parcelas' : 'Ver detalhes das parcelas'} ({sale.installments.length})
          </Button>
          {showInstallments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Parcelas
                </CardTitle>
                <CardDescription>
                  {sale.installments.length} parcela(s) cadastrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-3">
                    {sale.installments.map(renderInstallmentCard)}
                  </div>
                ) : (
                  <ResponsiveTable
                    data={sale.installments}
                    columns={[
                      {
                        header: '#',
                        accessor: 'installment_number',
                      },
                      {
                        header: 'Valor',
                        accessor: (inst: Installment) => formatBRL(inst.amount),
                      },
                      {
                        header: 'Pago',
                        accessor: (inst: Installment) => (
                          <span className="text-green-600">{formatBRL(inst.paid_amount)}</span>
                        ),
                      },
                      {
                        header: 'Vencimento',
                        accessor: (inst: Installment) =>
                          inst.due_date
                            ? format(new Date(inst.due_date), 'dd/MM/yyyy', { locale: ptBR })
                            : '-',
                      },
                      {
                        header: 'Status',
                        accessor: (inst: Installment) => (
                          <Badge
                            className={
                              inst.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : inst.status === 'late'
                                ? 'bg-red-100 text-red-800'
                                : inst.status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {INSTALLMENT_STATUS_OPTIONS.find(
                              (opt) => opt.value === inst.status
                            )?.label}
                          </Badge>
                        ),
                      },
                      {
                        header: '',
                        accessor: (inst: Installment) => {
                          const remaining = inst.amount - inst.paid_amount;
                          if (remaining <= 0 || inst.status === 'paid') return null;
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenSellerPayment(inst)}
                            >
                              <Banknote className="mr-1 h-3 w-3" />
                              Já Recebi
                            </Button>
                          );
                        },
                      },
                    ]}
                    keyExtractor={(inst: Installment) => inst.id}
                    emptyMessage="Nenhuma parcela cadastrada"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {payments && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pagamentos Informados
            </CardTitle>
            <CardDescription>
              {payments.filter((p: Payment) => p.status === 'pending').length} pagamento(s) aguardando confirmação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment: Payment) => (
                <div
                  key={payment.id}
                  className={`p-4 rounded-lg border ${
                    payment.status === 'pending'
                      ? 'border-yellow-200 bg-yellow-50/50'
                      : payment.status === 'approved'
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg">{formatBRL(payment.amount)}</span>
                        <Badge
                          className={
                            payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : payment.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {payment.status === 'pending'
                            ? 'Aguardando'
                            : payment.status === 'approved'
                            ? 'Aprovado'
                            : 'Rejeitado'}
                        </Badge>
                        {payment.origin === 'buyer' && (
                          <Badge className="bg-blue-100 text-blue-800">Comprador</Badge>
                        )}
                        {payment.origin === 'seller' && (
                          <Badge className="bg-purple-100 text-purple-800">Vendedor</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {payment.payment_date
                            ? format(new Date(payment.payment_date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                            : format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      {payment.proof_url && (
                        <a
                          href={payment.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                        >
                          <Eye className="h-3 w-3" />
                          Ver comprovante
                        </a>
                      )}
                      {payment.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Motivo: {payment.rejection_reason}
                        </p>
                      )}
                    </div>

                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="lg"
                          className="h-12 flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            updatePayment.mutate({
                              id: payment.id,
                              status: 'approved',
                            })
                          }
                        >
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Aprovar
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-12 flex-1 sm:flex-none border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() =>
                            updatePayment.mutate({
                              id: payment.id,
                              status: 'rejected',
                              rejection_reason: 'Rejeitado pelo vendedor',
                            })
                          }
                        >
                          <XCircle className="mr-2 h-5 w-5" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ResponsiveDialog
        open={sellerPaymentOpen}
        onOpenChange={setSellerPaymentOpen}
        title="Confirmar Recebimento"
        description="Informe o valor que você recebeu"
      >
        <div className="space-y-4 pt-4">
          {sellerPaymentTarget && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Recebido</label>
                <CurrencyInput
                  value={sellerPaymentAmount}
                  onChange={(value) => setSellerPaymentAmount(value)}
                />
                <p className="text-sm text-gray-500">
                  Saldo restante:{' '}
                  {formatBRL(
                    sale.payment_mode === 'flexible'
                      ? totalPending
                      : sellerPaymentTarget.amount - sellerPaymentTarget.paid_amount
                  )}
                </p>
                {sellerPaymentAmount > 0 && (
                  <div className="text-sm p-2 bg-green-50 text-green-700 rounded">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Saldo após recebimento:{' '}
                    {formatBRL(
                      (sale.payment_mode === 'flexible'
                        ? totalPending
                        : sellerPaymentTarget.amount - sellerPaymentTarget.paid_amount) -
                        sellerPaymentAmount
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Data do recebimento
                </label>
                <Input
                  type="date"
                  value={sellerPaymentDate}
                  onChange={(e) => setSellerPaymentDate(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSellerPaymentOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSellerPayment}
                  disabled={
                    submittingPayment ||
                    sellerPaymentAmount <= 0 ||
                    sellerPaymentAmount >
                      (sale.payment_mode === 'flexible'
                        ? totalPending
                        : sellerPaymentTarget.amount - sellerPaymentTarget.paid_amount)
                  }
                  className="w-full sm:w-auto"
                >
                  {submittingPayment ? 'Salvando...' : 'Confirmar Recebimento'}
                </Button>
              </div>
            </>
          )}
        </div>
      </ResponsiveDialog>
    </div>
  );
}
