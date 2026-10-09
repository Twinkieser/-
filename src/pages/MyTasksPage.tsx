import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Ticket } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';

interface Props {
  onSelectTicket: (id: number) => void;
}

export const MyTasksPage: React.FC<Props> = ({ onSelectTicket }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const overdueTasks = tasks.filter(t => t.overdue);
  const regularTasks = tasks.filter(t => !t.overdue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Мои активные задачи
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Заявки, назначенные на {user?.fullName}. Сортировка по ближайшим дедлайнам.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 self-start sm:self-auto">
          В работе: {tasks.length}
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Загрузка ваших задач...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Все задачи выполнены!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            У вас нет открытых заявок в работе. Менеджер назначит новые задачи по мере регистрации обращений клиентов.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue alert section if any */}
          {overdueTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>СРОЧНО: Просроченные задачи ({overdueTasks.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overdueTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="p-5 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl cursor-pointer hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-red-700 dark:text-red-300">
                          №{t.number}
                        </span>
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                      <span className="text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-200/80 dark:bg-red-900/60 px-2 py-0.5 rounded">
                        Дедлайн: {t.dueDate}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {t.subject}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {t.clientName}
                      </span>
                      <span className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-1">
                        Перейти к выполнению <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Tasks Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Задачи в графике ({regularTasks.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:shadow-md hover:border-indigo-300 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          №{t.number}
                        </span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <StatusBadge status={t.status} />
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                      {t.subject}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 truncate max-w-[120px]">
                      {t.clientName}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {t.dueDate || 'Без срока'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
