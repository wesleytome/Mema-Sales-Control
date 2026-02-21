// App principal com rotas
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { ForceTheme } from '@/components/layout/ForceTheme';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Buyers } from '@/pages/admin/Buyers';
import { BuyerDetail } from '@/pages/admin/BuyerDetail';
import { Sales } from '@/pages/admin/Sales';
import { SaleDetail } from '@/pages/admin/SaleDetail';
import { SaleEdit } from '@/pages/admin/SaleEdit';
import { Payments } from '@/pages/admin/Payments';
import { PaymentUpload } from '@/pages/public/PaymentUpload';
import { CustomerHome } from '@/pages/public/CustomerHome';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/customer/:saleId"
        element={
          <ForceTheme theme="light">
            <CustomerHome />
          </ForceTheme>
        }
      />
      <Route
        path="/user/:saleId"
        element={
          <ForceTheme theme="light">
            <CustomerHome />
          </ForceTheme>
        }
      />
      <Route
        path="/customer/:seedSaleId/compra/:saleId"
        element={
          <ForceTheme theme="light">
            <PaymentUpload />
          </ForceTheme>
        }
      />
      <Route
        path="/user/:seedSaleId/compra/:saleId"
        element={
          <ForceTheme theme="light">
            <PaymentUpload />
          </ForceTheme>
        }
      />
      <Route path="/pay/:saleId" element={<LegacyPayRedirect />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compradores"
        element={
          <ProtectedRoute>
            <Layout>
              <Buyers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compradores/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <BuyerDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <Layout>
              <Sales />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <SaleDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas/:id/editar"
        element={
          <ProtectedRoute>
            <Layout>
              <SaleEdit />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagamentos"
        element={
          <ProtectedRoute>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function LegacyPayRedirect() {
  const { saleId } = useParams<{ saleId: string }>();
  if (!saleId) return <Navigate to="/login" replace />;
  return <Navigate to={`/customer/${saleId}`} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
