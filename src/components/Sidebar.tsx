import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  CheckSquare,
  Users2,
  FolderTree,
  BarChart3,
  UserCog,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'tickets'
  | 'my-tasks'
  | 'clients'
  | 'services'
  | 'reports'
  | 'users';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  myTasksCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  myTasksCount = 0,
}) => {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Главная панель',
      icon: LayoutDashboard,
      roles: ['MANAGER', 'EXECUTOR'],
    },
    {
      id: 'tickets' as NavTab,
      label: 'Все заявки',
      icon: TicketIcon,
      roles: ['MANAGER', 'EXECUTOR'],
    },
    {
      id: 'my-tasks' as NavTab,
      label: 'Мои задачи',
      icon: CheckSquare,
      badge: myTasksCount > 0 ? myTasksCount : null,
      roles: ['EXECUTOR', 'MANAGER'],
    },
    {
      id: 'clients' as NavTab,
      label: 'Клиенты',
      icon: Users2,
      roles: ['MANAGER', 'EXECUTOR'],
    },
    {
      id: 'services' as NavTab,
      label: 'Справочник услуг',
      icon: FolderTree,
      roles: ['MANAGER', 'EXECUTOR'],
    },
    {
      id: 'reports' as NavTab,
      label: 'Отчёты и аналитика',
      icon: BarChart3,
      roles: ['MANAGER'],
      managerOnly: true,
    },
    {
      id: 'users' as NavTab,
      label: 'Пользователи',
      icon: UserCog,
      roles: ['MANAGER'],
      managerOnly: true,
    },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.managerOnly && !isManager) return false;
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64">
      {/* Mobile close button header */}
      <div className="p-4 flex md:hidden items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <span className="font-semibold text-slate-900 dark:text-white text-sm">
          Навигация
        </span>
        <button
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Основное меню
        </div>

        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-indigo-700'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role info footer card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
            {isManager ? 'Режим Менеджера' : 'Режим Исполнителя'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {isManager
            ? 'Регистрация клиентов, распределение задач, проверка результатов и отчёты.'
            : 'Ведение назначенных заявок, статусы, комментарии и передача на проверку.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
