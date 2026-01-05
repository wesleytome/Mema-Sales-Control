// Componente de autocomplete para produtos similares
import { useState, useEffect, useRef } from 'react';
import { useProductSuggestions } from '@/hooks/useProductSuggestions';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface ProductAutocompleteProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function ProductAutocomplete({
  value = '',
  onChange,
  onBlur,
  className,
  ...props
}: ProductAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isLoading } = useProductSuggestions(searchTerm, 10);

  // Atualiza searchTerm quando value muda externamente
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange?.(newValue);
    setIsOpen(newValue.length >= 2);
  };

  const handleSelect = (suggestion: string) => {
    setSearchTerm(suggestion);
    onChange?.(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay para permitir clique na sugestão
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        onBlur?.(e);
      }
    }, 200);
  };

  const showSuggestions = isOpen && suggestions.length > 0 && searchTerm.length >= 2;

  return (
    <div className="relative w-full">
      <Input
        {...props}
        ref={inputRef}
        value={searchTerm}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className}
        placeholder={props.placeholder || 'Ex: Geladeira Brastemp'}
      />
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="p-2 text-sm text-gray-500">Buscando...</div>
            ) : (
              suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    suggestion.toLowerCase() === searchTerm.toLowerCase() && 'bg-accent'
                  )}
                  onClick={() => handleSelect(suggestion)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {suggestion}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

