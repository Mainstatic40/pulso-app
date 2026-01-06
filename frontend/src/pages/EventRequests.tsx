import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  Camera,
  Video,
  Settings,
  X,
  Copy,
  ExternalLink,
  GraduationCap,
  Key,
  Trash2,
  Send,
} from 'lucide-react';
import { eventRequestService, EventRequest, EventRequestConfig, EventRequestStats, TokenRecoveryRequest } from '../services/event-request.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// Constantes para mostrar valores legibles
const CARGOS: Record<string, string> = {
  coordinador: 'Coordinador',
  director: 'Director',
  docente: 'Docente',
  administrativo: 'Administrativo',
};

const FACULTADES: { value: string; label: string; carreras?: { value: string; label: string }[] }[] = [
  { value: 'FITEC', label: 'FITEC' },
  { value: 'FATEO', label: 'FATEO' },
  { value: 'FAPSI', label: 'FAPSI' },
  { value: 'FACSA', label: 'FACSA', carreras: [
    { value: 'medicina', label: 'Medicina' },
    { value: 'terapia_fisica', label: 'Terapia Fisica' },
    { value: 'nutricion', label: 'Nutricion' },
    { value: 'enfermeria', label: 'Enfermeria' },
  ]},
  { value: 'ESCEST', label: 'ESCEST', carreras: [
    { value: 'cirujano_dentista', label: 'Cirujano Dentista' },
    { value: 'tecnico_dental', label: 'Tecnico Dental' },
    { value: 'ambas', label: 'Ambas' },
  ]},
  { value: 'ARTCOM', label: 'ARTCOM' },
  { value: 'FACED', label: 'FACED' },
  { value: 'FACEJ', label: 'FACEJ' },
  { value: 'ESMUS', label: 'ESMUS' },
  { value: 'ESPRE', label: 'ESPRE' },
];

// Helper para mostrar la organizacion de forma legible
function formatOrganizacion(request: EventRequest): string {
  if (request.tipoOrganizacion === 'departamento') {
    return `Depto. ${request.departamentoNombre}`;
  }

  if (request.facultadCarrera) {
    const facultad = FACULTADES.find(f => f.value === request.facultad);
    const carrera = facultad?.carreras?.find(c => c.value === request.facultadCarrera);
    return `${request.facultad} - ${carrera?.label || request.facultadCarrera}`;
  }

  return request.facultad || '';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  approved: { label: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  changes_requested: { label: 'Cambios Solicitados', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertCircle },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface RequestDetailModalProps {
  request: EventRequest;
  onClose: () => void;
  onAction: (action: 'approve' | 'reject' | 'request-changes', data: { notasInternas?: string; mensajeSolicitante?: string }) => void;
  isLoading: boolean;
}

function RequestDetailModal({ request, onClose, onAction, isLoading }: RequestDetailModalProps) {
  const [notasInternas, setNotasInternas] = useState(request.notasInternas || '');
  const [mensajeSolicitante, setMensajeSolicitante] = useState(request.mensajeSolicitante || '');
  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const handleAction = (action: 'approve' | 'reject' | 'request-changes') => {
    onAction(action, { notasInternas, mensajeSolicitante });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-500">{request.code}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{request.eventoNombre}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Solicitante */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Datos del Solicitante</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {request.tipoOrganizacion === 'facultad' ? (
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                ) : (
                  <Building className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">{formatOrganizacion(request)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{request.solicitanteNombre}</span>
                <span className="text-xs text-gray-500">({CARGOS[request.solicitanteCargo] || request.solicitanteCargo})</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${request.solicitanteEmail}`} className="text-sm text-blue-600 hover:underline">
                  {request.solicitanteEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{request.solicitanteTelefono}</span>
              </div>
            </div>
          </section>

          {/* Evento */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Datos del Evento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{formatDate(request.eventoFecha)}</span>
                <span className="text-sm text-gray-500">
                  {request.eventoHoraInicio} - {request.eventoHoraFin}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{request.eventoUbicacion}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Tipo:</span>
                <span className="ml-1 text-sm capitalize">
                  {request.eventoTipo === 'otro' ? request.eventoTipoOtro : request.eventoTipo}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Asistentes:</span>
                <span className="ml-1 text-sm">{request.eventoAsistentes || 'No especificado'}</span>
              </div>
            </div>
          </section>

          {/* Servicios */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Servicios Solicitados</h3>
            <div className="flex flex-wrap gap-2">
              {request.servicioFotografia && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <Camera className="h-4 w-4" />
                  Fotografia
                </span>
              )}
              {request.servicioVideo && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  <Video className="h-4 w-4" />
                  Video
                </span>
              )}
              {!request.servicioFotografia && !request.servicioVideo && (
                <span className="text-sm text-gray-500">Ninguno especificado</span>
              )}
            </div>
          </section>

          {/* Descripcion */}
          {request.descripcion && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Descripcion</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{request.descripcion}</p>
            </section>
          )}

          {/* Requerimientos */}
          {request.requerimientosEspeciales && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Requerimientos Especiales</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{request.requerimientosEspeciales}</p>
            </section>
          )}

          {/* Respuesta */}
          {request.status === 'pending' && (
            <section className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Respuesta</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas Internas (solo visible para el equipo)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                    rows={2}
                    value={notasInternas}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    placeholder="Notas internas..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje para el Solicitante
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                    rows={3}
                    value={mensajeSolicitante}
                    onChange={(e) => setMensajeSolicitante(e.target.value)}
                    placeholder="Este mensaje sera visible para el solicitante..."
                  />
                </div>
              </div>
            </section>
          )}

          {/* Metadata */}
          <section className="text-xs text-gray-500 pt-4 border-t">
            <p>Solicitud recibida: {formatDateTime(request.createdAt)}</p>
            {request.respondedAt && <p>Respuesta: {formatDateTime(request.respondedAt)}</p>}
            {request.ipAddress && <p>IP: {request.ipAddress}</p>}
          </section>
        </div>

        {/* Actions */}
        {request.status === 'pending' && (
          <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => handleAction('request-changes')}
              disabled={isLoading}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Solicitar Cambios
            </Button>
            <Button
              variant="danger"
              onClick={() => handleAction('reject')}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
            <Button
              onClick={() => handleAction('approve')}
              disabled={isLoading}
              isLoading={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfigPanelProps {
  config: EventRequestConfig;
  onUpdate: (data: Partial<EventRequestConfig>) => void;
  isLoading: boolean;
}

function ConfigPanel({ config, onUpdate, isLoading }: ConfigPanelProps) {
  const [accessCode, setAccessCode] = useState(config.accessCode);
  const [rateLimit, setRateLimit] = useState(config.rateLimit);
  const [isActive, setIsActive] = useState(config.isActive);
  const publicUrl = `${window.location.origin}/solicitar/${accessCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
  };

  const handleSave = () => {
    onUpdate({ accessCode, rateLimit, isActive });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuracion del Formulario</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <p className="text-xs text-gray-500">Activar o desactivar el formulario publico</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Codigo de Acceso</label>
          <Input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Codigo de acceso"
          />
          <p className="text-xs text-gray-500 mt-1">Este codigo se usa en la URL del formulario</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Solicitudes</label>
          <Input
            type="number"
            value={rateLimit}
            onChange={(e) => setRateLimit(Number(e.target.value))}
            min={1}
            max={100}
          />
          <p className="text-xs text-gray-500 mt-1">Maximo de solicitudes por hora por IP</p>
        </div>

        <div className="pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Publica</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              title="Copiar URL"
            >
              <Copy className="h-4 w-4" />
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              title="Abrir en nueva ventana"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <Button onClick={handleSave} isLoading={isLoading} className="w-full">
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}

export function EventRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'recovery' | 'config'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: stats, isFetching: isFetchingStats } = useQuery<EventRequestStats>({
    queryKey: ['event-requests-stats'],
    queryFn: () => eventRequestService.getStats(),
    refetchInterval: 5000,
  });

  const { data: config } = useQuery<EventRequestConfig>({
    queryKey: ['event-requests-config'],
    queryFn: () => eventRequestService.getConfig(),
  });

  const { data: requests, isLoading: isLoadingRequests, isFetching: isFetchingRequests } = useQuery<EventRequest[]>({
    queryKey: ['event-requests', activeTab, statusFilter],
    queryFn: () => {
      if (activeTab === 'pending') {
        return eventRequestService.getPending();
      }
      return eventRequestService.getAll({ status: statusFilter || undefined });
    },
    enabled: activeTab !== 'config' && activeTab !== 'recovery',
    refetchInterval: 5000,
  });

  const { data: recoveryRequests, isLoading: isLoadingRecovery, isFetching: isFetchingRecovery } = useQuery<TokenRecoveryRequest[]>({
    queryKey: ['token-recovery-requests'],
    queryFn: () => eventRequestService.getRecoveryRequests(),
    refetchInterval: 30000,
  });

  const isFetching = isFetchingStats || isFetchingRequests || isFetchingRecovery;

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { notasInternas?: string; mensajeSolicitante?: string } }) =>
      eventRequestService.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-requests'] });
      queryClient.invalidateQueries({ queryKey: ['event-requests-stats'] });
      setSelectedRequest(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { notasInternas?: string; mensajeSolicitante?: string } }) =>
      eventRequestService.reject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-requests'] });
      queryClient.invalidateQueries({ queryKey: ['event-requests-stats'] });
      setSelectedRequest(null);
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { notasInternas?: string; mensajeSolicitante?: string } }) =>
      eventRequestService.requestChanges(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-requests'] });
      queryClient.invalidateQueries({ queryKey: ['event-requests-stats'] });
      setSelectedRequest(null);
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<EventRequestConfig>) => eventRequestService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-requests-config'] });
    },
  });

  const markRecoverySentMutation = useMutation({
    mutationFn: (id: string) => eventRequestService.markRecoveryAsSent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-recovery-requests'] });
    },
  });

  const deleteRecoveryMutation = useMutation({
    mutationFn: (id: string) => eventRequestService.deleteRecoveryRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-recovery-requests'] });
    },
  });

  const handleAction = (action: 'approve' | 'reject' | 'request-changes', data: { notasInternas?: string; mensajeSolicitante?: string }) => {
    if (!selectedRequest) return;

    switch (action) {
      case 'approve':
        approveMutation.mutate({ id: selectedRequest.id, data });
        break;
      case 'reject':
        rejectMutation.mutate({ id: selectedRequest.id, data });
        break;
      case 'request-changes':
        requestChangesMutation.mutate({ id: selectedRequest.id, data });
        break;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Eventos</h1>
          <p className="text-gray-600">Gestiona las solicitudes de cobertura de eventos</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className={`h-2 w-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          {isFetching ? 'Actualizando...' : 'En vivo'}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = stats[key as keyof typeof stats] || 0;
            const Icon = config.icon;
            return (
              <div key={key} className={`${config.bgColor} rounded-lg p-4`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <span className={`text-2xl font-bold ${config.color}`}>{count}</span>
                </div>
                <p className={`text-sm ${config.color}`}>{config.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'pending'
              ? 'text-[#CC0000]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendientes
          {stats?.pending ? (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              {stats.pending}
            </span>
          ) : null}
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CC0000]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'all'
              ? 'text-[#CC0000]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Todas
          {activeTab === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CC0000]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('recovery')}
          className={`px-4 py-2 font-medium transition-colors relative flex items-center gap-1 ${
            activeTab === 'recovery'
              ? 'text-[#CC0000]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Key className="h-4 w-4" />
          Recuperacion
          {recoveryRequests && recoveryRequests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
              {recoveryRequests.length}
            </span>
          )}
          {activeTab === 'recovery' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CC0000]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 font-medium transition-colors relative flex items-center gap-1 ${
            activeTab === 'config'
              ? 'text-[#CC0000]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="h-4 w-4" />
          Configuracion
          {activeTab === 'config' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CC0000]" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'config' && config ? (
        <ConfigPanel
          config={config}
          onUpdate={(data) => updateConfigMutation.mutate(data)}
          isLoading={updateConfigMutation.isPending}
        />
      ) : activeTab === 'recovery' ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Solicitudes de Recuperacion de Token</h3>
            <p className="text-sm text-gray-500">Los solicitantes que olvidaron su codigo pueden pedir recuperarlo aqui</p>
          </div>

          {isLoadingRecovery ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#CC0000] border-t-transparent"></div>
            </div>
          ) : recoveryRequests?.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay solicitudes de recuperacion pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recoveryRequests?.map((recovery) => (
                <div key={recovery.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{recovery.email}</span>
                      {recovery.status === 'not_found' && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          Sin token registrado
                        </span>
                      )}
                      {recovery.status === 'sent' && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Enviado
                        </span>
                      )}
                    </div>
                    {recovery.token && recovery.status !== 'not_found' && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-gray-500">Token:</span>
                        <code className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono">{recovery.token}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(recovery.token!)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copiar token"
                        >
                          <Copy className="h-3 w-3 text-gray-400" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Solicitado: {formatDateTime(recovery.createdAt)}
                      {recovery.sentAt && ` | Enviado: ${formatDateTime(recovery.sentAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {recovery.status === 'pending' && recovery.token && (
                      <Button
                        size="sm"
                        onClick={() => markRecoverySentMutation.mutate(recovery.id)}
                        disabled={markRecoverySentMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Marcar Enviado
                      </Button>
                    )}
                    <button
                      onClick={() => deleteRecoveryMutation.mutate(recovery.id)}
                      disabled={deleteRecoveryMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Eliminar solicitud"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter for "all" tab */}
          {activeTab === 'all' && (
            <div className="mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
              >
                <option value="">Todos los estados</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Requests List */}
          {isLoadingRequests ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#CC0000] border-t-transparent"></div>
            </div>
          ) : requests?.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No hay solicitudes {activeTab === 'pending' ? 'pendientes' : ''}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codigo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recibida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests?.map((request) => {
                    const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    return (
                      <tr
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">{request.code}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{request.eventoNombre}</div>
                          <div className="text-xs text-gray-500">{request.eventoUbicacion}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(request.eventoFecha)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{request.solicitanteNombre}</div>
                          <div className="text-xs text-gray-500">{formatOrganizacion(request)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onAction={handleAction}
          isLoading={approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending}
        />
      )}
    </div>
  );
}
