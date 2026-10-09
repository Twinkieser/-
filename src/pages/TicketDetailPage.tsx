import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Ticket, TicketStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusActionModal } from '../components/StatusActionModal';
import { TicketModal } from '../components/TicketModal';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Clock,
  Send,
  MessageSquare,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit,
  FolderTree,
  Mail,
  Phone,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

interface Props {
  ticketId: number;
  onBack: () => void;
  onRefreshData?: () => void;
}

export const TicketDetailPage: React.FC<Props> = ({
  ticketId,
  onBack,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status transition modal
  const [statusModalTarget, setStatusModalTarget] = useState<TicketStatus | null>(null);

  // Edit ticket modal (manager only)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTicketById(ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Загрузка карточки заявки...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-center space-y-3">
        <p className="text-xs text-red-700 dark:text-red-300 font-semibold">{error || 'Заявка не найдена'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к списку
        </button>
      </div>
    );
  }

  // Permission checks
  const isAssignedToCurrentUser = ticket.assigneeId === user?.id;
  const canExecutorAct = isAssignedToCurrentUser && !isManager;

  const handleSimpleTransition = async (target: TicketStatus) => {
    try {
      await api.changeTicketStatus(ticket.id, { targetStatus: target });
      await loadTicket();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Ошибка смены статуса');
    }
  };

  const handleStatusSubmit = async (data: { reason?: string; result?: string }) => {
    if (!statusModalTarget) return;
    await api.changeTicketStatus(ticket.id, {
      targetStatus: statusModalTarget,
      reason: data.reason,
      result: data.result,
    });
    await loadTicket();
    if (onRefreshData) onRefreshData();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.addComment(ticket.id, newCommentText.trim());
      setNewCommentText('');
      await loadTicket();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Ошибка добавления комментария');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Заявка №{ticket.number}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} size="md" />
              {ticket.overdue && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ПРОСРОЧЕНА
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Создана: {new Date(ticket.createdAt).toLocaleString('ru-RU')}
            </p>
          </div>
        </div>

        {/* Manager edit button */}
        {isManager && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition"
          >
            <Edit className="w-3.5 h-3.5" />
            Редактировать параметры
          </button>
        )}
      </div>

      {/* Status workflow action bar */}
      <div className="bg-indigo-50/60 dark:bg-slate-900/90 border border-indigo-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
            Действия по жизненному циклу заявки
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Текущий статус: <strong>{ticket.status}</strong>. Переходы строго регламентированы ролями.
          </p>
        </div>

        {/* Action buttons per state machine */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status: NEW */}
          {ticket.status === 'NEW' && (
            <button
              onClick={() => handleSimpleTransition('IN_PROGRESS')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Взять в работу (IN_PROGRESS)
            </button>
          )}

          {/* Status: IN_PROGRESS */}
          {ticket.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => setStatusModalTarget('WAITING_CLARIFICATION')}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Запросить уточнение
              </button>
              <button
                onClick={() => setStatusModalTarget('ON_REVIEW')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Передать на проверку
              </button>
            </>
          )}

          {/* Status: WAITING_CLARIFICATION */}
          {ticket.status === 'WAITING_CLARIFICATION' && (
            <button
              onClick={() => handleSimpleTransition('IN_PROGRESS')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Возобновить работу (IN_PROGRESS)
            </button>
          )}

          {/* Status: ON_REVIEW */}
          {ticket.status === 'ON_REVIEW' && (
            <>
              {isManager ? (
                <>
                  <button
                    onClick={() => setStatusModalTarget('IN_PROGRESS')}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    Вернуть на доработку
                  </button>
                  <button
                    onClick={() => setStatusModalTarget('CLOSED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Проверить и закрыть
                  </button>
                </>
              ) : (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-3 py-1.5 rounded-xl font-medium">
                  Ожидает проверки менеджером
                </span>
              )}
            </>
          )}

          {/* Status: CLOSED */}
          {ticket.status === 'CLOSED' && (
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Заявка закрыта {ticket.closedAt ? `(${new Date(ticket.closedAt).toLocaleDateString('ru-RU')})` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Details & Resolution (Left 2 cols) | Comments & Audit History (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: General Info & Result */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {ticket.subject}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {ticket.description}
              </p>
            </div>

            {/* Resolution result block if present */}
            {ticket.result && (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Результат выполнения:
                </span>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed whitespace-pre-wrap">
                  {ticket.result}
                </p>
              </div>
            )}

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Клиент
                </span>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.clientName}
                  </span>
                </div>
                {ticket.contactPerson && (
                  <p className="text-[11px] text-slate-500 ml-6">
                    Контактное лицо: {ticket.contactPerson}
                  </p>
                )}
                {ticket.clientPhone && (
                  <p className="text-[11px] text-slate-500 ml-6 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {ticket.clientPhone}
                  </p>
                )}
                {ticket.clientEmail && (
                  <p className="text-[11px] text-slate-500 ml-6 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {ticket.clientEmail}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Ответственный исполнитель
                </span>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.assigneeName || 'Не назначен'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Вид услуги
                </span>
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">
                    {ticket.serviceTypeName || '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Срок исполнения (Дедлайн)
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span
                    className={`font-semibold ${
                      ticket.overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {ticket.dueDate || 'Не установлен'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Комментарии к заявке ({ticket.comments?.length || 0})
              </h4>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map(c => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {c.authorName}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {c.authorRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(c.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  К этой заявке пока нет комментариев
                </p>
              )}
            </div>

            {/* Add comment form */}
            {(isManager || isAssignedToCurrentUser) && (
              <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <textarea
                  rows={2}
                  required
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Написать комментарий или зафиксировать промежуточное действие..."
                  className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newCommentText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Отправить комментарий
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right col: Audit History Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            История действий и переходов
          </h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {ticket.history && ticket.history.length > 0 ? (
              ticket.history.map(h => (
                <div key={h.id} className="relative text-xs">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {h.action}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {h.newValue || h.oldValue}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {h.authorName} • {new Date(h.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">История изменений пуста</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {statusModalTarget && (
        <StatusActionModal
          isOpen={true}
          onClose={() => setStatusModalTarget(null)}
          targetStatus={statusModalTarget}
          currentStatus={ticket.status}
          onSubmit={handleStatusSubmit}
        />
      )}

      {isEditModalOpen && (
        <TicketModal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          ticketToEdit={ticket}
          onSaved={loadTicket}
        />
      )}
    </div>
  );
};
