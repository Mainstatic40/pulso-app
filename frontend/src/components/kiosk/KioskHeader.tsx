import { useState, useEffect } from 'react';
import { LogOut, Clock } from 'lucide-react';

interface KioskHeaderProps {
  onLogout: () => void;
}

export function KioskHeader({ onLogout }: KioskHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PULSO</h1>
              <p className="text-xs text-gray-500">Control de Asistencia</p>
            </div>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-3 text-center">
            <Clock className="h-8 w-8 text-gray-400" />
            <div>
              <div className="text-3xl font-mono font-bold text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Cerrar Kiosko</span>
          </button>
        </div>
      </div>
    </header>
  );
}
