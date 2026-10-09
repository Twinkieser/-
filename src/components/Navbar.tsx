import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Layers,
  Terminal,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Menu,
  ChevronDown,
} from 'lucide-react';

interface Props {
  onOpenLogs: () => void;
  onOpenAutoTest: () => void;
  onToggleSidebar: () => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<Props> = ({
  onOpenLogs,
  onOpenAutoTest,
  onToggleSidebar,
  onRefreshData,
}) => {
  const { user, logout } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleResetDemo = async () => {
    if (!window.confirm('Сбросить базу данных к начальному состоянию (15 демо-заявок, 5 клиентов)?')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoData();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Меню"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
                  ClientDesk
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                  CRM & Service Desk
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block -mt-0.5">
                Система учёта и обработки клиентских заявок
              </p>
            </div>
          </div>
        </div>

        {/* Right tools and User menu */}
        <div className="flex items-center gap-2">
          {/* Acceptance test runner button */}
          <button
            onClick={onOpenAutoTest}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Запустить контрольный сценарий приёмки (7 шагов + негативные тесты)"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Автотесты</span>
          </button>

          {/* Event log viewer button */}
          {user?.role === 'MANAGER' && (
            <button
              onClick={onOpenLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition"
              title="Открыть журнал событий (logs/events.log)"
            >
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Журнал</span>
            </button>
          )}

          {/* Reset demo data */}
          {user?.role === 'MANAGER' && (
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Сбросить демо-данные"
            >
              <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* User profile badge & logout */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user?.fullName ? user.fullName[0] : 'U'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {user?.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'} (@{user?.login})
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-white">{user?.fullName}</p>
                  <p className="text-slate-400 text-[11px]">Логин: {user?.login}</p>
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      user?.role === 'MANAGER'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {user?.role === 'MANAGER' ? 'Менеджер (Полный доступ)' : 'Исполнитель (Назначенные задачи)'}
                  </span>
                </div>

                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из системы
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
