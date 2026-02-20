// Página de detalhes do comprador - Mobile First
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBuyer } from '@/hooks/useBuyers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, MapPin, ExternalLink, User, Phone, Mail, Hash, Home } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Buyer } from '@/types';

// Funções auxiliares para formatação
const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length < 10) return phone;
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const formatCEP = (cep: string): string => {
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length !== 8) return cep;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

const buildGoogleMapsUrl = (buyer: Buyer): string => {
  const parts: string[] = [];
  
  if (buyer.address) parts.push(buyer.address);
  if (buyer.address_number) parts.push(buyer.address_number);
  if (buyer.neighborhood) parts.push(buyer.neighborhood);
  if (buyer.city) parts.push(buyer.city);
  if (buyer.state) parts.push(buyer.state);
  if (buyer.cep) parts.push(buyer.cep);
  
  const address = parts.join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

export function BuyerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: buyer, isLoading } = useBuyer(id || '');

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Comprador não encontrado</p>
          <Button asChild className="mt-4">
            <Link to="/compradores">Voltar para Compradores</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasAddress = buyer.cep || buyer.address || buyer.city || buyer.state;
  const googleMapsUrl = hasAddress ? buildGoogleMapsUrl(buyer) : null;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/compradores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{buyer.name}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Detalhes do comprador</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            navigate('/compradores', { state: { editBuyerId: buyer.id } });
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Nome</p>
              <p className="font-medium">{buyer.name}</p>
            </div>
            {buyer.cpf && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  CPF
                </p>
                <p className="font-medium">{formatCPF(buyer.cpf)}</p>
              </div>
            )}
            {buyer.phone && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </p>
                <p className="font-medium">{formatPhone(buyer.phone)}</p>
              </div>
            )}
            {buyer.email && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium">{buyer.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasAddress ? (
              <>
                {buyer.cep && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">CEP</p>
                    <p className="font-medium">{formatCEP(buyer.cep)}</p>
                  </div>
                )}
                {buyer.address && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Logradouro</p>
                    <p className="font-medium">
                      {buyer.address}
                      {buyer.address_number && `, ${buyer.address_number}`}
                      {buyer.address_complement && ` - ${buyer.address_complement}`}
                    </p>
                  </div>
                )}
                {buyer.neighborhood && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Bairro</p>
                    <p className="font-medium">{buyer.neighborhood}</p>
                  </div>
                )}
                {(buyer.city || buyer.state) && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Cidade / Estado</p>
                    <p className="font-medium">
                      {buyer.city || ''}
                      {buyer.city && buyer.state ? ' / ' : ''}
                      {buyer.state || ''}
                    </p>
                  </div>
                )}
                {buyer.address_reference && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Referência</p>
                    <p className="font-medium">{buyer.address_reference}</p>
                  </div>
                )}
                {googleMapsUrl && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(googleMapsUrl, '_blank')}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Ver no Google Maps
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Nenhum endereço cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
