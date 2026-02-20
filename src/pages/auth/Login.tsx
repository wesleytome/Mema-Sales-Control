// Página de login — Mobile First, premium
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LogoMark } from '@/components/ui/logo-mark';

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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao fazer login. Verifique suas credenciais.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-background" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="icon-chip logo-tile !w-16 !h-16 !rounded-2xl">
            <LogoMark className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">MEMA</h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">Gestão de Vendas</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[var(--box-shadow-widget)] space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Entrar na conta</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Digite suas credenciais para acessar</p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-700">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-sm text-rose-700">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-foreground">
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
                className="h-11"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-foreground">
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
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MEMA
        </p>
      </div>
    </div>
  );
}
