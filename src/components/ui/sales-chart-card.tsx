// Card de vendas com gráfico de barras
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { DollarSign } from 'lucide-react';
import type { Sale, Installment } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface SalesChartCardProps {
  sales: Sale[];
  installments: Installment[];
  isLoading?: boolean;
}


export function SalesChartCard({ sales, installments, isLoading }: SalesChartCardProps) {
  const isMobile = useIsMobile();

  // Calcular total vendido
  const totalSold = useMemo(() => {
    return sales?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
  }, [sales]);

  // Calcular total recebido (soma de paid_amount de todas as parcelas)
  const totalReceived = useMemo(() => {
    return installments?.reduce((sum, inst) => sum + inst.paid_amount, 0) || 0;
  }, [installments]);

  if (isLoading) {
    return (
      <Card className={isMobile ? 'w-full' : ''}>
        <CardHeader>
          <CardTitle>Vendas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={isMobile ? 'w-full' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-base sm:text-lg font-semibold">Vendas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Total vendido vs recebido
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-2xl sm:text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(totalSold)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Total vendido
            </p>
          </div>
        </div>
        <div className="relative w-full rounded-full overflow-hidden" style={{ height: 24 }}>
          {/* Barra de fundo (total) */}
          <div className="absolute inset-0 w-full rounded-full bg-gray-200" />
          {/* Barra de progresso (recebido) */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-500 bg-teal-500 flex items-center justify-center"
            style={{
              width: `${totalSold > 0 ? Math.min(100, Math.max(0, (totalReceived / totalSold) * 100)) : 0}%`,
            }}
          >
            {totalReceived > 0 && (totalReceived / totalSold) * 100 > 8 && (
              <span className="text-xs font-semibold text-white drop-shadow-sm">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(totalReceived)}
              </span>
            )}
          </div>
        </div>
        {totalSold > 0 && (
          <div className="text-xs text-gray-500 text-right">
            {((totalReceived / totalSold) * 100).toFixed(1)}% recebido
          </div>
        )}
      </CardContent>
    </Card>
  );
}

