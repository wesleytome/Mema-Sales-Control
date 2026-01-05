// Página pública para upload de comprovantes - Mobile First
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSale } from '@/hooks/useSales';
import { useCreatePayment } from '@/hooks/usePayments';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle, DollarSign, Package, User, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, INSTALLMENT_STATUS_OPTIONS, STORAGE_BUCKET_NAME } from '@/lib/constants';
import { toast } from 'sonner';

export function PaymentUpload() {
  const { saleId } = useParams<{ saleId: string }>();
  const { data: sale, isLoading } = useSale(saleId || '');
  const createPayment = useCreatePayment();
  const [selectedInstallment, setSelectedInstallment] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF.');
      return;
    }

    // Validar tamanho
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstallment || paymentAmount <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);

    try {
      let proofUrl: string | null = null;

      // Upload do arquivo para Supabase Storage (opcional)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${saleId}/${selectedInstallment}/${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obter URL pública do arquivo
        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePath);
        
        proofUrl = publicUrl;
      }

      // Criar registro de pagamento
      await createPayment.mutateAsync({
        installment_id: selectedInstallment,
        amount: paymentAmount,
        proof_url: proofUrl,
        status: 'pending',
        rejection_reason: null,
      });

      // Reset form
      setSelectedInstallment('');
      setPaymentAmount(0);
      setFile(null);
      const fileInput = document.getElementById('proof-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast.success('Comprovante enviado com sucesso! Aguarde a aprovação.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  const selectedInst = sale?.installments.find(
    (inst) => inst.id === selectedInstallment
  );

  // Preencher automaticamente o valor do pagamento quando uma parcela for selecionada
  useEffect(() => {
    if (selectedInst) {
      const remainingAmount = selectedInst.amount - selectedInst.paid_amount;
      setPaymentAmount(remainingAmount);
    } else {
      setPaymentAmount(0);
    }
  }, [selectedInst]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle>Venda não encontrada</CardTitle>
            <CardDescription>
              O link que você acessou não é válido ou a venda não existe mais.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalPaid = sale.installments.reduce(
    (sum, inst) => sum + inst.paid_amount,
    0
  );
  const totalPending = sale.sale_price - totalPaid;

  // Renderiza card de parcela para mobile
  const renderInstallmentCard = (installment: any) => {
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
              <p className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(installment.amount)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Pago:</span>
              <p className="font-medium text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(installment.paid_amount)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Vencimento:</span>
              <p className="font-medium">
                {format(new Date(installment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            {remaining > 0 && (
              <div>
                <span className="text-gray-500">Restante:</span>
                <p className="font-medium text-orange-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(remaining)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Envio de Comprovante</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Envie o comprovante de pagamento da sua compra
          </p>
        </div>

        {/* Informações da venda */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações da Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Produto</p>
                  <p className="font-medium">{sale.product_description}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Comprador</p>
                  <p className="font-medium">{sale.buyer?.name || '-'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs sm:text-sm text-gray-600">Valor Total</p>
                <p className="font-bold text-base sm:text-lg">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(sale.sale_price)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs sm:text-sm text-gray-600">Total Pago</p>
                <p className="font-bold text-base sm:text-lg text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalPaid)}
                </p>
              </div>
            </div>
            
            {totalPending > 0 && (
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <p className="text-xs sm:text-sm text-gray-600">Valor Pendente</p>
                <p className="font-bold text-lg sm:text-xl text-orange-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalPending)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parcelas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Parcelas
            </CardTitle>
            <CardDescription>
              Status de cada parcela da compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sale.installments.map(renderInstallmentCard)}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de upload */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Comprovante
            </CardTitle>
            <CardDescription>
              Selecione a parcela e envie o comprovante de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="installment">Parcela *</Label>
                <Select
                  value={selectedInstallment}
                  onValueChange={setSelectedInstallment}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a parcela" />
                  </SelectTrigger>
                  <SelectContent>
                    {sale.installments
                      .filter((inst) => inst.status !== 'paid')
                      .map((installment) => {
                        const remaining = installment.amount - installment.paid_amount;
                        return (
                          <SelectItem key={installment.id} value={installment.id}>
                            Parcela {installment.installment_number} -{' '}
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(remaining)}{' '}
                            restante
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              {selectedInstallment && selectedInst && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor do Pagamento *</Label>
                    <CurrencyInput
                      id="amount"
                      value={paymentAmount}
                      onChange={(value) => setPaymentAmount(value)}
                      placeholder="R$ 0,00"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Valor restante:{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(selectedInst.amount - selectedInst.paid_amount)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof-file">Comprovante</Label>
                    <div className="relative">
                      <Input
                        id="proof-file"
                        type="file"
                        accept={ALLOWED_FILE_TYPES.join(',')}
                        onChange={handleFileChange}
                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 opacity-0 absolute w-full h-full"
                      />
                      <div className="flex items-center gap-2 border border-input rounded-md px-3 py-2 bg-background min-h-[2.25rem]">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('proof-file')?.click()}
                          className="shrink-0"
                        >
                          Escolher arquivo
                        </Button>
                        <span className="text-sm text-muted-foreground flex-1 truncate">
                          {file ? file.name : 'Nenhum arquivo selecionado'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Formatos aceitos: JPG, PNG, PDF (máx. 5MB) - Opcional
                    </p>
                    {file && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Arquivo selecionado: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={!selectedInstallment || paymentAmount <= 0 || uploading}
              >
                <Upload className="mr-2 h-5 w-5" />
                {uploading ? 'Enviando...' : 'Enviar Comprovante'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Após o envio, seu comprovante será analisado. Você receberá uma
            notificação quando o pagamento for aprovado ou rejeitado.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
