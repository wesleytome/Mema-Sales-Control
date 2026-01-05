// Componente de input com máscara de CPF brasileiro e validação
import { forwardRef, useState, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface CPFInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  validate?: boolean;
}

// Função para validar CPF
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove formatação
  const numbers = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Valida primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;
  
  // Valida segundo dígito
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;
  
  return true;
}

export const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(
  ({ value = '', onChange, onBlur, validate = true, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isValid, setIsValid] = useState<boolean | null>(null);

    // Atualiza o valor de exibição quando o valor muda externamente
    useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatCPF(value));
        if (validate && value) {
          setIsValid(validateCPF(value));
        }
      } else {
        setDisplayValue('');
        setIsValid(null);
      }
    }, [value, validate]);

    const formatCPF = (input: string): string => {
      // Remove tudo exceto números
      const numbers = input.replace(/\D/g, '');
      
      if (!numbers) return '';
      
      // Aplica a máscara 000.000.000-00
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove tudo exceto números
      const numbers = inputValue.replace(/\D/g, '');
      
      // Limita a 11 dígitos
      const limitedNumbers = numbers.slice(0, 11);
      
      // Formata
      const formatted = formatCPF(limitedNumbers);
      setDisplayValue(formatted);
      
      // Valida se necessário
      if (validate) {
        if (limitedNumbers.length === 11) {
          setIsValid(validateCPF(limitedNumbers));
        } else {
          setIsValid(null);
        }
      }
      
      // Retorna apenas os números para o onChange
      onChange?.(limitedNumbers);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Garante que o valor está formatado ao perder o foco
      if (value) {
        setDisplayValue(formatCPF(value));
        if (validate && value.length === 11) {
          setIsValid(validateCPF(value));
        }
      }
      onBlur?.(e);
    };

    return (
      <div className="w-full">
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            className,
            validate && isValid === false && displayValue.length === 14 && 'border-red-500 focus-visible:ring-red-500'
          )}
          placeholder={props.placeholder || '000.000.000-00'}
          maxLength={14}
        />
        {validate && isValid === false && displayValue.length === 14 && (
          <p className="text-sm text-red-500 mt-1">CPF inválido</p>
        )}
      </div>
    );
  }
);

CPFInput.displayName = 'CPFInput';

