// Componente de input de CEP com busca automática
import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface CEPInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onAddressFound?: (address: {
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
    complemento?: string;
  }) => void;
  disabled?: boolean;
  className?: string;
}

export function CEPInput({
  value,
  onChange,
  onBlur,
  onAddressFound,
  disabled,
  className,
}: CEPInputProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatCEP = (cep: string): string => {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    onChange(formatted);
  };

  const handleSearch = async () => {
    const cepNumbers = value.replace(/\D/g, '');
    
    if (cepNumbers.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        setIsLoading(false);
        return;
      }

      if (onAddressFound) {
        onAddressFound({
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
          complemento: data.complemento || '',
        });
      }

      toast.success('Endereço encontrado!');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onKeyPress={handleKeyPress}
        placeholder="00000-000"
        maxLength={9}
        disabled={disabled || isLoading}
        className={className}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleSearch}
        disabled={disabled || isLoading || value.replace(/\D/g, '').length !== 8}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

