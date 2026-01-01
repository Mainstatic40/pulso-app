import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wifi, CheckCircle, XCircle, Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { rfidService, type RfidScanResult, type RfidUser } from '../../services/rfid.service';

interface RfidSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RfidSimulatorModal({ isOpen, onClose }: RfidSimulatorModalProps) {
  const [rfidTag, setRfidTag] = useState('');
  const [result, setResult] = useState<RfidScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get users with RFID for quick reference
  const { data: users } = useQuery({
    queryKey: ['rfid-users'],
    queryFn: () => rfidService.getUsersWithRfid(),
    enabled: isOpen,
  });

  const usersWithRfid = (users || []).filter((u: RfidUser) => u.hasRfid);

  const scanMutation = useMutation({
    mutationFn: (tag: string) => rfidService.scan(tag),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      // Invalidate time entries to update dashboard
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
    onError: (err: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      setError(err.response?.data?.error?.message || err.message || 'Error al escanear RFID');
      setResult(null);
    },
  });

  const handleScan = () => {
    if (!rfidTag.trim()) {
      setError('Ingresa un ID RFID');
      return;
    }
    scanMutation.mutate(rfidTag.trim());
  };

  const handleQuickScan = (tag: string) => {
    setRfidTag(tag);
    scanMutation.mutate(tag);
  };

  const handleClose = () => {
    setRfidTag('');
    setResult(null);
    setError(null);
    onClose();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Simulador de Escaneo RFID" size="md">
      <div className="space-y-6">
        {/* Instructions */}
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex gap-3">
            <Wifi className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">
                Este simulador permite probar el sistema de registro de horas sin necesidad del hardware RFID.
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            ID RFID
          </label>
          <div className="flex gap-2">
            <Input
              value={rfidTag}
              onChange={(e) => setRfidTag(e.target.value)}
              placeholder="Ej: A1:B2:C3:D4"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <Button
              onClick={handleScan}
              disabled={scanMutation.isPending}
              className="min-w-[100px]"
            >
              {scanMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Escanear'
              )}
            </Button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-lg border-2 p-4 ${
            result.action === 'clock_in'
              ? 'border-green-200 bg-green-50'
              : 'border-orange-200 bg-orange-50'
          }`}>
            <div className="flex items-start gap-3">
              {result.action === 'clock_in' ? (
                <LogIn className="h-6 w-6 text-green-600" />
              ) : (
                <LogOut className="h-6 w-6 text-orange-600" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${
                  result.action === 'clock_in' ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {result.action === 'clock_in' ? 'Entrada Registrada' : 'Salida Registrada'}
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Usuario:</span> {result.user.name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Hora:</span> {formatTime(
                      result.action === 'clock_in'
                        ? result.timeEntry.clockIn
                        : result.timeEntry.clockOut!
                    )}
                  </p>
                  {result.action === 'clock_out' && result.timeEntry.totalHours && (
                    <p className="text-gray-700">
                      <span className="font-medium">Total horas:</span> {result.timeEntry.totalHours.toFixed(2)}h
                    </p>
                  )}
                </div>
              </div>
              <CheckCircle className={`h-5 w-5 ${
                result.action === 'clock_in' ? 'text-green-500' : 'text-orange-500'
              }`} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Access */}
        {usersWithRfid.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              RFID de prueba disponibles
            </label>
            <div className="space-y-2">
              {usersWithRfid.map((user: RfidUser) => (
                <button
                  key={user.id}
                  onClick={() => handleQuickScan(user.rfidTag!)}
                  disabled={scanMutation.isPending}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.rfidTag}</p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600">Escanear</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {usersWithRfid.length === 0 && (
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">
              No hay usuarios con RFID vinculado. Vincula un RFID a un usuario primero.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
