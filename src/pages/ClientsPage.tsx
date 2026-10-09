import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Client, Ticket } from '../types';
import { ClientModal } from '../components/ClientModal';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Users2,
  Search,
  Plus,
  Edit,
  Phone,
  Mail,
  FileText,
  Building2,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react';

interface Props {
  onSelectTicket: (ticketId: number) => void;
}

export const ClientsPage: React.FC<Props> = ({ onSelectTicket }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected client for card with ticket history
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientTickets, setClientTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await api.getClients(search);
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search]);

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setLoadingTickets(true);
    try {
      const tickets = await api.getClientTickets(client.id);
      setClientTickets(tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-600" />
            База клиентов
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Список организаций и контактных лиц с полной историей обращений
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => {
              setClientToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Добавить клиента
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск клиента по наименованию, контактному лицу, телефону или email..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Grid: Clients List (Left) + Selected Client Card with Tickets History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Client Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Загрузка клиентов...
            </div>
          ) : clients.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Клиенты не найдены
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Организация / ФИО</th>
                    <th className="py-3 px-4">Контакты</th>
                    <th className="py-3 px-4 text-center">Заявок</th>
                    <th className="py-3 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {clients.map(c => {
                    const isSelected = selectedClient?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectClient(c)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-slate-800/80'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            {c.name}
                          </p>
                          {c.contactPerson && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Контакт: {c.contactPerson}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {c.phone && (
                            <p className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                            </p>
                          )}
                          {c.email && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                            </p>
                          )}
                          {!c.phone && !c.email && <span className="text-slate-400 italic">—</span>}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                            {c.ticketCount ?? 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isManager && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setClientToEdit(c);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                title="Редактировать клиента"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Selected Client Card with Historical Tickets */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col h-[600px]">
          {selectedClient ? (
            <div className="space-y-4 flex flex-col h-full overflow-hidden">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedClient.name}
                  </h3>
                  {isManager && (
                    <button
                      onClick={() => {
                        setClientToEdit(selectedClient);
                        setIsModalOpen(true);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Edit className="w-3 h-3" /> Изменить
                    </button>
                  )}
                </div>

                {selectedClient.contactPerson && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Контактное лицо: <strong>{selectedClient.contactPerson}</strong>
                  </p>
                )}

                {selectedClient.note && (
                  <p className="text-[11px] text-slate-400 mt-1 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    {selectedClient.note}
                  </p>
                )}
              </div>

              {/* History of tickets */}
              <div className="flex-1 overflow-y-auto space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>История заявок клиента</span>
                  <span>({clientTickets.length})</span>
                </h4>

                {loadingTickets ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Загрузка заявок клиента...
                  </div>
                ) : clientTickets.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    У данного клиента пока нет зарегистрированных заявок
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientTickets.map(t => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTicket(t.id)}
                        className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            №{t.number}
                          </span>
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-1">
                          {t.subject}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{t.createdAt.slice(0, 10)}</span>
                          <PriorityBadge priority={t.priority} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 text-xs p-6 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Выберите клиента из списка слева
              </p>
              <p className="text-[11px] max-w-xs text-slate-400">
                Здесь отобразится карточка клиента и полная хронология всех когда-либо зарегистрированных по нему заявок.
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ClientModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          clientToEdit={clientToEdit}
          onSaved={() => {
            loadClients();
            if (selectedClient && clientToEdit?.id === selectedClient.id) {
              handleSelectClient({ ...selectedClient, ...clientToEdit });
            }
          }}
        />
      )}
    </div>
  );
};
