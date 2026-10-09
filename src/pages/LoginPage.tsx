import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, ShieldCheck, UserCheck, Lock, User, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Введите логин и пароль');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    login(u, p).catch(err => setError(err.message));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ClientDesk CRM
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1">
            Система учёта и обработки клиентских заявок
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-base font-semibold text-white mb-1">
            Вход в систему
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Введите учётные данные для авторизации
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Логин
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Логин"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              {loading ? 'Авторизация...' : 'Войти в систему'}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Быстрый вход для проверки:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 flex items-center justify-between group transition"
              >
                <div>
                  <span className="font-semibold text-indigo-400">👨‍💼 Менеджер</span>: admin
                  <p className="text-[10px] text-slate-400">Клиенты, назначение, закрытие, отчёты</p>
                </div>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                  admin123
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ivan', 'ivan123')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 flex items-center justify-between group transition"
              >
                <div>
                  <span className="font-semibold text-emerald-400">👨‍🔧 Исполнитель</span>: ivan
                  <p className="text-[10px] text-slate-400">Назначенные заявки, работа, результат</p>
                </div>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                  ivan123
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('anna', 'anna123')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 flex items-center justify-between group transition"
              >
                <div>
                  <span className="font-semibold text-amber-400">👩‍💻 Исполнитель</span>: anna
                  <p className="text-[10px] text-slate-400">Назначенные заявки, передача на проверку</p>
                </div>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                  anna123
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Spring Security + JWT • BCrypt хеширование • RBAC авторизация</span>
        </div>
      </div>
    </div>
  );
};
