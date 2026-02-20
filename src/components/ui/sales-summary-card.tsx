// Card principal de consolidado de vendas
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './chart';
import { Area, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { AlertCircle, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import type { Installment, Payment, Sale } from '@/types';
import {
  addMonths,
  endOfMonth,
  endOfYear,
  format,
  getMonth,
  getYear,
  isBefore,
  isWithinInterval,
  startOfMonth,
  startOfYear,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface SalesSummaryCardProps {
  sales: Sale[];
  installments: Installment[];
  payments: Payment[];
  isLoading?: boolean;
}

type DateFilter = 'last7days' | 'last30days' | 'month' | 'year' | 'all';
type MetricKey = 'sold' | 'salesCount' | 'received' | 'toReceive' | 'overdue';
type DateRange = { start: Date; end: Date } | null;

type MonthlyMetricData = {
  month: string;
  monthShort: string;
  sold: number;
  salesCount: number;
  received: number;
  toReceive: number;
  overdue: number;
};

const formatMoney = (value: number, compact = false) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: compact ? 0 : 2,
  }).format(value);

const formatNumberCompact = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);

export function SalesSummaryCard({ sales, installments, payments, isLoading }: SalesSummaryCardProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [activeMetric, setActiveMetric] = useState<MetricKey>('sold');

  const dateRange = useMemo<DateRange>(() => {
    if (dateFilter === 'all') return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'last7days':
        return { start: subDays(now, 7), end: now };
      case 'last30days':
        return { start: subDays(now, 30), end: now };
      case 'month': {
        const [year, month] = selectedMonth.split('-').map(Number);
        const monthDate = new Date(year, month - 1);
        return { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };
      }
      case 'year': {
        const year = Number(selectedYear);
        return { start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 0, 1)) };
      }
      default:
        return null;
    }
  }, [dateFilter, selectedMonth, selectedYear]);

  const filteredSales = useMemo(() => {
    if (!sales.length) return [];
    if (!dateRange) return sales;
    return sales.filter((sale) => isWithinInterval(new Date(sale.sale_date), dateRange));
  }, [sales, dateRange]);

  const filteredInstallments = useMemo(() => {
    if (!installments.length) return [];
    if (!dateRange) return installments;

    const filteredSaleIds = new Set(filteredSales.map((sale) => sale.id));
    return installments.filter((inst) => filteredSaleIds.has(inst.sale_id));
  }, [installments, filteredSales, dateRange]);

  const filteredPayments = useMemo(() => {
    if (!payments.length) return [];

    const filteredSaleIds = new Set(filteredSales.map((sale) => sale.id));
    return payments.filter((payment) => {
      if (payment.status !== 'approved') return false;
      if (payment.origin !== 'buyer') return false;
      if (!payment.payment_date) return false;
      if (dateRange && !isWithinInterval(new Date(payment.payment_date), dateRange)) return false;

      const saleId = payment.installment?.sale_id;
      if (dateRange && saleId && !filteredSaleIds.has(saleId)) return false;
      return true;
    });
  }, [payments, filteredSales, dateRange]);

  const totals = useMemo(() => {
    const totalSold = filteredSales.reduce((sum, sale) => sum + sale.sale_price, 0);
    const totalReceived = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalToReceive = filteredInstallments.reduce((sum, inst) => {
      const remaining = inst.amount - inst.paid_amount;
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOverdue = filteredInstallments.reduce((sum, inst) => {
      if (!inst.due_date) return sum;
      const dueDate = new Date(inst.due_date);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today && inst.status !== 'paid') {
        return sum + Math.max(inst.amount - inst.paid_amount, 0);
      }
      return sum;
    }, 0);

    const totalProfit = filteredSales.reduce((sum, sale) => {
      const profit = sale.purchase_price ? sale.sale_price - sale.purchase_price : 0;
      return sum + profit;
    }, 0);

    const salesCount = filteredSales.length;
    const averageTicket = salesCount > 0 ? totalSold / salesCount : 0;
    const receiptRate = totalSold > 0 ? (totalReceived / totalSold) * 100 : 0;

    return {
      totalSold,
      totalReceived,
      totalToReceive,
      totalOverdue,
      totalProfit,
      salesCount,
      averageTicket,
      receiptRate,
    };
  }, [filteredInstallments, filteredPayments, filteredSales]);

  const monthlyMetrics = useMemo<MonthlyMetricData[]>(() => {
    const fullMonthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const shortMonthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let rangeStart: Date;
    let rangeEnd: Date;

    if (dateRange) {
      rangeStart = startOfMonth(dateRange.start);
      rangeEnd = startOfMonth(dateRange.end);
    } else {
      const allDates: Date[] = [];
      filteredSales.forEach((sale) => allDates.push(new Date(sale.sale_date)));
      filteredInstallments.forEach((inst) => {
        if (inst.due_date) allDates.push(new Date(inst.due_date));
      });
      filteredPayments.forEach((payment) => {
        if (payment.payment_date) allDates.push(new Date(payment.payment_date));
      });

      if (!allDates.length) {
        const now = new Date();
        rangeStart = startOfMonth(now);
        rangeEnd = startOfMonth(now);
      } else {
        const sortedDates = [...allDates].sort((a, b) => a.getTime() - b.getTime());
        rangeStart = startOfMonth(sortedDates[0]);
        rangeEnd = startOfMonth(sortedDates[sortedDates.length - 1]);
      }
    }

    const buckets: MonthlyMetricData[] = [];
    const bucketIndexByMonth = new Map<string, number>();
    let cursor = new Date(rangeStart);

    while (cursor <= rangeEnd) {
      const monthIndex = getMonth(cursor);
      const year = getYear(cursor);
      const monthKey = format(cursor, 'yyyy-MM');
      const monthShort = `${shortMonthNames[monthIndex]}/${String(year).slice(-2)}`;

      bucketIndexByMonth.set(monthKey, buckets.length);
      buckets.push({
        month: fullMonthNames[monthIndex],
        monthShort,
        sold: 0,
        salesCount: 0,
        received: 0,
        toReceive: 0,
        overdue: 0,
      });

      cursor = addMonths(cursor, 1);
    }

    filteredSales.forEach((sale) => {
      const monthKey = format(new Date(sale.sale_date), 'yyyy-MM');
      const idx = bucketIndexByMonth.get(monthKey);
      if (idx !== undefined) {
        buckets[idx].sold += sale.sale_price;
        buckets[idx].salesCount += 1;
      }
    });

    filteredInstallments.forEach((inst) => {
      if (!inst.due_date) return;
      const dueDate = new Date(inst.due_date);
      const monthKey = format(dueDate, 'yyyy-MM');
      const idx = bucketIndexByMonth.get(monthKey);
      if (idx === undefined) return;

      const remaining = Math.max(inst.amount - inst.paid_amount, 0);
      if (remaining > 0) buckets[idx].toReceive += remaining;
      if (isBefore(dueDate, today) && inst.status !== 'paid' && remaining > 0) {
        buckets[idx].overdue += remaining;
      }
    });

    filteredPayments.forEach((payment) => {
      if (!payment.payment_date) return;
      const monthKey = format(new Date(payment.payment_date), 'yyyy-MM');
      const idx = bucketIndexByMonth.get(monthKey);
      if (idx !== undefined) {
        buckets[idx].received += payment.amount;
      }
    });

    return buckets;
  }, [dateRange, filteredInstallments, filteredPayments, filteredSales]);

  const chartConfig = {
    value: {
      label: 'Valor',
      color: '#00a656',
    },
  } satisfies ChartConfig;

  const metricCards = useMemo(
    () => [
      {
        key: 'sold' as const,
        title: 'Total Vendido',
        value: formatMoney(totals.totalSold, true),
        icon: DollarSign,
        iconClass: 'text-slate-700 bg-slate-200/70',
        chartLabel: 'Total vendido por mês',
      },
      {
        key: 'salesCount' as const,
        title: 'Qtd de Vendas',
        value: new Intl.NumberFormat('pt-BR').format(totals.salesCount),
        icon: ShoppingCart,
        iconClass: 'text-slate-700 bg-slate-200/70',
        chartLabel: 'Quantidade de vendas por mês',
      },
      {
        key: 'received' as const,
        title: 'Total Recebido',
        value: formatMoney(totals.totalReceived, true),
        icon: DollarSign,
        iconClass: 'text-emerald-700 bg-emerald-100',
        chartLabel: 'Recebimentos por mês',
      },
      {
        key: 'toReceive' as const,
        title: 'Total a Receber',
        value: formatMoney(totals.totalToReceive, true),
        icon: TrendingUp,
        iconClass: 'text-amber-700 bg-amber-100',
        chartLabel: 'Previsão mensal de parcelas programadas',
      },
      {
        key: 'overdue' as const,
        title: 'Total em Atraso',
        value: formatMoney(totals.totalOverdue, true),
        icon: AlertCircle,
        iconClass: 'text-rose-700 bg-rose-100',
        chartLabel: 'Montante em atraso por mês',
      },
    ],
    [totals],
  );

  const activeMetricCard = metricCards.find((card) => card.key === activeMetric) ?? metricCards[0];

  const chartSeries = useMemo(
    () =>
      monthlyMetrics.map((monthData) => ({
        month: monthData.monthShort,
        monthLabel: monthData.month,
        value: monthData[activeMetric],
      })),
    [activeMetric, monthlyMetrics],
  );

  const monthOptions = useMemo(() => {
    if (!sales.length) {
      const now = new Date();
      return [{ value: format(now, 'yyyy-MM'), label: format(now, 'MMMM yyyy', { locale: ptBR }) }];
    }

    const monthsWithSales = new Map<string, { year: number; month: number }>();
    sales.forEach((sale) => {
      const saleDate = new Date(sale.sale_date);
      const year = getYear(saleDate);
      const month = getMonth(saleDate) + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!monthsWithSales.has(key)) monthsWithSales.set(key, { year, month });
    });

    return Array.from(monthsWithSales.entries())
      .map(([key, { year, month }]) => ({
        value: key,
        label: format(new Date(year, month - 1), 'MMMM yyyy', { locale: ptBR }),
        year,
        month,
      }))
      .sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month))
      .map(({ value, label }) => ({ value, label }));
  }, [sales]);

  const yearOptions = useMemo(() => {
    if (!sales.length) {
      const currentYear = new Date().getFullYear();
      return [{ value: String(currentYear), label: String(currentYear) }];
    }

    const yearsWithSales = new Set<number>();
    sales.forEach((sale) => yearsWithSales.add(getYear(new Date(sale.sale_date))));

    return Array.from(yearsWithSales)
      .sort((a, b) => b - a)
      .map((year) => ({ value: String(year), label: String(year) }));
  }, [sales]);

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'last7days':
        return 'Últimos 7 dias';
      case 'last30days':
        return 'Últimos 30 dias';
      case 'month':
        return format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR });
      case 'year':
        return selectedYear;
      default:
        return 'Todos os períodos';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consolidado de Vendas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Consolidado de Vendas</CardTitle>
            <CardDescription>Visão geral completa das vendas e recebimentos</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                <SelectItem value="month">Mês específico</SelectItem>
                <SelectItem value="year">Ano específico</SelectItem>
              </SelectContent>
            </Select>
            {dateFilter === 'month' && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {dateFilter === 'year' && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        {dateFilter !== 'all' && (
          <p className="text-sm text-muted-foreground mt-2">
            Mostrando dados de: <span className="font-semibold">{getFilterLabel()}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {metricCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeMetric === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveMetric(card.key)}
                className={cn(
                  'group rounded-2xl border p-3 text-left transition-all duration-200',
                  'bg-card',
                  card.key === 'overdue' ? 'col-span-2 lg:col-span-1' : 'col-span-1',
                  isActive
                    ? 'border-border/80 bg-background shadow-[var(--box-shadow-widget)]'
                    : 'border-border/70 bg-card hover:bg-background/70',
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={cn('text-xs', isActive ? 'text-foreground/80' : 'text-muted-foreground')}>
                    {card.title}
                  </span>
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg',
                      isActive ? card.iconClass : 'text-muted-foreground bg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className={cn('text-lg md:text-xl font-bold leading-tight', isActive ? 'text-foreground' : 'text-foreground/90')}>
                  {card.value}
                </p>
              </button>
            );
          })}
        </div>

        {dateFilter !== 'all' ? (
          <div className="pt-1 animate-in slide-in-from-top-2 fade-in-0 duration-300">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {activeMetricCard.chartLabel} ({getFilterLabel()})
            </h3>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <LineChart accessibilityLayer data={chartSeries} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" className="stroke-border/60" />
                <XAxis dataKey="month" tickLine={false} tickMargin={8} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => (activeMetric === 'salesCount' ? `${value}` : formatNumberCompact(value))}
                />
                <Area dataKey="value" type="monotone" fill="url(#metricGradient)" stroke="none" />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, _, item) => {
                        const rawValue = Number(value);
                        const formattedValue =
                          activeMetric === 'salesCount'
                            ? new Intl.NumberFormat('pt-BR').format(rawValue)
                            : formatMoney(rawValue, true);
                        return [formattedValue, item.payload.monthLabel];
                      }}
                    />
                  }
                />
                <Line
                  dataKey="value"
                  type="monotone"
                  stroke="var(--color-value)"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-value)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Selecione um período para visualizar o gráfico da métrica selecionada.
          </p>
        )}

        <div className="pt-4 border-t border-border/80">
          <h3 className="text-sm font-semibold text-foreground mb-3">Indicadores Complementares</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border/80 bg-background p-3">
              <p className="text-xs text-muted-foreground mb-1">Total em atraso</p>
              <p className="text-lg font-bold text-rose-600">{formatMoney(totals.totalOverdue, true)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background p-3">
              <p className="text-xs text-muted-foreground mb-1">Lucro total</p>
              <p className="text-lg font-bold text-emerald-600">{formatMoney(totals.totalProfit, true)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background p-3">
              <p className="text-xs text-muted-foreground mb-1">Ticket médio</p>
              <p className="text-lg font-bold">{formatMoney(totals.averageTicket, true)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background p-3">
              <p className="text-xs text-muted-foreground mb-1">Taxa de recebimento</p>
              <p className="text-lg font-bold">{totals.receiptRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

