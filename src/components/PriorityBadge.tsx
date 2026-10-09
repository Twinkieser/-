import React from 'react';
import { Priority } from '../types';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface Props {
  priority: Priority;
}

export const PriorityBadge: React.FC<Props> = ({ priority }) => {
  switch (priority) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
          <ArrowUp className="w-3 h-3 text-red-600 dark:text-red-400" />
          Высокий
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <Minus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Средний
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <ArrowDown className="w-3 h-3 text-slate-500" />
          Низкий
        </span>
      );
  }
};
