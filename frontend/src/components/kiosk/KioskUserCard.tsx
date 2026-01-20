import { useState } from 'react';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import type { KioskUser } from '../../types';
import { getImageUrl } from '../../lib/utils';

interface KioskUserCardProps {
  user: KioskUser;
  onAction: (userId: string, action: 'clock-in' | 'clock-out') => void;
  isLoading: boolean;
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function formatClockInTime(clockIn: string): string {
  const date = new Date(clockIn);
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function KioskUserCard({ user, onAction, isLoading }: KioskUserCardProps) {
  const [imageError, setImageError] = useState(false);
  const isInOffice = !!user.activeSession;
  const action = isInOffice ? 'clock-out' : 'clock-in';

  const handleClick = () => {
    if (!isLoading) {
      onAction(user.id, action);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${
        isInOffice ? 'border-green-200 bg-green-50/50' : 'border-gray-100'
      } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={handleClick}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-3">
        {user.profileImage && !imageError ? (
          <img
            src={getImageUrl(user.profileImage) || ''}
            alt={user.name}
            className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-4 ring-white shadow ${getColorFromName(user.name)}`}
          >
            {getInitials(user.name)}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-center font-semibold text-gray-900 truncate mb-2">
        {user.name}
      </h3>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isInOffice
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isInOffice ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          {isInOffice ? 'En oficina' : 'Fuera'}
        </span>
      </div>

      {/* Clock in time if active */}
      {isInOffice && user.activeSession && (
        <p className="text-center text-sm text-gray-500 mb-3">
          Entrada: {formatClockInTime(user.activeSession.clockIn)}
        </p>
      )}

      {/* Action button */}
      <button
        disabled={isLoading}
        className={`w-full min-h-[50px] rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
          isInOffice
            ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
            : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isInOffice ? (
          <>
            <LogOut className="h-5 w-5" />
            SALIDA
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            ENTRADA
          </>
        )}
      </button>
    </div>
  );
}
