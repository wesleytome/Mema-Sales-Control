// Card principal de consolidado de vendas
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, LabelList } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import type { Sale, Installment } from '@/types';
import { format, startOfMonth, endOfMonth, getMonth, getYear, subDays, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from './skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const formatAbbreviatedValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
};

interface SalesBarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string;
}

const SalesBarLabel = ({ x, y, width, value }: SalesBarLabelProps) => {
  const numericValue = typeof value === 'string' ? Number(value) : value ?? 0;
  if (!numericValue) return null;
  const xPos = typeof x === 'string' ? Number(x) : x ?? 0;
  const yPos = typeof y === 'string' ? Number(y) : y ?? 0;
  const widthValue = typeof width === 'string' ? Number(width) : width ?? 0;
  return (
    <text
      x={xPos + widthValue / 2}
      y={yPos - 5}
      fill="#374151"
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
    >
      {formatAbbreviatedValue(numericValue)}
    </text>
  );
};

interface SalesSummaryCardProps {
  sales: Sale[];
  installments: Installment[];
  isLoading?: boolean;
}

type DateFilter = 'last7days' | 'last30days' | 'month' | 'year' | 'all';

export function SalesSummaryCard({ sales, installments, isLoading }: SalesSummaryCardProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  // Filtrar vendas e parcelas baseado no filtro selecionado
  const filteredSales = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    if (dateFilter === 'all') return sales;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate: Date = now;

    switch (dateFilter) {
      case 'last7days':
        startDate = subDays(now, 7);
        break;
      case 'last30days':
        startDate = subDays(now, 30);
        break;
      case 'month': {
        const [year, month] = selectedMonth.split('-').map(Number);
        startDate = startOfMonth(new Date(year, month - 1));
        endDate = endOfMonth(new Date(year, month - 1));
        break;
      }
      case 'year': {
        const filterYear = parseInt(selectedYear);
        startDate = startOfYear(new Date(filterYear, 0));
        endDate = endOfYear(new Date(filterYear, 0));
        break;
      }
      default:
        return sales;
    }

    return sales.filter((sale) => {
      const saleDate = new Date(sale.sale_date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [sales, dateFilter, selectedMonth, selectedYear]);

  const filteredInstallments = useMemo(() => {
    if (!installments || installments.length === 0) return [];
    if (dateFilter === 'all') return installments;

    // Para parcelas, filtramos baseado na data de venda relacionada
    // ou na data de vencimento, dependendo do contexto
    return installments.filter((inst) => {
      // Se a parcela está relacionada a uma venda filtrada, incluir
      if (inst.sale_id) {
        const relatedSale = filteredSales.find((s) => s.id === inst.sale_id);
        return !!relatedSale;
      }
      return true;
    });
  }, [installments, filteredSales, dateFilter]);

  // Calcular totais usando dados filtrados
  const totals = useMemo(() => {
    const totalSold = filteredSales?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
    const totalReceived = filteredInstallments?.reduce((sum, inst) => sum + inst.paid_amount, 0) || 0;
    const totalToReceive = filteredInstallments?.reduce((sum, inst) => {
      const remaining = inst.amount - inst.paid_amount;
      return sum + (remaining > 0 ? remaining : 0);
    }, 0) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalOverdue = filteredInstallments?.reduce((sum, inst) => {
      if (!inst.due_date) return sum; // Skip flexible payments
      const dueDate = new Date(inst.due_date);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today && inst.status !== 'paid') {
        return sum + (inst.amount - inst.paid_amount);
      }
      return sum;
    }, 0) || 0;

    const totalProfit = filteredSales?.reduce((sum, sale) => {
      const profit = sale.purchase_price ? sale.sale_price - sale.purchase_price : 0;
      return sum + profit;
    }, 0) || 0;

    const salesCount = filteredSales?.length || 0;
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
  }, [filteredSales, filteredInstallments]);

  // Vendas por mês - baseado no filtro selecionado
  const salesByMonth = useMemo(() => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    let targetYear = new Date().getFullYear();

    // Determinar qual ano mostrar
    if (dateFilter === 'year') {
      targetYear = parseInt(selectedYear);
    } else if (dateFilter === 'month') {
      const [year] = selectedMonth.split('-').map(Number);
      targetYear = year;
    } else if (dateFilter === 'last7days' || dateFilter === 'last30days') {
      // Para períodos curtos, usar o ano atual
      targetYear = new Date().getFullYear();
    }

    // Inicializar todos os meses com 0
    const monthData = monthNames.map((name, index) => ({
      month: name,
      vendas: 0,
      monthIndex: index,
    }));

    // Preencher com dados filtrados
    if (filteredSales && filteredSales.length > 0) {
      filteredSales.forEach((sale) => {
        const saleDate = new Date(sale.sale_date);
        const saleYear = getYear(saleDate);
        const saleMonth = getMonth(saleDate);

        if (saleYear === targetYear) {
          monthData[saleMonth].vendas += sale.sale_price;
        }
      });
    }

    // Se for filtro de mês específico, mostrar apenas aquele mês
    if (dateFilter === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      if (year === targetYear) {
        return [monthData[month - 1]];
      }
    }

    return monthData;
  }, [filteredSales, dateFilter, selectedMonth, selectedYear]);

  const chartConfig = {
    vendas: {
      label: 'Vendas',
      color: '#14b8a6', // teal-500
    },
  } satisfies ChartConfig;

  const monthOptions = useMemo(() => {
    if (!sales || sales.length === 0) {
      // Se não há vendas, mostrar apenas o mês atual
      const now = new Date();
      return [{
        value: format(now, 'yyyy-MM'),
        label: format(now, 'MMMM yyyy', { locale: ptBR }),
      }];
    }

    // Extrair todos os meses/anos únicos que têm vendas
    const monthsWithSales = new Map<string, { year: number; month: number }>();
    sales.forEach((sale) => {
      const saleDate = new Date(sale.sale_date);
      const year = getYear(saleDate);
      const month = getMonth(saleDate) + 1; // getMonth retorna 0-11, precisamos 1-12
      const key = `${year}-${String(month).padStart(2, '0')}`;
      
      if (!monthsWithSales.has(key)) {
        monthsWithSales.set(key, { year, month });
      }
    });

    // Converter para array e ordenar do mais recente para o mais antigo
    const monthsArray = Array.from(monthsWithSales.entries())
      .map(([key, { year, month }]) => ({
        value: key,
        label: format(new Date(year, month - 1), 'MMMM yyyy', { locale: ptBR }),
        year,
        month,
      }))
      .sort((a, b) => {
        // Ordenar por ano (mais recente primeiro) e depois por mês
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        return b.month - a.month;
      });

    return monthsArray.map(({ value, label }) => ({ value, label }));
  }, [sales]);

  const yearOptions = useMemo(() => {
    if (!sales || sales.length === 0) {
      // Se não há vendas, mostrar apenas o ano atual
      const currentYear = new Date().getFullYear();
      return [{ value: String(currentYear), label: String(currentYear) }];
    }

    // Extrair todos os anos únicos que têm vendas
    const yearsWithSales = new Set<number>();
    sales.forEach((sale) => {
      const saleDate = new Date(sale.sale_date);
      const year = getYear(saleDate);
      yearsWithSales.add(year);
    });

    // Converter para array e ordenar do mais recente para o mais antigo
    const yearsArray = Array.from(yearsWithSales).sort((a, b) => b - a);

    return yearsArray.map((year) => ({
      value: String(year),
      label: String(year),
    }));
  }, [sales]);

  // Obter label do filtro atual
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
          <p className="text-sm text-gray-600 mt-2">
            Mostrando dados de: <span className="font-semibold">{getFilterLabel()}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Total Vendido</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totals.totalSold)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShoppingCart className="h-4 w-4" />
              <span>Qtd de Vendas</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{totals.salesCount}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Total Recebido</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totals.totalReceived)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span>Total a Receber</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totals.totalToReceive)}
            </p>
          </div>
        </div>

        {/* Métricas secundárias */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <AlertCircle className="h-3 w-3 text-red-600" />
              <span>Total em Atraso</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totals.totalOverdue)}
            </p>
          </div>

          {totals.totalProfit > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span>Lucro Total</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(totals.totalProfit)}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-xs text-gray-600">Ticket Médio</div>
            <p className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totals.averageTicket)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-gray-600">Taxa de Recebimento</div>
            <p className="text-lg font-bold">
              {totals.receiptRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Gráfico de vendas por mês */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Vendas por Mês {dateFilter === 'year' ? `(${selectedYear})` : dateFilter === 'month' ? `(${format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR })})` : `(${getFilterLabel()})`}
          </h3>
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <RechartsBarChart
              accessibilityLayer
              data={salesByMonth}
              margin={{ top: 30, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  const monthNames = [
                    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                  ];
                  const index = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                  ].indexOf(value);
                  return index >= 0 ? monthNames[index] : value.slice(0, 3);
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => {
                      const formatted = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      }).format(Number(value));
                      return [formatted, 'Vendas'];
                    }}
                  />
                }
              />
              <Bar
                dataKey="vendas"
                fill="var(--color-vendas)"
                radius={[6, 6, 0, 0]}
              >
              <LabelList 
                content={(props) => <SalesBarLabel {...props} />}
                position="top"
              />
              </Bar>
            </RechartsBarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
