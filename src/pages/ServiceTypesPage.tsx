import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { ServiceType } from '../types';
import { ServiceTypeModal } from '../components/ServiceTypeModal';
import { FolderTree, Plus, Edit, Check, X } from 'lucide-react';

export const ServiceTypesPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceTypeToEdit, setServiceTypeToEdit] = useState<ServiceType | null>(null);

  const loadServiceTypes = async () => {
    setLoading(true);
    try {
      const data = await api.getServiceTypes(false);
      setServiceTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceTypes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            Справочник видов услуг
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Категории оказываемых услуг, используемые для классификации и распределения заявок
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => {
              setServiceTypeToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Добавить услугу
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Загрузка справочника...
          </div>
        ) : serviceTypes.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Записи отсутствуют
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Наименование услуги</th>
                  <th className="py-3 px-4">Описание</th>
                  <th className="py-3 px-4">Статус</th>
                  {isManager && <th className="py-3 px-4 text-right">Действие</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serviceTypes.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {st.description || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Активна
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <X className="w-3.5 h-3.5" /> Отключена
                        </span>
                      )}
                    </td>
                    {isManager && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setServiceTypeToEdit(st);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Редактировать услугу"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ServiceTypeModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          serviceTypeToEdit={serviceTypeToEdit}
          onSaved={loadServiceTypes}
        />
      )}
    </div>
  );
};
