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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        {/* Логотип */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <svg width="120" height="50" viewBox="0 0 200 80" className="drop-shadow-lg">
              <text x="10" y="50" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#F97316">
                Zem
              </text>
              <text x="100" y="50" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#1E293B">
                Book
              </text>
              <path d="M 30 60 Q 100 55 170 60" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-slate-600 text-sm font-medium tracking-wide">
            Агрегатор земельного рынка
          </p>
        </div>

        <h1 className="text-2xl font-bold text-center mb-8 text-slate-800">
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
              className="h-12 bg-slate-50 border-slate-300 focus:border-orange-500 focus:ring-orange-500/20"
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
              className="h-12 bg-slate-50 border-slate-300 focus:border-orange-500 focus:ring-orange-500/20"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/30 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Вход...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icon name="LogIn" size={18} />
                Войти
              </div>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Icon name="Shield" size={14} />
            <span>Защищённое соединение</span>
          </div>
        </div>
      </div>
    </div>
  );
}