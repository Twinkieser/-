import React, { useState } from 'react';
import { api } from '../api';
import { TestSuiteResult } from '../types';
import { Play, CheckCircle2, XCircle, Clock, ShieldCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AutoTestModal: React.FC<Props> = ({ isOpen, onClose, onRefreshData }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestSuiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await api.runAcceptanceTests();
      setResult(data);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Ошибка выполнения тестов');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Автоматизированный контрольный сценарий приёмки
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Сквозной тест всех 7 шагов регламента + негативные проверки прав и переходов
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Сценарий тестирования проверяет:</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-500 dark:text-slate-400">
              <li>Менеджер добавляет клиента и регистрирует заявку.</li>
              <li>Назначает сотрудника и срок исполнения.</li>
              <li>Исполнитель входит и принимает заявку в работу (NEW → IN_PROGRESS).</li>
              <li>Добавляет комментарий, результат и передает на проверку (IN_PROGRESS → ON_REVIEW).</li>
              <li>Менеджер проверяет и закрывает заявку (ON_REVIEW → CLOSED).</li>
              <li>Заявка находится через поиск, подтверждается история аудита.</li>
              <li>Заявка отражается в отчётах и дашборде.</li>
              <li><strong>Негативный тест:</strong> исполнитель получает 403 на действия менеджера (закрытие заявки).</li>
              <li><strong>Негативный тест:</strong> недопустимый переход статуса отклоняется с кодом 409 Conflict.</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm shadow-sm transition"
            >
              <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Выполнение контрольного сценария...' : 'Запустить приёмочный сценарий'}
            </button>

            {result && (
              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Время выполнения: <span className="font-semibold">{result.totalDurationMs} мс</span>
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full font-semibold ${
                    result.passed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {result.successCount} из {result.totalTests} пройдено
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Результаты выполнения тестов:
              </h4>
              <div className="space-y-2">
                {result.results.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition ${
                      r.status === 'SUCCESS'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200'
                        : 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200'
                    }`}
                  >
                    {r.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          [{r.step}] {r.name}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {r.durationMs} мс
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        {r.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
