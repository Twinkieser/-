import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { X, RefreshCw, Terminal, Search, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EventLogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getRecentLogs(200);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(line => line.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Журнал системных событий
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Фиксация действий пользователей и переходов состояний в <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">logs/events.log</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition"
              title="Обновить журнал"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Фильтр по действию, пользователю или номеру заявки..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Записей: {filteredLogs.length}
          </span>
        </div>

        {/* Log content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-200 selection:bg-indigo-500 selection:text-white space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              {loading ? 'Загрузка журнала событий...' : 'Записи в журнале не найдены'}
            </div>
          ) : (
            filteredLogs.map((line, idx) => {
              // Highlight user and action tags
              return (
                <div key={idx} className="leading-relaxed hover:bg-slate-900/80 px-2 py-0.5 rounded transition">
                  <span className="text-slate-500">{line.slice(0, 26)}</span>{' '}
                  <span className="text-emerald-400 font-semibold">
                    {line.includes('[USER:') ? line.match(/\[USER:\s*([^\]]+)\]/)?.[0] : ''}
                  </span>{' '}
                  <span className="text-amber-400">
                    {line.includes('[ACTION:') ? line.match(/\[ACTION:\s*([^\]]+)\]/)?.[0] : ''}
                  </span>{' '}
                  <span className="text-slate-300">
                    {line.replace(/^\[[^\]]+\]\s*\[USER:[^\]]+\]\s*\[ACTION:[^\]]+\]\s*/, '')}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-between items-center text-xs text-slate-500">
          <span>События логируются в реальном времени на сервере</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
