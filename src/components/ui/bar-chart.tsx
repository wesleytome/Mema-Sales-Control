// Componente de gráfico de barras simples
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface BarChartData {
  label: string;
  value: number;
  formattedValue?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  barColor?: string;
  highlightColor?: string;
  highlightIndex?: number;
  className?: string;
  showValues?: boolean;
}

export function BarChart({
  data,
  height = 200,
  barColor = 'bg-teal-200',
  highlightColor = 'bg-teal-500',
  highlightIndex,
  className,
  showValues = true,
}: BarChartProps) {
  const maxValue = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-400', className)} style={{ height }}>
        <p className="text-sm">Sem dados</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const isHighlighted = highlightIndex === index;
          const formattedValue = item.formattedValue || item.value.toString();

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
              {showValues && (
                <span className="text-xs font-semibold text-gray-700 mb-1">
                  {formattedValue}
                </span>
              )}
              <div
                className={cn(
                  'w-full rounded-t transition-all duration-300 hover:opacity-80',
                  isHighlighted ? highlightColor : barColor
                )}
                style={{ height: `${barHeight}%`, minHeight: barHeight > 0 ? '4px' : '0' }}
                title={`${item.label}: ${formattedValue}`}
              />
              <span className="text-xs text-gray-600 mt-1 text-center leading-tight">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}



