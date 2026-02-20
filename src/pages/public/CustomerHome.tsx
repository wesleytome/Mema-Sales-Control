import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSale } from '@/hooks/useSales';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ShoppingBag, User, CreditCard, Wallet, CircleDollarSign, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Payment, SaleWithDetails } from '@/types';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function useCustomerSales(buyerId?: string) {
  return useQuery({
    queryKey: ['customer-home-sales', buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          buyer:buyers(*),
          installments(*)
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sales = (data || []) as SaleWithDetails[];
      return sales.map((sale) => ({
        ...sale,
        installments: [...(sale.installments || [])].sort(
          (a, b) => a.installment_number - b.installment_number,
        ),
      }));
    },
    enabled: !!buyerId,
  });
}

function useCustomerPendingReports(installmentIds: string[]) {
  return useQuery({
    queryKey: ['customer-home-payments', installmentIds.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('installment_id', installmentIds)
        .eq('status', 'pending')
        .eq('origin', 'buyer');

      if (error) throw error;
      return (data || []) as Payment[];
    },
    enabled: installmentIds.length > 0,
  });
}

export function CustomerHome() {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();

  const { data: seedSale, isLoading: seedSaleLoading } = useSale(saleId || '');
  const buyerId = seedSale?.buyer_id;

  const { data: customerSales, isLoading: customerSalesLoading } = useCustomerSales(buyerId);

  const installmentIds = useMemo(
    () => (customerSales || []).flatMap((sale) => sale.installments.map((inst) => inst.id)),
    [customerSales],
  );

  const { data: pendingReports, isLoading: pendingReportsLoading } =
    useCustomerPendingReports(installmentIds);

  const loading =
    seedSaleLoading || (Boolean(buyerId) && customerSalesLoading) || pendingReportsLoading;

  const totals = useMemo(() => {
    const sales = customerSales || [];
    const totalContracted = sales.reduce((sum, sale) => sum + sale.sale_price, 0);
    const totalPaid = sales.reduce(
      (sum, sale) => sum + sale.installments.reduce((instSum, inst) => instSum + inst.paid_amount, 0),
      0,
    );
    const totalPending = Math.max(totalContracted - totalPaid, 0);
    const openSales = sales.filter((sale) => {
      const salePaid = sale.installments.reduce((sum, inst) => sum + inst.paid_amount, 0);
      return sale.sale_price - salePaid > 0;
    }).length;

    return {
      totalContracted,
      totalPaid,
      totalPending,
      totalSales: sales.length,
      openSales,
      pendingReports: pendingReports?.length || 0,
    };
  }, [customerSales, pendingReports]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (!seedSale || !buyerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              O link que você acessou não é válido ou não está mais disponível.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const buyerName = seedSale.buyer?.name || 'Cliente';

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Olá, {buyerName}
            </CardTitle>
            <CardDescription>
              Esta é sua área. Aqui você acompanha tudo e escolhe a compra para ver detalhes e
              informar pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl bg-gray-100 p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" /> Compras
                </p>
                <p className="text-lg font-bold">{totals.totalSales}</p>
                <p className="text-xs text-gray-500">{totals.openSales} em aberto</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <CircleDollarSign className="h-3.5 w-3.5" /> Contratado
                </p>
                <p className="text-sm sm:text-base font-bold text-blue-700 break-all">
                  {formatBRL(totals.totalContracted)}
                </p>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" /> Pago
                </p>
                <p className="text-sm sm:text-base font-bold text-green-700 break-all">
                  {formatBRL(totals.totalPaid)}
                </p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" /> Pendente
                </p>
                <p className="text-sm sm:text-base font-bold text-orange-700 break-all">
                  {formatBRL(totals.totalPending)}
                </p>
              </div>
            </div>

            {totals.pendingReports > 0 && (
              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <Clock className="h-4 w-4 text-yellow-700" />
                <AlertDescription className="text-yellow-800">
                  Você tem {totals.pendingReports} informe(s) de pagamento aguardando aprovação.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Suas compras</CardTitle>
            <CardDescription>
              Toque em uma compra para abrir os detalhes e as ações dessa compra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(customerSales || []).map((sale) => {
              const salePaid = sale.installments.reduce((sum, inst) => sum + inst.paid_amount, 0);
              const salePending = Math.max(sale.sale_price - salePaid, 0);

              return (
                <div
                  key={sale.id}
                  className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">
                        {sale.product_description}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Compra em {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <Badge
                      className={
                        salePending <= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {salePending <= 0 ? 'Quitada' : 'Em aberto'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[11px] text-gray-500">Total</p>
                      <p className="text-xs font-semibold">{formatBRL(sale.sale_price)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Pago</p>
                      <p className="text-xs font-semibold text-green-700">{formatBRL(salePaid)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Pendente</p>
                      <p className="text-xs font-semibold text-orange-700">{formatBRL(salePending)}</p>
                    </div>
                  </div>

                  <Button
                    className="w-full h-11 text-sm sm:text-base"
                    onClick={() => navigate(`/customer/${seedSale.id}/compra/${sale.id}`)}
                  >
                    Ver detalhes da compra
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
