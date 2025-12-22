// Dashboard operacional
import { useSales } from '@/hooks/useSales';
import { useInstallments } from '@/hooks/useInstallments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, DollarSign, Calendar, TrendingUp, Bell } from 'lucide-react';
import { format, isToday, isAfter, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: allInstallments, isLoading: installmentsLoading } = useInstallments();

  if (salesLoading || installmentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const today = new Date();
  const threeDaysFromNow = addDays(today, 3);

  // Calcular totais
  const totalSold = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

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
  const overdue = allInstallments?.filter(
    (inst) => {
      const dueDate = new Date(inst.due_date);
      return dueDate < today && inst.status !== 'paid';
    }
  ) || [];

  // Calcular recebimentos da semana
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekPayments = allInstallments?.filter(
    (inst) => {
      const dueDate = new Date(inst.due_date);
      return (
        dueDate >= startOfWeek &&
        dueDate <= today &&
        (inst.status === 'paid' || inst.paid_amount > 0)
      );
    }
  ) || [];
  const totalWeek = weekPayments.reduce((sum, inst) => sum + inst.paid_amount, 0);

  // Calcular recebimentos do mês
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthPayments = allInstallments?.filter(
    (inst) => {
      const dueDate = new Date(inst.due_date);
      return (
        dueDate >= startOfMonth &&
        dueDate <= today &&
        (inst.status === 'paid' || inst.paid_amount > 0)
      );
    }
  ) || [];
  const totalMonth = monthPayments.reduce((sum, inst) => sum + inst.paid_amount, 0);

  // Próximos recebimentos (ordenado por data)
  const upcomingPayments = allInstallments
    ?.filter((inst) => {
      const dueDate = new Date(inst.due_date);
      return dueDate >= today && inst.status !== 'paid';
    })
    .sort((a, b) => {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 10) || [];

  // Últimas vendas
  const recentSales = sales?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral da operação</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalSold)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido (Semana)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalWeek)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalMonth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
            <p className="text-xs text-muted-foreground">Parcelas atrasadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de parcelas */}
      {(dueToday.length > 0 || dueIn3Days.length > 0 || overdue.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção!</AlertTitle>
              <AlertDescription>
                Você tem {overdue.length} parcela(s) atrasada(s).{' '}
                <Link to="/pagamentos" className="underline">
                  Ver pagamentos
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {dueToday.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vencendo Hoje</AlertTitle>
              <AlertDescription>
                {dueToday.length} parcela(s) vence(m) hoje.
              </AlertDescription>
            </Alert>
          )}

          {dueIn3Days.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vencendo em Breve</AlertTitle>
              <AlertDescription>
                {dueIn3Days.length} parcela(s) vence(m) nos próximos 3 dias.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos recebimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Recebimentos</CardTitle>
            <CardDescription>Ordenado por data de vencimento</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPayments.map((inst) => {
                    const daysUntilDue = differenceInDays(new Date(inst.due_date), today);
                    return (
                      <TableRow key={inst.id}>
                        <TableCell>
                          {format(new Date(inst.due_date), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                          {daysUntilDue <= 3 && (
                            <span className="ml-2 text-xs text-orange-600">
                              (em {daysUntilDue} dia(s))
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(inst.amount)}
                        </TableCell>
                        <TableCell>
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
                            {inst.status === 'paid'
                              ? 'Pago'
                              : inst.status === 'late'
                              ? 'Atrasado'
                              : inst.status === 'partial'
                              ? 'Parcial'
                              : 'Pendente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Nenhum recebimento pendente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Últimas vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
            <CardDescription>As 5 vendas mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.sale_date), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/vendas/${sale.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {sale.product_description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(sale.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">Nenhuma venda cadastrada</p>
            )}
            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                <Link to="/vendas">Ver todas as vendas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

