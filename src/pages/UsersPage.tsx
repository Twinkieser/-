import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { UserModal } from '../components/UserModal';
import {
  UserCog,
  Plus,
  Shield,
  Check,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isManager = currentUser?.role === 'MANAGER';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      loadUsers();
    }
  }, [isManager]);

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Вы не можете отключить собственную учетную запись');
      return;
    }

    try {
      await api.toggleUserStatus(user.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Ошибка смены статуса пользователя');
    }
  };

  if (!isManager) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl">
        <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
          Доступ ограничен
        </h3>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Управление учетными записями доступно только для роли MANAGER.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-indigo-600" />
            Управление пользователями
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Учётные записи сотрудников, роли (MANAGER / EXECUTOR) и блокировка доступа
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Добавить пользователя
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Загрузка списка пользователей...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Сотрудник</th>
                  <th className="py-3 px-4">Логин</th>
                  <th className="py-3 px-4">Роль</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                          {u.fullName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {u.fullName}
                          </p>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] text-indigo-500 font-medium">
                              (Текущая сессия)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      @{u.login}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.role === 'MANAGER'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {u.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                          <X className="w-3.5 h-3.5" /> Отключен
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {u.id !== currentUser?.id ? (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            u.active
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900'
                          }`}
                        >
                          {u.active ? 'Отключить' : 'Активировать'}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <UserModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          onSaved={loadUsers}
        />
      )}
    </div>
  );
};
