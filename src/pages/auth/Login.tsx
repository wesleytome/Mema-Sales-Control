// Página de login — Mobile First, premium
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900" />

      {/* Decorative blobs */}
      <div className="absolute top-1/4 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute bottom-1/4 -right-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="icon-chip gradient-brand !w-16 !h-16 !rounded-2xl shadow-2xl shadow-indigo-500/40">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Vendas Parceladas</h1>
            <p className="text-sm text-white/50 mt-0.5 font-medium tracking-wide uppercase">Sistema de Gestão</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">Entrar na conta</h2>
            <p className="text-sm text-white/50 mt-0.5">Digite suas credenciais para acessar</p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-rose-500/40 bg-rose-500/20 text-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-300" />
              <AlertDescription className="text-sm text-rose-200">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-400 focus:ring-indigo-400/30"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-white/80">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-indigo-400 focus:ring-indigo-400/30"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold gradient-brand border-0 shadow-lg shadow-indigo-500/30 hover:opacity-90 hover:shadow-indigo-500/50 transition-all"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30">
          © {new Date().getFullYear()} Vendas Parceladas
        </p>
      </div>
    </div>
  );
}
