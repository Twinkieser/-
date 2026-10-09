import React, { useState } from 'react';
import { TicketStatus } from '../types';
import { X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetStatus: TicketStatus;
  currentStatus: TicketStatus;
  onSubmit: (data: { reason?: string; result?: string }) => Promise<void>;
}

export const StatusActionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetStatus,
  currentStatus,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isClarification = targetStatus === 'WAITING_CLARIFICATION';
  const isRework = currentStatus === 'ON_REVIEW' && targetStatus === 'IN_PROGRESS';
  const isSubmittingForReview = targetStatus === 'ON_REVIEW';
  const isClosing = targetStatus === 'CLOSED';

  const getTitle = () => {
    if (isClarification) return 'Запрос уточнения у клиента';
    if (isRework) return 'Возврат заявки на доработку';
    if (isSubmittingForReview) return 'Передача заявки на проверку менеджеру';
    if (isClosing) return 'Проверка результата и закрытие заявки';
    return `Смена статуса на ${targetStatus}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isClarification && !reason.trim()) {
      setError('Укажите причину запроса уточнения (что именно требуется от клиента)');
      return;
    }

    if (isRework && !reason.trim()) {
      setError('Укажите замечания и причину возврата на доработку');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        reason: reason.trim() || undefined,
        result: result.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка смены статуса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">
            {getTitle()}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Reason input for clarification or rework */}
          {(isClarification || isRework) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isClarification ? 'Причина уточнения *' : 'Причина возврата / замечания к доработке *'}
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={
                  isClarification
                    ? 'Например: Требуются технические спецификации от сетевого администратора клиента...'
                    : 'Например: В тестовом контуре выявлены ошибки синхронизации. Проверить тайм-ауты...'
                }
                className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * Обязательное поле согласно регламенту жизненного цикла заявок.
              </p>
            </div>
          )}

          {/* Result input when submitting for review */}
          {isSubmittingForReview && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Итоговый результат выполненной работы
              </label>
              <textarea
                rows={3}
                value={result}
                onChange={e => setResult(e.target.value)}
                placeholder="Опишите, какие действия были предприняты и итоговый результат решения инцидента..."
                className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {isClosing && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
              Вы подтверждаете закрытие заявки? Данное действие переводит заявку в конечный статус <strong>CLOSED</strong>.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-white font-medium rounded-lg text-xs transition ${
                isClosing
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isRework
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Сохранение...' : isClosing ? 'Подтвердить закрытие' : 'Подтвердить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
