// Página pública para upload de comprovantes
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSale } from '@/hooks/useSales';
import { useCreatePayment } from '@/hooks/usePayments';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
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

    if (!selectedInstallment || !file || paymentAmount <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);

    try {
      // Upload do arquivo para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${saleId}/${selectedInstallment}/${Date.now()}.${fileExt}`;
      // O caminho não inclui o nome do bucket, apenas o caminho dentro do bucket
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública do arquivo
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePath);

      // Criar registro de pagamento
      await createPayment.mutateAsync({
        installment_id: selectedInstallment,
        amount: paymentAmount,
        proof_url: publicUrl,
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
          <CardHeader>
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
  const totalPending = sale.total_amount - totalPaid;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Envio de Comprovante</h1>
          <p className="text-gray-600 mt-2">
            Envie o comprovante de pagamento da sua compra
          </p>
        </div>

        {/* Informações da venda */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Produto</p>
                <p className="font-medium">{sale.product_description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Comprador</p>
                <p className="font-medium">{sale.buyer?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="font-medium text-lg">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(sale.total_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pago</p>
                <p className="font-medium text-lg text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parcelas */}
        <Card>
          <CardHeader>
            <CardTitle>Parcelas</CardTitle>
            <CardDescription>
              Status de cada parcela da compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.installments.map((installment) => {
                  const remaining = installment.amount - installment.paid_amount;
                  return (
                    <TableRow key={installment.id}>
                      <TableCell>{installment.installment_number}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(installment.amount)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(installment.paid_amount)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(installment.due_date), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
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
                          {
                            INSTALLMENT_STATUS_OPTIONS.find(
                              (opt) => opt.value === installment.status
                            )?.label
                          }
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Formulário de upload */}
        <Card>
          <CardHeader>
            <CardTitle>Enviar Comprovante</CardTitle>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a parcela" />
                  </SelectTrigger>
                  <SelectContent>
                    {sale.installments
                      .filter((inst) => inst.status !== 'paid')
                      .map((installment) => {
                        const remaining =
                          installment.amount - installment.paid_amount;
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
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedInst.amount - selectedInst.paid_amount}
                      value={paymentAmount || ''}
                      onChange={(e) =>
                        setPaymentAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500">
                      Valor restante:{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(
                        selectedInst.amount - selectedInst.paid_amount
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof-file">Comprovante *</Label>
                    <Input
                      id="proof-file"
                      type="file"
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-gray-500">
                      Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                    </p>
                    {file && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Arquivo selecionado: {file.name} (
                          {(file.size / 1024).toFixed(2)} KB)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  !selectedInstallment ||
                  !file ||
                  paymentAmount <= 0 ||
                  uploading
                }
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Enviando...' : 'Enviar Comprovante'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Após o envio, seu comprovante será analisado. Você receberá uma
            notificação quando o pagamento for aprovado ou rejeitado.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

