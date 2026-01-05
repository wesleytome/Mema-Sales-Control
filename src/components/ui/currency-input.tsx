// Componente de input com máscara monetária brasileira
import { forwardRef, useState, useEffect } from 'react';
import { Input } from './input';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: number;
  onChange?: (value: number) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onChange, onBlur, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => {
      // Inicializa com o valor formatado se existir
      if (value !== undefined && value !== null && value > 0) {
        return formatCurrency(value);
      }
      return '';
    });
    const [isFocused, setIsFocused] = useState(false);

    // Atualiza o valor de exibição quando o valor numérico muda externamente
    useEffect(() => {
      if (!isFocused && value !== undefined && value !== null) {
        if (value > 0) {
          setDisplayValue(formatCurrency(value));
        } else {
          setDisplayValue('');
        }
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove tudo exceto números
      const numbers = inputValue.replace(/\D/g, '');
      
      if (!numbers || numbers === '0') {
        setDisplayValue('');
        onChange?.(0);
        return;
      }

      // Converte para número (os dois últimos dígitos são centavos)
      const numeric = parseFloat(numbers) / 100;
      
      // Formata enquanto digita
      const formatted = formatCurrency(numeric);
      setDisplayValue(formatted);
      onChange?.(numeric);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Garante que o valor está formatado ao perder o foco
      if (value !== undefined && value !== null && value > 0) {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue('');
      }
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Mantém a formatação ao focar para melhor UX
      if (value && value > 0) {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue('');
      }
      props.onFocus?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn(className)}
        placeholder={props.placeholder || 'R$ 0,00'}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

