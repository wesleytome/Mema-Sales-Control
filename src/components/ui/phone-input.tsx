// Componente de input com máscara de telefone brasileiro
import { forwardRef, useState, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, onBlur, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    // Atualiza o valor de exibição quando o valor muda externamente
    useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatPhone(value));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const formatPhone = (input: string): string => {
      // Remove tudo exceto números
      const numbers = input.replace(/\D/g, '');
      
      if (!numbers) return '';
      
      // Aplica a máscara (21) 99999-9999
      if (numbers.length <= 2) {
        return `(${numbers}`;
      } else if (numbers.length <= 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove tudo exceto números
      const numbers = inputValue.replace(/\D/g, '');
      
      // Limita a 11 dígitos (DDD + 9 dígitos)
      const limitedNumbers = numbers.slice(0, 11);
      
      // Formata
      const formatted = formatPhone(limitedNumbers);
      setDisplayValue(formatted);
      
      // Retorna apenas os números para o onChange
      onChange?.(limitedNumbers);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Garante que o valor está formatado ao perder o foco
      if (value) {
        setDisplayValue(formatPhone(value));
      }
      onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="tel"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(className)}
        placeholder={props.placeholder || '(00) 00000-0000'}
        maxLength={15}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

