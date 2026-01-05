// Página de detalhes da venda - Mobile First
import { useParams, Link } from 'react-router-dom';
import { useSale } from '@/hooks/useSales';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Calendar, DollarSign, Hash, User, Package, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INSTALLMENT_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { useNavigate } from 'react-router-dom';

export function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id || '');
  const isMobile = useIsMobile();

  const publicLink = `${window.location.origin}/pay/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success('Link copiado para a área de transferência!');
  };

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

  const totalPaid = sale.installments.reduce(
    (sum, inst) => sum + inst.paid_amount,
    0
  );
  const totalPending = sale.sale_price - totalPaid;
  const profit = sale.purchase_price ? sale.sale_price - sale.purchase_price : null;

  // Renderiza card de parcela para mobile
  const renderInstallmentCard = (installment: any) => (
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
          <div className="col-span-2">
            <span className="text-gray-500">Vencimento:</span>
            <p className="font-medium">
              {format(new Date(installment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
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
            <h1 className="text-2xl sm:text-3xl font-bold">Detalhes da Venda</h1>
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

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor de Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(sale.sale_price)}
            </div>
          </CardContent>
        </Card>

        {sale.purchase_price && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor de Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(sale.purchase_price)}
              </div>
            </CardContent>
          </Card>
        )}

        {profit !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                Lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl sm:text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(profit)}
              </div>
              {sale.purchase_price && sale.purchase_price > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Margem: {((profit / sale.purchase_price) * 100).toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPending)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações e Link */}
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
                  {DELIVERY_STATUS_OPTIONS.find((opt) => opt.value === sale.delivery_status)?.label}
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
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full mt-3"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Link
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Parcelas */}
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
                  accessor: (inst: any) =>
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(inst.amount),
                },
                {
                  header: 'Pago',
                  accessor: (inst: any) => (
                    <span className="text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(inst.paid_amount)}
                    </span>
                  ),
                },
                {
                  header: 'Vencimento',
                  accessor: (inst: any) =>
                    format(new Date(inst.due_date), 'dd/MM/yyyy', { locale: ptBR }),
                },
                {
                  header: 'Status',
                  accessor: (inst: any) => (
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
                      {INSTALLMENT_STATUS_OPTIONS.find((opt) => opt.value === inst.status)?.label}
                    </Badge>
                  ),
                },
              ]}
              keyExtractor={(inst: any) => inst.id}
              emptyMessage="Nenhuma parcela cadastrada"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
