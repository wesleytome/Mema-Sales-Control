// Componente de gráfico de barra horizontal de progresso
import { cn } from '@/lib/utils';

interface ProgressBarChartProps {
  total: number;
  received: number;
  totalLabel?: string;
  receivedLabel?: string;
  totalColor?: string;
  receivedColor?: string;
  height?: number;
  showValues?: boolean;
  className?: string;
  formatType?: 'currency' | 'number';
}

export function ProgressBarChart({
  total,
  received,
  totalLabel = 'Total',
  receivedLabel = 'Recebido',
  totalColor = 'bg-gray-200',
  receivedColor = 'bg-teal-500',
  height = 12,
  showValues = true,
  className,
  formatType = 'currency',
}: ProgressBarChartProps) {
  const percentage = total > 0 ? (received / total) * 100 : 0;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const formatValue = (value: number) => {
    if (formatType === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(value);
    } else {
      return new Intl.NumberFormat('pt-BR').format(value);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showValues && (
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{receivedLabel}:</span>
            <span className="font-semibold text-gray-900">
              {formatValue(received)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{totalLabel}:</span>
            <span className="font-semibold text-gray-900">
              {formatValue(total)}
            </span>
          </div>
        </div>
      )}
      <div className="relative w-full rounded-full overflow-hidden" style={{ height }}>
        {/* Barra de fundo (total) */}
        <div className={cn('absolute inset-0 w-full rounded-full', totalColor)} />
        {/* Barra de progresso (recebido) */}
        <div
          className={cn('absolute inset-0 rounded-full transition-all duration-500', receivedColor)}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showValues && (
        <div className="text-xs text-gray-500 text-right">
          {clampedPercentage.toFixed(1)}% {formatType === 'currency' ? 'recebido' : 'entregue'}
        </div>
      )}
    </div>
  );
}

