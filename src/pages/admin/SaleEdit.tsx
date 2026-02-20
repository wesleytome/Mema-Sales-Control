// Página de edição de venda - Mobile First
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSale } from '@/hooks/useSales';
import { SaleForm } from '@/components/sales/SaleForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function SaleEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id || '');

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Venda não encontrada</p>
        <Button asChild className="mt-4">
          <Link to="/vendas">Voltar para Vendas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/vendas/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Editar Venda</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Edite as informações da venda e parcelas
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card className="border-border/80">
        <CardContent className="p-4 sm:p-6">
          <SaleForm
            sale={sale}
            onSuccess={() => {
              navigate(`/vendas/${id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
