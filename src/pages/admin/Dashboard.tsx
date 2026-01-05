// Dashboard operacional - Mobile First
import { useSales } from '@/hooks/useSales';
import { useInstallments } from '@/hooks/useInstallments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SalesChartCard } from '@/components/ui/sales-chart-card';
import { DeliveriesChartCard } from '@/components/ui/deliveries-chart-card';
import { SalesSummaryCard } from '@/components/ui/sales-summary-card';
import { AlertCircle, DollarSign, TrendingUp, Bell, ArrowRight } from 'lucide-react';
import { format, isToday, isAfter, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export function Dashboard() {
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: allInstallments, isLoading: installmentsLoading } = useInstallments();
  const isMobile = useIsMobile();
  const [receiptsTab, setReceiptsTab] = useState<'overdue' | 'upcoming' | 'all'>('overdue');

  if (salesLoading || installmentsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Resetar horas para comparar apenas datas
  const threeDaysFromNow = addDays(today, 3);

  // Calcular totais
  const totalSold = sales?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
  const totalProfit = sales?.reduce((sum, sale) => {
    const profit = sale.purchase_price ? sale.sale_price - sale.purchase_price : 0;
    return sum + profit;
  }, 0) || 0;

  // Parcelas vencendo hoje
  const dueToday = allInstallments?.filter(
    (inst) => isToday(new Date(inst.due_date)) && inst.status !== 'paid'
  ) || [];

  // Parcelas vencendo em 3 dias
  const dueIn3Days = allInstallments?.filter(
    (inst) => {
      const dueDate = new Date(inst.due_date);
      return (
        isAfter(dueDate, today) &&
        dueDate <= threeDaysFromNow &&
        inst.status !== 'paid'
      );
    }
  ) || [];

  // Parcelas atrasadas
  const overdue = (allInstallments || []).filter((inst) => {
    const dueDate = new Date(inst.due_date);
    dueDate.setHours(0, 0, 0, 0); // Resetar horas para comparar apenas datas
    return dueDate < today && inst.status !== 'paid';
  });


  // Próximos recebimentos (ordenado por data) - inclui atrasados também
  const upcomingPayments = (allInstallments || [])
    .filter((inst) => {
      const dueDate = new Date(inst.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && inst.status !== 'paid';
    })
    .sort((a, b) => {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  // Todas as parcelas pendentes (ordenado: atrasados primeiro, depois por data)
  const allPendingPayments = (allInstallments || [])
    .filter((inst) => inst.status !== 'paid')
    .sort((a, b) => {
      const aDate = new Date(a.due_date);
      const bDate = new Date(b.due_date);
      aDate.setHours(0, 0, 0, 0);
      bDate.setHours(0, 0, 0, 0);
      
      // Atrasados primeiro
      const aIsOverdue = aDate < today;
      const bIsOverdue = bDate < today;
      
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      
      // Depois ordena por data
      return aDate.getTime() - bDate.getTime();
    });

  // Últimas vendas
  const recentSales = sales?.slice(0, 5) || [];

  // Renderiza item de parcela
  const renderPaymentItem = (inst: any) => {
    const dueDate = new Date(inst.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(dueDate, today);
    const isOverdue = dueDate < today;
    const remainingAmount = inst.amount - inst.paid_amount;
    
    return (
      <div key={inst.id} className="flex items-center justify-between py-3 border-b last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
              {format(dueDate, 'dd/MM', { locale: ptBR })}
            </span>
            {isOverdue ? (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                Atrasado
              </span>
            ) : daysUntilDue <= 3 && daysUntilDue >= 0 ? (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {daysUntilDue === 0 ? 'Hoje' : `${daysUntilDue}d`}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {inst.sale?.product_description || 'Produto'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className={`text-sm font-bold block ${isOverdue ? 'text-red-600' : ''}`}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(remainingAmount)}
            </span>
            {inst.paid_amount > 0 && (
              <span className="text-xs text-gray-400">
                de {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(inst.amount)}
              </span>
            )}
          </div>
          <Badge
            className={`text-xs shrink-0 ${
              inst.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : inst.status === 'late' || isOverdue
                ? 'bg-red-100 text-red-800'
                : inst.status === 'partial'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {inst.status === 'paid' ? 'Pago' : inst.status === 'late' || isOverdue ? 'Atrasado' : 'Pendente'}
          </Badge>
        </div>
      </div>
    );
  };

  // Renderiza item de venda para mobile
  const renderSaleItem = (sale: any) => (
    <Link
      key={sale.id}
      to={`/vendas/${sale.id}`}
      className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{sale.product_description}</p>
        <p className="text-xs text-gray-500">
          {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-green-600">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(sale.sale_price)}
        </span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </Link>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Visão geral da operação</p>
      </div>

      {/* Card principal de consolidado */}
      <SalesSummaryCard
        sales={sales || []}
        installments={allInstallments || []}
        isLoading={salesLoading || installmentsLoading}
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalSold)}
            </div>
          </CardContent>
        </Card>

        {totalProfit > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Lucro Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalProfit)}
              </div>
              {totalSold > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Margem: {((totalProfit / totalSold) * 100).toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={overdue.length > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Atrasadas</CardTitle>
            <Bell className={`h-4 w-4 ${overdue.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className={`text-lg sm:text-2xl font-bold ${overdue.length > 0 ? 'text-red-600' : ''}`}>
              {overdue.length}
            </div>
            <p className="text-xs text-muted-foreground">Parcelas</p>
            {overdue.length > 0 && (
              <div className="mt-1">
                <p className={`text-xs sm:text-sm font-semibold ${overdue.length > 0 ? 'text-red-600' : ''}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(
                    overdue.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards de gráficos */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'}>
        <SalesChartCard 
          sales={sales || []} 
          installments={allInstallments || []}
          isLoading={salesLoading || installmentsLoading} 
        />
        <DeliveriesChartCard 
          sales={sales || []} 
          isLoading={salesLoading} 
        />
      </div>

      {/* Alertas de parcelas - integrado ao card de recebimentos */}
      {(dueToday.length > 0 || dueIn3Days.length > 0) && overdue.length === 0 && (
        <div className="space-y-2">
          {dueToday.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-sm font-medium text-orange-800">Vencendo Hoje</AlertTitle>
              <AlertDescription className="text-sm text-orange-700">
                {dueToday.length} parcela(s) vence(m) hoje.
              </AlertDescription>
            </Alert>
          )}

          {dueIn3Days.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-sm font-medium text-yellow-800">Vencendo em Breve</AlertTitle>
              <AlertDescription className="text-sm text-yellow-700">
                {dueIn3Days.length} parcela(s) vence(m) nos próximos 3 dias.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recebimentos - Card unificado com filtros */}
        <Card className={overdue.length > 0 ? 'border-red-200' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Recebimentos
                  {overdue.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {overdue.length} atrasadas
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {overdue.length > 0 && (
                    <span className="text-red-600 font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(
                        overdue.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0)
                      )}{' '}
                      em atraso •{' '}
                    </span>
                  )}
                  Gerencie seus recebimentos pendentes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={receiptsTab} onValueChange={(v) => setReceiptsTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overdue" className="text-xs sm:text-sm">
                  Atrasados
                  {overdue.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {overdue.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
                  Próximos
                  {upcomingPayments.length > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({upcomingPayments.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  Todos
                  {allPendingPayments.length > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({allPendingPayments.length})
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overdue" className="mt-0">
                {overdue.length > 0 ? (
                  <>
                    <div className="divide-y">
                      {overdue.slice(0, 5).map(renderPaymentItem)}
                    </div>
                    {overdue.length > 5 && (
                      <div className="mt-4">
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/vendas">
                            Ver todas ({overdue.length} atrasadas)
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    Nenhum recebimento atrasado
                  </p>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="mt-0">
                {upcomingPayments.length > 0 ? (
                  <>
                    <div className="divide-y">
                      {upcomingPayments.slice(0, 5).map(renderPaymentItem)}
                    </div>
                    {upcomingPayments.length > 5 && (
                      <div className="mt-4">
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/vendas">
                            Ver todos ({upcomingPayments.length} próximos)
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    Nenhum recebimento próximo
                  </p>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-0">
                {allPendingPayments.length > 0 ? (
                  <>
                    <div className="divide-y">
                      {allPendingPayments.slice(0, 5).map(renderPaymentItem)}
                    </div>
                    {allPendingPayments.length > 5 && (
                      <div className="mt-4">
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/vendas">
                            Ver todos ({allPendingPayments.length} pendentes)
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    Nenhum recebimento pendente
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Últimas vendas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Últimas Vendas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">As {isMobile ? 3 : 5} vendas mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="divide-y">
                {recentSales.slice(0, isMobile ? 3 : 5).map(renderSaleItem)}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4 text-sm">Nenhuma venda cadastrada</p>
            )}
            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                <Link to="/vendas">
                  Ver todas as vendas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
