// Componente de barra de progresso segmentada com múltiplas cores
import { cn } from '@/lib/utils';

interface Segment {
  value: number;
  color: string;
  label?: string;
}

interface SegmentedProgressBarProps {
  segments: Segment[];
  total: number;
  height?: number;
  showValues?: boolean;
  className?: string;
}

export function SegmentedProgressBar({
  segments,
  total,
  height = 16,
  showValues = true,
  className,
}: SegmentedProgressBarProps) {
  if (total === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="relative w-full rounded-full overflow-hidden bg-gray-200" style={{ height }} />
      </div>
    );
  }

  let accumulatedWidth = 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative w-full rounded-full overflow-hidden" style={{ height }}>
        {segments.map((segment, index) => {
          const segmentPercentage = (segment.value / total) * 100;
          const leftPosition = accumulatedWidth;
          accumulatedWidth += segmentPercentage;

          const hasEnoughSpace = segmentPercentage > 12;
          const showLabel = showValues && segment.value > 0 && hasEnoughSpace;

          return (
            <div
              key={index}
              className={cn('absolute inset-y-0 rounded-full flex items-center justify-center', segment.color)}
              style={{
                left: `${leftPosition}%`,
                width: `${segmentPercentage}%`,
              }}
            >
              {showLabel && (
                <span className="text-xs font-semibold text-white drop-shadow-sm whitespace-nowrap px-1">
                  {segment.label ? `${segment.label} ` : ''}
                  {segment.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

