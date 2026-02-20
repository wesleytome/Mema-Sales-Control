// Componente de input com máscara de telefone brasileiro
import { forwardRef, useState } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const formatPhone = (input: string): string => {
  const numbers = input.replace(/\D/g, '');

  if (!numbers) return '';

  if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, onBlur, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const formattedValue = value ? formatPhone(value) : '';
    const displayText = isFocused ? displayValue : formattedValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numbers = inputValue.replace(/\D/g, '');
      const limitedNumbers = numbers.slice(0, 11);
      const formatted = formatPhone(limitedNumbers);
      setDisplayValue(formatted);
      onChange?.(limitedNumbers);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setDisplayValue(formattedValue);
      onBlur?.(e);
    };

    const handleFocus = () => {
      setIsFocused(true);
      setDisplayValue(formattedValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="tel"
        value={displayText}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn(className)}
        placeholder={props.placeholder || '(00) 00000-0000'}
        maxLength={15}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
