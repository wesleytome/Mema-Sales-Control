// Card de entregas com gráfico de barras
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Package } from 'lucide-react';
import type { Sale } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface DeliveriesChartCardProps {
  sales: Sale[];
  isLoading?: boolean;
}

export function DeliveriesChartCard({ sales, isLoading }: DeliveriesChartCardProps) {
  const isMobile = useIsMobile();

  // Calcular totais
  const totalSales = useMemo(() => {
    return sales?.length || 0;
  }, [sales]);

  const totalDelivered = useMemo(() => {
    return sales?.filter((s) => s.delivery_status === 'delivered').length || 0;
  }, [sales]);

  const totalPending = useMemo(() => {
    return sales?.filter((s) => s.delivery_status === 'pending').length || 0;
  }, [sales]);

  const totalSent = useMemo(() => {
    return sales?.filter((s) => s.delivery_status === 'sent').length || 0;
  }, [sales]);

  if (isLoading) {
    return (
      <Card className={isMobile ? 'w-full' : ''}>
        <CardHeader>
          <CardTitle>Entregas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={isMobile ? 'w-full' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-base sm:text-lg font-semibold">Entregas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Total de vendas vs entregas realizadas
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-2xl sm:text-3xl font-bold">
              {totalSales}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Total de vendas
            </p>
          </div>
        </div>
        <div className="relative w-full rounded-md overflow-hidden" style={{ height: 24 }}>
          {totalSales > 0 ? (
            <>
              {/* Segmento Entregue (verde teal-500 como em vendas) */}
              {totalDelivered > 0 && (
                <div
                  className="absolute inset-y-0 left-0 flex items-center justify-center bg-teal-500"
                  style={{
                    width: `${(totalDelivered / totalSales) * 100}%`,
                    borderTopLeftRadius: '0.375rem',
                    borderBottomLeftRadius: '0.375rem',
                  }}
                >
                  {(totalDelivered / totalSales) * 100 > 8 && (
                    <span className="text-xs font-semibold text-white drop-shadow-sm">
                      {totalDelivered}
                    </span>
                  )}
                </div>
              )}
              {/* Segmento Enviado (azul) */}
              {totalSent > 0 && (
                <div
                  className="absolute inset-y-0 flex items-center justify-center bg-blue-500"
                  style={{
                    left: `${(totalDelivered / totalSales) * 100}%`,
                    width: `${(totalSent / totalSales) * 100}%`,
                  }}
                >
                  {(totalSent / totalSales) * 100 > 8 && (
                    <span className="text-xs font-semibold text-white drop-shadow-sm">
                      {totalSent}
                    </span>
                  )}
                </div>
              )}
              {/* Segmento Pendente (cinza) */}
              {totalPending > 0 && (
                <div
                  className="absolute inset-y-0 flex items-center justify-center bg-gray-300"
                  style={{
                    left: `${((totalDelivered + totalSent) / totalSales) * 100}%`,
                    width: `${(totalPending / totalSales) * 100}%`,
                    borderTopRightRadius: '0.375rem',
                    borderBottomRightRadius: '0.375rem',
                  }}
                >
                  {(totalPending / totalSales) * 100 > 8 && (
                    <span className="text-xs font-semibold text-gray-700 drop-shadow-sm">
                      {totalPending}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 w-full rounded-md bg-gray-200" />
          )}
        </div>
        {totalSales > 0 && (
          <div className="text-xs text-gray-500 text-right">
            {((totalDelivered / totalSales) * 100).toFixed(1)}% entregue
          </div>
        )}
      </CardContent>
    </Card>
  );
}

