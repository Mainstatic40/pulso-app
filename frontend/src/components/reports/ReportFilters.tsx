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
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <div className="flex items-center gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {showUserFilter && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Usuario
            </label>
            <Select
              options={userOptions}
              value={userId}
              onChange={(e) => onUserChange(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
      )}
    </div>
  );
}
