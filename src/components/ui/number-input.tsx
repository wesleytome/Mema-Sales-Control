// Componente de input numérico com botões de incremento/decremento
import { forwardRef, useState, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value = 0, onChange, min = 0, max, step = 1, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => {
      return value?.toString() || '';
    });
    const [isFocused, setIsFocused] = useState(false);

    // Sincroniza o valor exibido quando o valor externo muda (mas não quando está focado)
    useEffect(() => {
      if (!isFocused && value !== undefined && value !== null) {
        setDisplayValue(value.toString());
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Permite campo vazio para facilitar a edição
      if (inputValue === '') {
        setDisplayValue('');
        // Não chama onChange quando está vazio, permite que o usuário apague completamente
        return;
      }
      
      // Remove tudo exceto números
      const numbers = inputValue.replace(/\D/g, '');
      
      if (!numbers) {
        setDisplayValue('');
        return;
      }
      
      const numericValue = parseInt(numbers, 10);
      
      // Se o valor for inválido, mantém o que foi digitado mas não atualiza o onChange
      if (isNaN(numericValue)) {
        setDisplayValue(inputValue);
        return;
      }
      
      // Aplica min e max
      let finalValue = numericValue;
      if (min !== undefined && finalValue < min) {
        finalValue = min;
      }
      if (max !== undefined && finalValue > max) {
        finalValue = max;
      }
      
      setDisplayValue(finalValue.toString());
      onChange?.(finalValue);
    };

    const handleIncrement = () => {
      const currentValue = value || min || 0;
      const newValue = max !== undefined ? Math.min(currentValue + step, max) : currentValue + step;
      setDisplayValue(newValue.toString());
      onChange?.(newValue);
    };

    const handleDecrement = () => {
      const currentValue = value || min || 0;
      const newValue = min !== undefined ? Math.max(currentValue - step, min) : currentValue - step;
      setDisplayValue(newValue.toString());
      onChange?.(newValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Se o campo estiver vazio, define o valor mínimo
      if (displayValue === '' || displayValue.trim() === '') {
        const defaultValue = min !== undefined ? min : 1;
        setDisplayValue(defaultValue.toString());
        onChange?.(defaultValue);
      } else {
        // Garante que o valor está dentro dos limites
        const numericValue = parseInt(displayValue, 10);
        if (isNaN(numericValue)) {
          const defaultValue = min !== undefined ? min : 1;
          setDisplayValue(defaultValue.toString());
          onChange?.(defaultValue);
        } else {
          let finalValue = numericValue;
          if (min !== undefined && finalValue < min) {
            finalValue = min;
          }
          if (max !== undefined && finalValue > max) {
            finalValue = max;
          }
          if (finalValue !== numericValue) {
            setDisplayValue(finalValue.toString());
            onChange?.(finalValue);
          }
        }
      }
      props.onBlur?.(e);
    };

    return (
      <div className="relative flex items-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-r-none border-r-0 shrink-0"
          onClick={handleDecrement}
          disabled={min !== undefined && (value || min || 0) <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            handleBlur(e);
          }}
          className={cn(
            'text-center rounded-none border-x-0 h-10',
            className
          )}
          min={min}
          max={max}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-l-none border-l-0 shrink-0"
          onClick={handleIncrement}
          disabled={max !== undefined && (value || min || 0) >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

