import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.getCurrentUser();
          navigate('/');
        } catch {
          authService.logout();
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(login, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-400/5 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        {/* Логотип ZemBook */}
        <div className="flex flex-col items-center mb-6">
          <svg width="160" height="60" viewBox="0 0 260 80" className="drop-shadow-lg mb-3">
            <text x="20" y="50" fontFamily="Arial, sans-serif" fontSize="42" fontWeight="bold" fill="#F97316">
              Zem
            </text>
            <text x="125" y="50" fontFamily="Arial, sans-serif" fontSize="42" fontWeight="bold" fill="#1E293B">
              Book
            </text>
            <path d="M 35 62 Q 130 57 225 62" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
          <p className="text-slate-600 text-sm font-medium tracking-wide text-center">
            Агрегатор земельного рынка России
          </p>
        </div>

        <h1 className="text-2xl font-bold text-center mb-8 text-slate-900">
          Вход в систему
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <Icon name="AlertCircle" size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Логин
            </label>
            <Input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              required
              disabled={loading}
              className="h-12 bg-slate-900 text-white placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Пароль
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              disabled={loading}
              className="h-12 bg-slate-900 text-white placeholder:text-slate-500 border-0 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Вход...
              </div>
            ) : (
              'Войти'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}