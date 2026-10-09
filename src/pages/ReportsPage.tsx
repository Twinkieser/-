import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { ReportSummary, Ticket } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  BarChart3,
  Download,
  Calendar,
  AlertTriangle,
  User,
  PieChart,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  onSelectTicket: (ticketId: number) => void;
}

export const ReportsPage: React.FC<Props> = ({ onSelectTicket }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  // Date filters (defaults: last 30 days to today)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReportSummary(fromDate, toDate);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [fromDate, toDate]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await api.downloadCsv(fromDate, toDate);
    } catch (err: any) {
      alert(err.message || 'Ошибка выгрузки CSV');
    } finally {
      setExporting(false);
    }
  };

  if (!isManager) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl">
        <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
          Доступ ограничен
        </h3>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Раздел отчётов и аналитики доступен исключительно для сотрудников с ролью MANAGER.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Отчёты и аналитика по заявкам
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Сводные метрики, распределение нагрузки и выгрузка в формат CSV
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-slate-400 ml-1.5" />
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-transparent text-xs p-1 focus:outline-none"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-transparent text-xs p-1 focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting ? 'Экспорт...' : 'Экспорт в CSV'}
          </button>
        </div>
      </div>

      {loading || !report ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Формирование отчёта за выбранный период...
        </div>
      ) : (
        <>
          {/* Summary counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 block font-medium">Всего за период</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {report.totalTickets}
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-blue-500 block font-medium">Новые</span>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1 block">
                {report.newCount}
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-amber-500 block font-medium">В работе</span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1 block">
                {report.inProgressCount}
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-purple-500 block font-medium">Уточнение</span>
              <span className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1 block">
                {report.waitingClarificationCount}
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-indigo-500 block font-medium">На проверке</span>
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1 block">
                {report.onReviewCount}
              </span>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-medium">Закрыто</span>
              <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mt-1 block">
                {report.closedCount}
              </span>
            </div>
          </div>

          {/* Breakdown Grids: Status Distribution & Assignee Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status distribution */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Распределение по статусам
              </h3>

              <div className="space-y-3">
                {Object.entries(report.statusDistribution || {}).map(([stKey, count]) => {
                  const pct = report.totalTickets > 0 ? Math.round((count / report.totalTickets) * 100) : 0;
                  return (
                    <div key={stKey} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{stKey}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assignee distribution */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Распределение по сотрудникам
              </h3>

              <div className="space-y-3">
                {Object.entries(report.assigneeDistribution || {}).map(([empName, count]) => {
                  const pct = report.totalTickets > 0 ? Math.round((count / report.totalTickets) * 100) : 0;
                  return (
                    <div key={empName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{empName}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Overdue tickets list */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                Список просроченных заявок ({report.overdueTickets?.length || 0})
              </h3>
              <span className="text-xs text-slate-400">
                Срок исполнения прошел, статус не CLOSED
              </span>
            </div>

            {report.overdueTickets && report.overdueTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">№</th>
                      <th className="py-2.5 px-3">Тема и клиент</th>
                      <th className="py-2.5 px-3">Исполнитель</th>
                      <th className="py-2.5 px-3">Срок</th>
                      <th className="py-2.5 px-3">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.overdueTickets.map(t => (
                      <tr
                        key={t.id}
                        onClick={() => onSelectTicket(t.id)}
                        className="hover:bg-red-50/50 dark:hover:bg-red-950/20 cursor-pointer transition"
                      >
                        <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                          №{t.number}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{t.subject}</p>
                          <p className="text-[11px] text-slate-400">{t.clientName}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {t.assigneeName || 'Не назначен'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-red-600 dark:text-red-400">
                          {t.dueDate}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">
                За выбранный период просроченных заявок не зафиксировано
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
