import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Priority, Ticket, TicketStatus, User } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Search,
  Filter,
  RotateCcw,
  Plus,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';

interface Props {
  onSelectTicket: (id: number) => void;
  onOpenCreateTicket: () => void;
}

export const TicketsPage: React.FC<Props> = ({
  onSelectTicket,
  onOpenCreateTicket,
}) => {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [executors, setExecutors] = useState<User[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [overdue, setOverdue] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadTickets = async (page = 0) => {
    setLoading(true);
    try {
      const data = await api.getTickets({
        search: search.trim() || undefined,
        status: status || undefined,
        priority: priority || undefined,
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        overdue: overdue || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: 10,
      });

      setTickets(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.number);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getExecutors().then(setExecutors).catch(console.error);
  }, []);

  useEffect(() => {
    loadTickets(0);
  }, [search, status, priority, assigneeId, overdue, dateFrom, dateTo]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setAssigneeId('');
    setOverdue(false);
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Реестр заявок
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Всего обращений: {totalElements}
          </p>
        </div>

        {isManager && (
          <button
            onClick={onOpenCreateTicket}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-xs shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Зарегистрировать заявку
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по номеру (например 1001), теме или названию клиента..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Статус</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TicketStatus | '')}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Все статусы</option>
              <option value="NEW">Новая (NEW)</option>
              <option value="IN_PROGRESS">В работе (IN_PROGRESS)</option>
              <option value="WAITING_CLARIFICATION">Ожидает уточнения</option>
              <option value="ON_REVIEW">На проверке (ON_REVIEW)</option>
              <option value="CLOSED">Закрыта (CLOSED)</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Приоритет</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority | '')}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Все приоритеты</option>
              <option value="HIGH">Высокий</option>
              <option value="MEDIUM">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Исполнитель</label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Все сотрудники</option>
              {executors.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Дата с</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Дата по</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* Overdue switch & Reset */}
          <div className="flex items-end gap-2">
            <label
              className={`flex-1 p-2 border rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition select-none text-[11px] font-medium ${
                overdue
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={overdue}
                onChange={e => setOverdue(e.target.checked)}
                className="hidden"
              />
              <AlertTriangle className={`w-3.5 h-3.5 ${overdue ? 'text-red-600' : 'text-slate-400'}`} />
              Просроченные
            </label>

            <button
              onClick={handleResetFilters}
              className="p-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Сбросить все фильтры"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Загрузка заявок...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Заявки по заданным критериям не найдены
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">№</th>
                    <th className="py-3 px-4">Тема и клиент</th>
                    <th className="py-3 px-4">Услуга</th>
                    <th className="py-3 px-4">Приоритет</th>
                    <th className="py-3 px-4">Статус</th>
                    <th className="py-3 px-4">Исполнитель</th>
                    <th className="py-3 px-4">Срок</th>
                    <th className="py-3 px-4">Дата создания</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {tickets.map(t => (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTicket(t.id)}
                      className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        №{t.number}
                      </td>

                      <td className="py-3.5 px-4 min-w-[220px]">
                        <p className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 line-clamp-1">
                          {t.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {t.clientName} {t.contactPerson ? `• ${t.contactPerson}` : ''}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {t.serviceTypeName || '—'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={t.priority} />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={t.status} />
                          {t.overdue && (
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                              ПРОСРОЧЕНА
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {t.assigneeName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                              {t.assigneeName[0]}
                            </span>
                            <span>{t.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Не назначен</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.dueDate ? (
                          <span
                            className={`font-medium ${
                              t.overdue
                                ? 'text-red-600 dark:text-red-400 font-semibold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {t.dueDate}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {t.createdAt.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
              <span>
                Страница {currentPage + 1} из {totalPages} (записей: {totalElements})
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 0}
                  onClick={() => loadTickets(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => loadTickets(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
