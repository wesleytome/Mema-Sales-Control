// Componente de input com máscara de CPF brasileiro e validação
import { forwardRef, useState } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { formatCPF, validateCPF } from '@/lib/cpf';

export interface CPFInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  validate?: boolean;
}

export const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(
  ({ value = '', onChange, onBlur, validate = true, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    const formattedValue = value ? formatCPF(value) : '';
    const effectiveIsValid = isFocused
      ? isValid
      : value && value.length === 11
      ? validateCPF(value)
      : null;
    const displayText = isFocused ? displayValue : formattedValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      const numbers = inputValue.replace(/\D/g, '');
      const limitedNumbers = numbers.slice(0, 11);

      const formatted = formatCPF(limitedNumbers);
      setDisplayValue(formatted);

      if (validate) {
        if (limitedNumbers.length === 11) {
          setIsValid(validateCPF(limitedNumbers));
        } else {
          setIsValid(null);
        }
      }

      onChange?.(limitedNumbers);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setDisplayValue(formattedValue);
      if (value) {
        setDisplayValue(formatCPF(value));
        if (validate && value.length === 11) {
          setIsValid(validateCPF(value));
        }
      }
      onBlur?.(e);
    };

    const handleFocus = () => {
      setIsFocused(true);
      setDisplayValue(formattedValue);
    };

    return (
      <div className="w-full">
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayText}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn(
            className,
            validate &&
              effectiveIsValid === false &&
              displayText.length === 14 &&
              'border-red-500 focus-visible:ring-red-500'
          )}
          placeholder={props.placeholder || '000.000.000-00'}
          maxLength={14}
        />
        {validate && effectiveIsValid === false && displayText.length === 14 && (
          <p className="text-sm text-red-500 mt-1">CPF inválido</p>
        )}
      </div>
    );
  }
);

CPFInput.displayName = 'CPFInput';
