import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { DashboardStats, Ticket } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Sparkles,
  Clock,
  FileCheck2,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface Props {
  onOpenCreateTicket: () => void;
  onOpenCreateClient: () => void;
  onSelectTicket: (ticketId: number) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardPage: React.FC<Props> = ({
  onOpenCreateTicket,
  onOpenCreateClient,
  onSelectTicket,
  onNavigateToTab,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const isManager = user?.role === 'MANAGER';

  const loadData = async () => {
    try {
      const [s, t] = await Promise.all([
        api.getDashboardStats(),
        api.getTickets({ size: 6 }),
      ]);
      setStats(s);
      setRecentTickets(t.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Загрузка сводки дашборда...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Добро пожаловать, {user?.fullName}!
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            {isManager
              ? 'Панель управления клиентскими заявками и контролем исполнения сроков.'
              : 'Рабочий стол исполнителя: текущие задачи и заявки, ожидающие действий.'}
          </p>
        </div>
        {isManager && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCreateTicket}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              Создать заявку
            </button>
            <button
              onClick={onOpenCreateClient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition"
            >
              <Building2 className="w-4 h-4" />
              Новый клиент
            </button>
          </div>
        )}
      </div>

      {/* 4 Main KPI Counter Cards (Новые, В работе, На проверке, Просроченные) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Новые */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Новые заявки
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.newCount}
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Ожидают взятия в работу
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* В работе */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              В работе
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.inProgressCount}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              Текущие задачи инженеров
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* На проверке */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              На проверке
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.onReviewCount}
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
              Ожидают приёмки менеджера
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Просроченные */}
        <div className={`p-5 rounded-xl border shadow-xs flex items-center justify-between transition ${
          stats.overdueCount > 0
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div>
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              Просроченные
            </p>
            <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
              {stats.overdueCount}
            </h3>
            <p className="text-[11px] text-red-500 mt-0.5 font-medium">
              Срок меньше сегодня & статус != CLOSED
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/60 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-300 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Overdue alert banner if any */}
      {stats.overdueCount > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-semibold text-red-900 dark:text-red-200">
              Внимание: обнаружено {stats.overdueCount} просроченных заявок!
            </span>
            <p className="text-red-700 dark:text-red-300 mt-0.5">
              Сроки исполнения истекли, но заявки ещё не переведены в статус CLOSED.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('tickets')}
            className="text-xs font-semibold text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-white underline whitespace-nowrap"
          >
            Смотреть в списке →
          </button>
        </div>
      )}

      {/* Grid: Status pipeline + Recent tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overall pipeline distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Воронка жизненного цикла
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              Всего: {stats.totalTickets}
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Новые (NEW)', count: stats.newCount, color: 'bg-blue-500' },
              { label: 'В работе (IN_PROGRESS)', count: stats.inProgressCount, color: 'bg-amber-500' },
              { label: 'Ожидают уточнения', count: stats.waitingClarificationCount, color: 'bg-purple-500' },
              { label: 'На проверке (ON_REVIEW)', count: stats.onReviewCount, color: 'bg-indigo-500' },
              { label: 'Закрытые (CLOSED)', count: stats.closedCount, color: 'bg-emerald-500' },
            ].map((item, idx) => {
              const pct = stats.totalTickets > 0 ? Math.round((item.count / stats.totalTickets) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Закрыто заявок: {stats.closedCount}</span>
            <span>Просрочено: {stats.overdueCount}</span>
          </div>
        </div>

        {/* Right 2 cols: Recent tickets */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Последние зарегистрированные заявки
              </h3>
              <button
                onClick={() => onNavigateToTab('tickets')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Все заявки <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 px-2 rounded-lg cursor-pointer transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        №{t.number}
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      {t.overdue && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                          ПРОСРОЧЕНА
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.subject}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Клиент: {t.clientName} • Исполнитель: {t.assigneeName || 'Не назначен'}
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <span className="block font-medium text-slate-700 dark:text-slate-300">
                      {t.dueDate ? `Срок: ${t.dueDate}` : 'Без срока'}
                    </span>
                    <span>{t.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
