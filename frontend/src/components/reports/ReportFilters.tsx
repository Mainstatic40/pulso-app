import { Calendar, User } from 'lucide-react';
import { Select } from '../ui/Select';
import type { User as UserType } from '../../types';

interface ReportFiltersProps {
  dateFrom: string;
  dateTo: string;
  userId: string;
  users: UserType[];
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onUserChange: (value: string) => void;
  showUserFilter?: boolean;
}

export function ReportFilters({
  dateFrom,
  dateTo,
  userId,
  users,
  onDateFromChange,
  onDateToChange,
  onUserChange,
  showUserFilter = true,
}: ReportFiltersProps) {
  const userOptions = [
    { value: '', label: 'Todos los usuarios' },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Calendar className="hidden h-4 w-4 text-gray-400 sm:block" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="min-w-0">
            <label className="mb-1 block text-[10px] font-medium text-gray-500 sm:text-xs">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:h-10 sm:w-auto sm:px-3"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-[10px] font-medium text-gray-500 sm:text-xs">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:h-10 sm:w-auto sm:px-3"
            />
          </div>
        </div>
      </div>

      {showUserFilter && (
        <div className="flex items-center gap-2">
          <User className="hidden h-4 w-4 text-gray-400 sm:block" />
          <div className="w-full sm:w-auto">
            <label className="mb-1 block text-[10px] font-medium text-gray-500 sm:text-xs">
              Usuario
            </label>
            <Select
              options={userOptions}
              value={userId}
              onChange={(e) => onUserChange(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
        </div>
      )}
    </div>
  );
}
