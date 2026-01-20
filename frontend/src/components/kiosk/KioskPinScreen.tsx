import { useState } from 'react';
import { kioskService } from '../../services/kiosk.service';
import { Delete, LogIn } from 'lucide-react';

interface KioskPinScreenProps {
  onSuccess: () => void;
}

export function KioskPinScreen({ onSuccess }: KioskPinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError('Ingresa 4 digitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValid = await kioskService.validatePin(pin);

      if (isValid) {
        sessionStorage.setItem('kiosk_pin', pin);
        onSuccess();
      } else {
        setError('PIN incorrecto');
        setPin('');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setIsLoading(false);
    }
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PULSO</h1>
          <p className="text-gray-500 mt-2">Kiosko de Asistencia</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                pin[i]
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {pin[i] ? '*' : ''}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center text-red-500 mb-4 font-medium">{error}</div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isLoading}
              className="h-16 text-2xl font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={isLoading || pin.length === 0}
            className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Delete className="h-6 w-6" />
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            disabled={isLoading}
            className="h-16 text-2xl font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || pin.length !== 4}
            className="h-16 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <LogIn className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
