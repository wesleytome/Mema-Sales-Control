// Dashboard operacional — Mobile First
import type { Installment, Sale } from '@/types';
import { useSales } from '@/hooks/useSales';
import { useInstallments } from '@/hooks/useInstallments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SalesChartCard } from '@/components/ui/sales-chart-card';
import { DeliveriesChartCard } from '@/components/ui/deliveries-chart-card';
import { SalesSummaryCard } from '@/components/ui/sales-summary-card';
import { AlertCircle, DollarSign, TrendingUp, Bell, ArrowRight, CalendarDays } from 'lucide-react';
import { format, isToday, isAfter, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type ReceiptsTab = 'overdue' | 'upcoming' | 'all';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function Dashboard() {
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: allInstallments, isLoading: installmentsLoading } = useInstallments();
  const isMobile = useIsMobile();
  const [receiptsTab, setReceiptsTab] = useState<ReceiptsTab>('overdue');

  if (salesLoading || installmentsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysFromNow = addDays(today, 3);

  const totalSold = sales?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
  const totalProfit = sales?.reduce((sum, sale) => {
    const profit = sale.purchase_price ? sale.sale_price - sale.purchase_price : 0;
    return sum + profit;
  }, 0) || 0;

  const dueToday = allInstallments?.filter(
    (inst) => inst.due_date && isToday(new Date(inst.due_date)) && inst.status !== 'paid',
  ) || [];

  const dueIn3Days = allInstallments?.filter((inst) => {
    if (!inst.due_date) return false;
    const dueDate = new Date(inst.due_date);
    return isAfter(dueDate, today) && dueDate <= threeDaysFromNow && inst.status !== 'paid';
  }) || [];

  const overdue = (allInstallments || []).filter((inst) => {
    if (!inst.due_date) return false;
    const dueDate = new Date(inst.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && inst.status !== 'paid';
  });

  const upcomingPayments = (allInstallments || [])
    .filter((inst) => {
      if (!inst.due_date) return false;
      const dueDate = new Date(inst.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && inst.status !== 'paid';
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const allPendingPayments = (allInstallments || [])
    .filter((inst) => inst.status !== 'paid' && inst.due_date)
    .sort((a, b) => {
      const aDate = new Date(a.due_date!);
      const bDate = new Date(b.due_date!);
      aDate.setHours(0, 0, 0, 0);
      bDate.setHours(0, 0, 0, 0);
      const aIsOverdue = aDate < today;
      const bIsOverdue = bDate < today;
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      return aDate.getTime() - bDate.getTime();
    });

  const recentSales = sales?.slice(0, 5) || [];

  const renderPaymentItem = (inst: Installment) => {
    if (!inst.due_date) return null;
    const dueDate = new Date(inst.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(dueDate, today);
    const isOverdue = dueDate < today;
    const remainingAmount = inst.amount - inst.paid_amount;

    return (
      <div
        key={inst.id}
        className={cn(
          'flex items-center justify-between py-3 border-b last:border-0 transition-colors',
          isOverdue && 'bg-rose-500/10 dark:bg-rose-500/15 -mx-2 px-2 rounded-lg',
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-semibold', isOverdue ? 'text-rose-600' : 'text-foreground')}>
              {format(dueDate, 'dd/MM', { locale: ptBR })}
            </span>
            {isOverdue ? (
              <span className="status-danger text-xs px-2 py-0.5 rounded-full font-medium">Atrasado</span>
            ) : daysUntilDue <= 3 && daysUntilDue >= 0 ? (
              <span className="status-warning text-xs px-2 py-0.5 rounded-full">
                {daysUntilDue === 0 ? 'Hoje' : `${daysUntilDue}d`}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {inst.sale?.product_description || 'Produto'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className={cn('text-sm font-bold block', isOverdue ? 'text-rose-600' : 'text-foreground')}>
              {formatBRL(remainingAmount)}
            </span>
            {inst.paid_amount > 0 && (
              <span className="text-xs text-muted-foreground">de {formatBRL(inst.amount)}</span>
            )}
          </div>
          <Badge
            className={cn(
              'text-xs shrink-0 border-0 font-medium',
              inst.status === 'paid'
                ? 'status-success'
                : inst.status === 'late' || isOverdue
                  ? 'status-danger'
                  : inst.status === 'partial'
                    ? 'status-warning'
                    : 'status-neutral',
            )}
          >
            {inst.status === 'paid'
              ? 'Pago'
              : inst.status === 'late' || isOverdue
                ? 'Atrasado'
                : 'Pendente'}
          </Badge>
        </div>
      </div>
    );
  };

  const renderSaleItem = (sale: Sale) => (
    <Link
      key={sale.id}
      to={`/vendas/${sale.id}`}
      className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{sale.product_description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
          {sale.buyer?.name && ` • ${sale.buyer.name}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-sm font-bold text-emerald-600">{formatBRL(sale.sale_price)}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Summary card */}
      <SalesSummaryCard
        sales={sales || []}
        installments={allInstallments || []}
        isLoading={salesLoading || installmentsLoading}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {/* Total Vendido */}
        <Card className="elevation-1 border-border/70">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-muted-foreground leading-tight">Total Vendido</p>
              <div className="icon-chip bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 !w-7 !h-7 !rounded-lg shrink-0">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-bold leading-tight break-all">{formatBRL(totalSold)}</p>
          </CardContent>
        </Card>

        {/* Lucro */}
        {totalProfit > 0 && (
          <Card className="elevation-1 border-border/70">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-muted-foreground leading-tight">Lucro Total</p>
                <div className="icon-chip bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 !w-7 !h-7 !rounded-lg shrink-0">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-base sm:text-xl font-bold leading-tight text-emerald-600 break-all">
                {formatBRL(totalProfit)}
              </p>
              {totalSold > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {((totalProfit / totalSold) * 100).toFixed(1)}% margem
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Atrasadas */}
        <Card className={cn('elevation-1', overdue.length > 0 ? 'border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40' : 'border-border/70')}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-muted-foreground leading-tight">Atrasadas</p>
              <div className={cn('icon-chip !w-7 !h-7 !rounded-lg shrink-0', overdue.length > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40' : 'bg-muted text-muted-foreground')}>
                <Bell className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className={cn('text-base sm:text-xl font-bold leading-tight', overdue.length > 0 ? 'text-rose-600' : '')}>
              {overdue.length}
              <span className="text-xs font-normal text-muted-foreground ml-1">parcelas</span>
            </p>
            {overdue.length > 0 && (
              <p className="text-xs font-semibold text-rose-600 mt-0.5 break-all">
                {formatBRL(overdue.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'}>
        <SalesChartCard
          sales={sales || []}
          installments={allInstallments || []}
          isLoading={salesLoading || installmentsLoading}
        />
        <DeliveriesChartCard sales={sales || []} isLoading={salesLoading} />
      </div>

      {/* Alerts */}
      {(dueToday.length > 0 || dueIn3Days.length > 0) && overdue.length === 0 && (
        <div className="space-y-2">
          {dueToday.length > 0 && (
            <Alert className="border-amber-200/70 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-sm font-semibold text-amber-800">Vencendo Hoje</AlertTitle>
              <AlertDescription className="text-sm text-amber-700">
                {dueToday.length} parcela(s) vence(m) hoje.
              </AlertDescription>
            </Alert>
          )}
          {dueIn3Days.length > 0 && (
            <Alert className="border-yellow-200/70 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-sm font-semibold text-yellow-800">Vencendo em Breve</AlertTitle>
              <AlertDescription className="text-sm text-yellow-700">
                {dueIn3Days.length} parcela(s) vence(m) nos próximos 3 dias.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Recebimentos + Últimas Vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recebimentos */}
        <Card className={cn('elevation-1', overdue.length > 0 ? 'border-rose-200' : 'border-border/70')}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  Recebimentos
                  {overdue.length > 0 && (
                    <Badge className="status-danger border-0 text-xs font-semibold">
                      {overdue.length} atrasadas
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {overdue.length > 0 && (
                    <span className="text-rose-600 font-medium">
                      {formatBRL(overdue.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0))} em atraso •{' '}
                    </span>
                  )}
                  Gerencie seus recebimentos pendentes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={receiptsTab} onValueChange={(value) => setReceiptsTab(value as ReceiptsTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overdue" className="text-xs sm:text-sm">
                  Atrasados
                  {overdue.length > 0 && (
                    <Badge className="ml-1 status-danger border-0 text-xs">{overdue.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
                  Próximos
                  {upcomingPayments.length > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">({upcomingPayments.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  Todos
                  {allPendingPayments.length > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">({allPendingPayments.length})</span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overdue" className="mt-0">
                {overdue.length > 0 ? (
                  <>
                    <div className="divide-y">{overdue.slice(0, 5).map(renderPaymentItem)}</div>
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
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum recebimento atrasado ✓
                  </p>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="mt-0">
                {upcomingPayments.length > 0 ? (
                  <>
                    <div className="divide-y">{upcomingPayments.slice(0, 5).map(renderPaymentItem)}</div>
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
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum recebimento próximo
                  </p>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-0">
                {allPendingPayments.length > 0 ? (
                  <>
                    <div className="divide-y">{allPendingPayments.slice(0, 5).map(renderPaymentItem)}</div>
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
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum recebimento pendente
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Últimas Vendas */}
        <Card className="elevation-1 border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Últimas Vendas</CardTitle>
            <CardDescription className="text-xs">
              As {isMobile ? 3 : 5} vendas mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="divide-y">
                {recentSales.slice(0, isMobile ? 3 : 5).map(renderSaleItem)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Nenhuma venda cadastrada
              </p>
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
