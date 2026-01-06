import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eventRequestService } from '../../services/event-request.service';
import { FileText, Key, Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export function SolicitorPortal() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Validar código de acceso
  const { data: isValidCode, isLoading: validatingCode } = useQuery({
    queryKey: ['validate-access-code', accessCode],
    queryFn: () => eventRequestService.validateAccessCode(accessCode!),
    enabled: !!accessCode
  });

  // Verificar token y redirigir
  const verifyTokenMutation = useMutation({
    mutationFn: (token: string) => eventRequestService.getMyRequests(token),
    onSuccess: () => {
      navigate(`/mis-solicitudes/${token}`);
    },
    onError: () => {
      setTokenError('Codigo invalido. Verifica e intenta de nuevo.');
    }
  });

  // Recuperar código por email
  const recoverMutation = useMutation({
    mutationFn: (email: string) => eventRequestService.recoverAccess(email),
    onSuccess: () => {
      setRecoverySuccess(true);
      setEmail('');
    }
  });

  const handleViewRequests = (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    if (token.trim()) {
      verifyTokenMutation.mutate(token.trim());
    }
  };

  const handleRecoverCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      recoverMutation.mutate(email.trim());
    }
  };

  const handleCreateNew = () => {
    navigate(`/solicitar/${accessCode}/nuevo`);
  };

  if (validatingCode && !isValidCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace no valido</h1>
          <p className="text-gray-600">
            Este enlace de solicitudes no esta activo o el codigo es incorrecto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/pulso.png"
            alt="PULSO"
            className="h-20 mx-auto mb-0"
          />
          <h1 className="text-2xl font-bold text-gray-900">Portal de Solicitudes</h1>
        </div>

        {/* Contenido en 2 columnas con divisor */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6">

          {/* Columna Izquierda - Ver mis solicitudes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Ver mis solicitudes</h2>
            </div>

            <form onSubmit={handleViewRequests}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa tu codigo de acceso:
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenError('');
                }}
                placeholder="Ej: abc123xyz..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  tokenError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {tokenError && (
                <p className="mt-2 text-sm text-red-600">{tokenError}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                El codigo fue enviado a tu correo cuando creaste tu solicitud.
              </p>
              <button
                type="submit"
                disabled={!token.trim() || verifyTokenMutation.isPending}
                className="mt-4 w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyTokenMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Ver Solicitudes
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Divisor vertical */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-px h-full bg-gray-200"></div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-4">
            {/* Primera vez */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">¿Primera vez?</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Crea una nueva solicitud de cobertura para tu evento.
              </p>
              <button
                onClick={handleCreateNew}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
              >
                Crear Nueva Solicitud
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            {/* Olvidaste tu código */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setShowRecovery(!showRecovery)}
                className="flex items-center gap-3 w-full text-left"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Key className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">¿Olvidaste tu codigo?</h2>
                  <p className="text-sm text-gray-500">Te lo enviamos por correo</p>
                </div>
                <ArrowRight className={`h-5 w-5 text-gray-400 transition-transform ${showRecovery ? 'rotate-90' : ''}`} />
              </button>

              {showRecovery && (
                <div className="mt-4 pt-4 border-t">
                  {recoverySuccess ? (
                    <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                      <p>Si el correo tiene solicitudes registradas, recibiras tu codigo.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleRecoverCode}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ingresa tu correo:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tucorreo@universidad.edu"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <button
                          type="submit"
                          disabled={!email.trim() || recoverMutation.isPending}
                          className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {recoverMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Mail className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
