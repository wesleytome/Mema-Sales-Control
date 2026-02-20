import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSale } from '@/hooks/useSales';
import { useCreatePayment, usePaymentsBySale } from '@/hooks/usePayments';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  CalendarIcon,
  ArrowLeft,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  STORAGE_BUCKET_NAME,
  INSTALLMENT_STATUS_OPTIONS,
} from '@/lib/constants';
import { toast } from 'sonner';
import type { Installment, Payment } from '@/types';

type WizardStep = 'summary' | 'amount' | 'proof' | 'confirm';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PaymentUpload() {
  const { seedSaleId, saleId } = useParams<{ seedSaleId: string; saleId: string }>();
  const queryClient = useQueryClient();

  const { data: seedSale, isLoading: seedSaleLoading } = useSale(seedSaleId || '');
  const { data: sale, isLoading: saleLoading } = useSale(saleId || '');
  const { data: payments, isLoading: paymentsLoading } = usePaymentsBySale(saleId || '');

  const createPayment = useCreatePayment();

  const [step, setStep] = useState<WizardStep>('summary');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [wantsProof, setWantsProof] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const loading = seedSaleLoading || saleLoading || paymentsLoading;

  const totalPaid = useMemo(
    () => sale?.installments.reduce((sum, inst) => sum + inst.paid_amount, 0) || 0,
    [sale],
  );

  const totalPending = useMemo(() => (sale ? sale.sale_price - totalPaid : 0), [sale, totalPaid]);

  const pendingBuyerPayments = useMemo(
    () => (payments || []).filter((payment) => payment.status === 'pending' && payment.origin === 'buyer'),
    [payments],
  );

  const pendingInstallmentIds = useMemo(
    () => new Set(pendingBuyerPayments.map((payment) => payment.installment_id)),
    [pendingBuyerPayments],
  );

  const nextPendingInstallment = useMemo(() => {
    if (!sale) return null;

    return (
      sale.installments.find(
        (inst) => inst.status !== 'paid' && !pendingInstallmentIds.has(inst.id),
      ) || null
    );
  }, [sale, pendingInstallmentIds]);

  const targetInstallment = useMemo(() => {
    if (!sale) return null;
    if (sale.payment_mode === 'flexible') return sale.installments[0] || null;
    return nextPendingInstallment;
  }, [sale, nextPendingInstallment]);

  const hasPendingForTargetInstallment = useMemo(
    () => (targetInstallment ? pendingInstallmentIds.has(targetInstallment.id) : false),
    [pendingInstallmentIds, targetInstallment],
  );

  const canStartPayment = Boolean(targetInstallment) && !hasPendingForTargetInstallment;

  const isAmountValid = paymentAmount > 0 && paymentAmount <= totalPending;
  const balanceAfterPayment = totalPending - paymentAmount;

  const handleStartPayment = () => {
    if (!canStartPayment || !targetInstallment) return;

    if (sale?.payment_mode === 'fixed') {
      const remaining = targetInstallment.amount - targetInstallment.paid_amount;
      setPaymentAmount(remaining);
    } else {
      setPaymentAmount(0);
    }

    setStep('amount');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!sale || !targetInstallment || paymentAmount <= 0) return;

    setUploading(true);

    try {
      let proofUrl: string | null = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${sale.id}/${targetInstallment.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(fileName);

        proofUrl = publicUrl;
      }

      await createPayment.mutateAsync({
        installment_id: targetInstallment.id,
        amount: paymentAmount,
        proof_url: proofUrl,
        status: 'pending',
        origin: 'buyer',
        payment_date: paymentDate,
        rejection_reason: null,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments', 'sale', sale.id] }),
        queryClient.invalidateQueries({ queryKey: ['sales', sale.id] }),
        queryClient.invalidateQueries({ queryKey: ['customer-home-sales', sale.buyer_id] }),
        queryClient.invalidateQueries({ queryKey: ['customer-home-payments'] }),
      ]);

      setSubmitted(true);
      setStep('confirm');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar pagamento';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setStep('summary');
    setPaymentAmount(0);
    setWantsProof(null);
    setFile(null);
    setSubmitted(false);
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const renderInstallmentCard = (inst: Installment) => {
    const remaining = inst.amount - inst.paid_amount;

    return (
      <div key={inst.id} className="flex items-center justify-between py-3 border-b last:border-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
            {inst.installment_number}
          </div>
          <div>
            <p className="text-sm font-medium">Parcela {inst.installment_number}</p>
            {inst.due_date && (
              <p className="text-xs text-gray-500">
                {format(new Date(inst.due_date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <Badge
            className={
              inst.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : inst.status === 'partial'
                  ? 'bg-yellow-100 text-yellow-800'
                  : inst.status === 'late'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }
          >
            {INSTALLMENT_STATUS_OPTIONS.find((o) => o.value === inst.status)?.label}
          </Badge>
          {remaining > 0 && (
            <p className="text-xs text-orange-600 mt-1">{formatBRL(remaining)} restante</p>
          )}
        </div>
      </div>
    );
  };

  const renderPendingPaymentCard = (payment: Payment) => {
    const installmentLabel =
      sale?.payment_mode === 'fixed'
        ? `Parcela ${payment.installment?.installment_number ?? '-'}`
        : 'Pagamento informado';

    return (
      <div key={payment.id} className="flex items-center justify-between py-3 border-b last:border-0">
        <div>
          <p className="text-sm font-medium">{installmentLabel}</p>
          <p className="text-xs text-gray-500">
            Enviado em {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
          {payment.payment_date && (
            <p className="text-xs text-gray-500">
              Data informada:{' '}
              {format(new Date(`${payment.payment_date}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{formatBRL(payment.amount)}</p>
          <Badge className="bg-yellow-100 text-yellow-800">Aguardando confirmação</Badge>
        </div>
      </div>
    );
  };

  const renderPaymentHistoryCard = (payment: Payment) => {
    const installmentLabel =
      sale?.payment_mode === 'fixed'
        ? `Parcela ${payment.installment?.installment_number ?? '-'}`
        : 'Pagamento';

    const statusClass =
      payment.status === 'approved'
        ? 'bg-green-100 text-green-800'
        : payment.status === 'rejected'
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800';

    const statusLabel =
      payment.status === 'approved'
        ? 'Aprovado'
        : payment.status === 'rejected'
          ? 'Rejeitado'
          : 'Pendente';

    return (
      <div key={payment.id} className="py-3 border-b last:border-0 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{installmentLabel}</p>
            <p className="text-xs text-gray-500">
              {payment.origin === 'buyer' ? 'Informado por você' : 'Registrado pelo vendedor'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{formatBRL(payment.amount)}</p>
            <Badge className={statusClass}>{statusLabel}</Badge>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-0.5">
          <p>
            Registro: {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
          {payment.payment_date && (
            <p>
              Pagamento: {format(new Date(`${payment.payment_date}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          )}
          {payment.status === 'rejected' && payment.rejection_reason && (
            <p className="text-red-600">Motivo da rejeição: {payment.rejection_reason}</p>
          )}
          {payment.proof_url && (
            <a
              href={payment.proof_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-primary underline"
            >
              Ver comprovante
            </a>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-16 w-40" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const isValidCustomerContext =
    seedSale && sale && seedSale.buyer_id === sale.buyer_id && Boolean(seedSaleId);

  if (!isValidCustomerContext || !sale || !seedSale || !seedSaleId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle>Compra indisponível</CardTitle>
            <CardDescription>
              Não foi possível abrir os detalhes desta compra com este link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSalePaidOff = totalPending <= 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-xl mx-auto space-y-4 sm:space-y-5">
        <Button variant="outline" className="h-11 w-full sm:w-auto" asChild>
          <Link to={`/customer/${seedSaleId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para minhas compras
          </Link>
        </Button>

        {step === 'summary' && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {sale.product_description}
                </CardTitle>
                <CardDescription>
                  Acompanhe os valores desta compra e faça suas ações aqui.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-bold">{formatBRL(sale.sale_price)}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">Pago</p>
                    <p className="text-sm font-bold text-green-600">{formatBRL(totalPaid)}</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-500">Pendente</p>
                    <p className="text-sm font-bold text-orange-600">{formatBRL(totalPending)}</p>
                  </div>
                </div>

                {isSalePaidOff && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Esta compra já está quitada.
                    </AlertDescription>
                  </Alert>
                )}

                {pendingBuyerPayments.length > 0 && (
                  <Card className="border-yellow-300 bg-yellow-50/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-700" />
                        Informes pendentes de aprovação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{pendingBuyerPayments.map(renderPendingPaymentCard)}</CardContent>
                  </Card>
                )}

                {!isSalePaidOff && (
                  <Card className="border-primary/30">
                    <CardContent className="pt-6 space-y-4">
                      {sale.payment_mode === 'fixed' && nextPendingInstallment ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
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
                              {
                                INSTALLMENT_STATUS_OPTIONS.find(
                                  (o) => o.value === nextPendingInstallment.status,
                                )?.label
                              }
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Valor restante</span>
                            <span className="font-bold text-lg">
                              {formatBRL(
                                nextPendingInstallment.amount - nextPendingInstallment.paid_amount,
                              )}
                            </span>
                          </div>
                          {nextPendingInstallment.due_date && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Vencimento</span>
                              <span className="text-sm font-medium">
                                {format(new Date(nextPendingInstallment.due_date), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <Clock className="h-4 w-4 text-yellow-700" />
                          <AlertDescription className="text-yellow-800">
                            {pendingBuyerPayments.length > 0
                              ? 'Você já possui informe pendente para esta compra. Aguarde aprovação.'
                              : 'Você pode informar qualquer valor que pagou.'}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        className="w-full h-12 text-base"
                        onClick={handleStartPayment}
                        disabled={!canStartPayment}
                      >
                        <DollarSign className="mr-2 h-5 w-5" />
                        {canStartPayment ? 'Informar Pagamento' : 'Aguardando confirmação'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Histórico de pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(payments || []).length > 0 ? (
                  (payments || []).map(renderPaymentHistoryCard)
                ) : (
                  <p className="text-sm text-gray-500">Nenhum pagamento registrado ainda.</p>
                )}
              </CardContent>
            </Card>

            {sale.payment_mode === 'fixed' && sale.installments.length > 1 && (
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
                  Ver parcelas da compra
                </Button>

                {showInstallments && (
                  <Card>
                    <CardContent className="pt-4">{sale.installments.map(renderInstallmentCard)}</CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {step === 'amount' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Etapa 1 de 3 - Valor</CardTitle>
              <CardDescription>Informe o valor do pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <CurrencyInput
                  value={paymentAmount}
                  onChange={(value) => setPaymentAmount(value)}
                  placeholder="R$ 0,00"
                  className="h-14 text-lg"
                />
                {paymentAmount > 0 && (
                  <div
                    className={`text-sm p-3 rounded-lg ${
                      isAmountValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {isAmountValid
                      ? `Saldo após pagamento: ${formatBRL(balanceAfterPayment)}`
                      : 'Valor inválido para esta compra'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Data do pagamento
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('summary')}>
                  Voltar
                </Button>
                <Button className="flex-1" disabled={!isAmountValid} onClick={() => setStep('proof')}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'proof' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Etapa 2 de 3 - Comprovante</CardTitle>
              <CardDescription>Você quer enviar comprovante?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {wantsProof === null && (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-16 text-base" onClick={() => setWantsProof(true)}>
                    <Upload className="mr-2 h-5 w-5" />
                    Sim
                  </Button>
                  <Button variant="outline" className="h-16 text-base" onClick={() => setWantsProof(false)}>
                    Não
                  </Button>
                </div>
              )}

              {wantsProof === true && (
                <div className="space-y-3">
                  <Input
                    id="proof-file"
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">JPG, PNG, PDF (máx. 5MB)</p>

                  {file && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        {file.name} ({(file.size / 1024).toFixed(0)} KB)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {wantsProof === false && (
                <p className="text-sm text-gray-500 text-center py-2">Comprovante não será enviado.</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setWantsProof(null);
                    setFile(null);
                    setStep('amount');
                  }}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  disabled={wantsProof === null || (wantsProof === true && !file)}
                  onClick={handleSubmit}
                >
                  {uploading ? 'Enviando...' : 'Concluir'}
                  {!uploading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && submitted && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle>Pagamento Enviado!</CardTitle>
              <CardDescription>Aguardando confirmação do vendedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Valor informado</span>
                  <span className="font-bold">{formatBRL(paymentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Data</span>
                  <span className="text-sm">
                    {format(new Date(`${paymentDate}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Aguardando confirmação</Badge>
                </div>
              </div>

              <Button className="w-full" onClick={handleReset}>
                Voltar ao resumo da compra
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
