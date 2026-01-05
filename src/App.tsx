// App principal com rotas
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Buyers } from '@/pages/admin/Buyers';
import { BuyerDetail } from '@/pages/admin/BuyerDetail';
import { Sales } from '@/pages/admin/Sales';
import { SaleDetail } from '@/pages/admin/SaleDetail';
import { SaleEdit } from '@/pages/admin/SaleEdit';
import { Payments } from '@/pages/admin/Payments';
import { PaymentUpload } from '@/pages/public/PaymentUpload';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/pay/:saleId"
        element={<PaymentUpload />}
      />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
