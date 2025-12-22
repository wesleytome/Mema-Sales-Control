// Página de detalhes da venda
import { useParams, Link } from 'react-router-dom';
import { useSale } from '@/hooks/useSales';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INSTALLMENT_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: sale, isLoading } = useSale(id || '');

  const publicLink = `${window.location.origin}/pay/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success('Link copiado para a área de transferência!');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  const totalPaid = sale.installments.reduce(
    (sum, inst) => sum + inst.paid_amount,
    0
  );
  const totalPending = sale.total_amount - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/vendas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Venda</h1>
            <p className="text-gray-600 mt-1">
              {sale.product_description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar Link Público
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(sale.total_amount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPending)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Comprador</p>
              <p className="font-medium">{sale.buyer?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data da Venda</p>
              <p className="font-medium">
                {format(new Date(sale.sale_date), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </p>
            </div>
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
                {
                  DELIVERY_STATUS_OPTIONS.find(
                    (opt) => opt.value === sale.delivery_status
                  )?.label
                }
              </Badge>
            </div>
            {sale.notes && (
              <div>
                <p className="text-sm text-gray-600">Observações</p>
                <p className="font-medium">{sale.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link Público</CardTitle>
            <CardDescription>
              Compartilhe este link com o comprador para envio de comprovantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 rounded-md break-all text-sm">
              {publicLink}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parcelas</CardTitle>
          <CardDescription>
            {sale.installments.length} parcela(s) cadastrada(s)
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
              {sale.installments.map((installment) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

