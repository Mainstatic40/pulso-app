import { useState, useEffect } from 'react';
import { PlayCircle, StopCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClockButtonProps {
  isActive: boolean;
  clockInTime?: string;
  onClockIn: () => void;
  onClockOut: () => void;
  isLoading?: boolean;
}

function formatElapsedTime(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function ClockButton({
  isActive,
  clockInTime,
  onClockIn,
  onClockOut,
  isLoading,
}: ClockButtonProps) {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (!isActive || !clockInTime) {
      setElapsedTime('00:00:00');
      return;
    }

    // Update immediately
    setElapsedTime(formatElapsedTime(clockInTime));

    // Update every second
    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(clockInTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, clockInTime]);

  const handleClick = () => {
    if (isLoading) return;
    if (isActive) {
      onClockOut();
    } else {
      onClockIn();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'group relative flex h-40 w-40 flex-col items-center justify-center rounded-full transition-all duration-300',
          'focus:outline-none focus:ring-4 focus:ring-offset-2',
          isLoading && 'cursor-not-allowed opacity-70',
          isActive
            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-600 focus:ring-green-300'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300'
        )}
      >
        {/* Pulse animation when active */}
        {isActive && !isLoading && (
          <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20" />
        )}

        <div className="relative z-10 flex flex-col items-center">
          {isActive ? (
            <>
              <StopCircle className="h-12 w-12" />
              <span className="mt-2 text-sm font-medium">Registrar Salida</span>
            </>
          ) : (
            <>
              <PlayCircle className="h-12 w-12" />
              <span className="mt-2 text-sm font-medium">Registrar Entrada</span>
            </>
          )}
        </div>
      </button>

      {/* Elapsed time display */}
      <div className="mt-4 text-center">
        {isActive ? (
          <>
            <p className="font-mono text-3xl font-bold text-green-600">{elapsedTime}</p>
            <p className="mt-1 text-sm text-gray-500">Tiempo transcurrido</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Sin sesión activa</p>
        )}
      </div>
    </div>
  );
}
