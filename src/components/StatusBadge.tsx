import React from 'react';
import { TicketStatus } from '../types';
import {
  Sparkles,
  Clock,
  HelpCircle,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

interface Props {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  TicketStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  NEW: {
    label: 'Новая',
    bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Sparkles,
  },
  IN_PROGRESS: {
    label: 'В работе',
    bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
  },
  WAITING_CLARIFICATION: {
    label: 'Ожидает уточнения',
    bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    icon: HelpCircle,
  },
  ON_REVIEW: {
    label: 'На проверке',
    bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    icon: FileCheck2,
  },
  CLOSED: {
    label: 'Закрыта',
    bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
  },
};

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const conf = statusConfig[status] || statusConfig.NEW;
  const Icon = conf.icon;

  const sizeCls = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${conf.bg} ${conf.border} ${sizeCls}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {conf.label}
    </span>
  );
};
