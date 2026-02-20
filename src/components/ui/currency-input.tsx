// Componente de input com máscara monetária brasileira
import { forwardRef, useState } from 'react';
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
      if (value !== undefined && value !== null && value > 0) {
        return formatCurrency(value);
      }
      return '';
    });
    const [isFocused, setIsFocused] = useState(false);

    const formattedValue =
      value !== undefined && value !== null && value > 0 ? formatCurrency(value) : '';
    const currentDisplayValue = isFocused ? displayValue : formattedValue;

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
      setDisplayValue(formattedValue);
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setDisplayValue(formattedValue);
      props.onFocus?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={currentDisplayValue}
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
