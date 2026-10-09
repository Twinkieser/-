import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Client, Priority, ServiceType, Ticket, User } from '../types';
import { X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticketToEdit?: Ticket | null;
  onSaved: () => void;
}

export const TicketModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ticketToEdit,
  onSaved,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [executors, setExecutors] = useState<User[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const [clientId, setClientId] = useState<number | ''>('');
  const [contactPerson, setContactPerson] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState<number | ''>('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      if (ticketToEdit) {
        setClientId(ticketToEdit.clientId);
        setContactPerson(ticketToEdit.contactPerson || '');
        setSubject(ticketToEdit.subject);
        setDescription(ticketToEdit.description);
        setServiceTypeId(ticketToEdit.serviceTypeId || '');
        setPriority(ticketToEdit.priority);
        setAssigneeId(ticketToEdit.assigneeId || '');
        setDueDate(ticketToEdit.dueDate || '');
      } else {
        setClientId('');
        setContactPerson('');
        setSubject('');
        setDescription('');
        setServiceTypeId('');
        setPriority('MEDIUM');
        setAssigneeId('');
        // Default due date to today + 3 days
        const defaultDue = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
        setDueDate(defaultDue);
      }
    }
  }, [isOpen, ticketToEdit]);

  const loadDependencies = async () => {
    try {
      const [c, e, s] = await Promise.all([
        api.getClients(),
        api.getExecutors(),
        api.getServiceTypes(true),
      ]);
      setClients(c);
      setExecutors(e);
      setServiceTypes(s);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Выберите клиента');
      return;
    }
    if (!subject.trim()) {
      setError('Укажите тему заявки');
      return;
    }
    if (!description.trim()) {
      setError('Заполните описание заявки');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        clientId: Number(clientId),
        contactPerson: contactPerson.trim() || undefined,
        subject: subject.trim(),
        description: description.trim(),
        serviceTypeId: serviceTypeId ? Number(serviceTypeId) : undefined,
        priority,
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        dueDate: dueDate || undefined,
      };

      if (ticketToEdit) {
        await api.updateTicket(ticketToEdit.id, payload);
      } else {
        await api.createTicket(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">
            {ticketToEdit ? `Редактирование заявки №${ticketToEdit.number}` : 'Регистрация новой заявки'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Клиент *
              </label>
              <select
                required
                value={clientId}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setClientId(val);
                  const selectedClient = clients.find(c => c.id === val);
                  if (selectedClient && selectedClient.contactPerson && !contactPerson) {
                    setContactPerson(selectedClient.contactPerson);
                  }
                }}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Выберите клиента --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Контактное лицо
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="ФИО контактного лица"
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Тема обращения *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Краткая суть проблемы или задачи"
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Подробное описание задачи/инцидента *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Опишите детали, симптомы проблемы или требования к выполнению"
              className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Вид услуги
              </label>
              <select
                value={serviceTypeId}
                onChange={e => setServiceTypeId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Без категории --</option>
                {serviceTypes.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Приоритет
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="LOW">Низкий (LOW)</option>
                <option value="MEDIUM">Средний (MEDIUM)</option>
                <option value="HIGH">Высокий (HIGH)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Назначить исполнителя
              </label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Не назначен --</option>
                {executors.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.fullName} ({ex.login})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Срок исполнения (Дедлайн)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition"
            >
              {loading ? 'Сохранение...' : ticketToEdit ? 'Сохранить изменения' : 'Зарегистрировать заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
