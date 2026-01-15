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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-lg bg-white shadow-xl sm:max-h-[90vh] sm:max-w-3xl sm:rounded-lg">
        {/* Header */}
        <div className="flex items-start justify-between border-b p-3 sm:items-center sm:p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-xs text-gray-500 sm:text-sm">{request.code}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${status.bgColor} ${status.color}`}>
                <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {status.label}
              </span>
            </div>
            <h2 className="mt-1 truncate text-base font-bold text-gray-900 sm:text-xl">{request.eventoNombre}</h2>
          </div>
          <button onClick={onClose} className="ml-2 min-h-[36px] min-w-[36px] flex-shrink-0 rounded-md p-2 hover:bg-gray-100 sm:min-h-0 sm:min-w-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-3 sm:space-y-6 sm:p-4">
          {/* Solicitante */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500 sm:mb-3 sm:text-sm">Datos del Solicitante</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="flex items-center gap-2">
                {request.tipoOrganizacion === 'facultad' ? (
                  <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                ) : (
                  <Building className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                )}
                <span className="truncate text-xs sm:text-sm">{formatOrganizacion(request)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{request.solicitanteNombre}</span>
                <span className="text-[10px] text-gray-500 sm:text-xs">({CARGOS[request.solicitanteCargo] || request.solicitanteCargo})</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                <a href={`mailto:${request.solicitanteEmail}`} className="truncate text-xs text-blue-600 hover:underline sm:text-sm">
                  {request.solicitanteEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{request.solicitanteTelefono}</span>
              </div>
            </div>
          </section>

          {/* Evento */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500 sm:mb-3 sm:text-sm">Datos del Evento</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{formatDate(request.eventoFecha)}</span>
                <span className="text-xs text-gray-500 sm:text-sm">
                  {request.eventoHoraInicio} - {request.eventoHoraFin}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                <span className="truncate text-xs sm:text-sm">{request.eventoUbicacion}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 sm:text-xs">Tipo:</span>
                <span className="ml-1 text-xs capitalize sm:text-sm">
                  {request.eventoTipo === 'otro' ? request.eventoTipoOtro : request.eventoTipo}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 sm:text-xs">Asistentes:</span>
                <span className="ml-1 text-xs sm:text-sm">{request.eventoAsistentes || 'No especificado'}</span>
              </div>
            </div>
          </section>

          {/* Servicios */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500 sm:mb-3 sm:text-sm">Servicios Solicitados</h3>
            <div className="flex flex-wrap gap-2">
              {request.servicioFotografia && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 sm:px-3 sm:text-sm">
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Fotografia
                </span>
              )}
              {request.servicioVideo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700 sm:px-3 sm:text-sm">
                  <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Video
                </span>
              )}
              {!request.servicioFotografia && !request.servicioVideo && (
                <span className="text-xs text-gray-500 sm:text-sm">Ninguno especificado</span>
              )}
            </div>
          </section>

          {/* Descripcion */}
          {request.descripcion && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500 sm:text-sm">Descripcion</h3>
              <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-700 sm:p-3 sm:text-sm">{request.descripcion}</p>
            </section>
          )}

          {/* Requerimientos */}
          {request.requerimientosEspeciales && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500 sm:text-sm">Requerimientos Especiales</h3>
              <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-700 sm:p-3 sm:text-sm">{request.requerimientosEspeciales}</p>
            </section>
          )}

          {/* Respuesta */}
          {request.status === 'pending' && (
            <section className="border-t pt-3 sm:pt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500 sm:mb-3 sm:text-sm">Respuesta</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                    Notas Internas (solo visible para el equipo)
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:px-3"
                    rows={2}
                    value={notasInternas}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    placeholder="Notas internas..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                    Mensaje para el Solicitante
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:px-3"
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
          <section className="border-t pt-3 text-[10px] text-gray-500 sm:pt-4 sm:text-xs">
            <p>Solicitud recibida: {formatDateTime(request.createdAt)}</p>
            {request.respondedAt && <p>Respuesta: {formatDateTime(request.respondedAt)}</p>}
            {request.ipAddress && <p className="hidden sm:block">IP: {request.ipAddress}</p>}
          </section>
        </div>

        {/* Actions */}
        {request.status === 'pending' && (
          <div className="flex flex-col gap-2 border-t bg-gray-50 p-3 sm:flex-row sm:justify-end sm:p-4">
            <Button
              variant="outline"
              onClick={() => handleAction('request-changes')}
              disabled={isLoading}
              className="min-h-[40px] text-xs sm:min-h-0 sm:text-sm"
            >
              <AlertCircle className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Solicitar Cambios</span>
              <span className="sm:hidden">Cambios</span>
            </Button>
            <Button
              variant="danger"
              onClick={() => handleAction('reject')}
              disabled={isLoading}
              className="min-h-[40px] text-xs sm:min-h-0 sm:text-sm"
            >
              <XCircle className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Rechazar
            </Button>
            <Button
              onClick={() => handleAction('approve')}
              disabled={isLoading}
              isLoading={isLoading}
              className="min-h-[40px] text-xs sm:min-h-0 sm:text-sm"
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
    <div className="overflow-hidden rounded-lg bg-white p-4 shadow sm:p-6">
      <h3 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">Configuracion del Formulario</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <p className="text-[10px] text-gray-500 sm:text-xs">Activar o desactivar el formulario publico</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Codigo de Acceso</label>
          <Input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Codigo de acceso"
          />
          <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">Este codigo se usa en la URL del formulario</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Limite de Solicitudes</label>
          <Input
            type="number"
            value={rateLimit}
            onChange={(e) => setRateLimit(Number(e.target.value))}
            min={1}
            max={100}
          />
          <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">Maximo de solicitudes por hora por IP</p>
        </div>

        <div className="border-t pt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">URL Publica</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="min-w-0 flex-1 truncate rounded-md border border-gray-300 bg-gray-50 px-2 py-2 text-xs sm:px-3 sm:text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="min-h-[36px] min-w-[36px] flex-shrink-0 rounded-md border border-gray-300 p-2 hover:bg-gray-100 sm:min-h-0 sm:min-w-0"
              title="Copiar URL"
            >
              <Copy className="h-4 w-4" />
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] min-w-[36px] flex-shrink-0 rounded-md border border-gray-300 p-2 hover:bg-gray-100 sm:min-h-0 sm:min-w-0"
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
    <div className="w-full max-w-full space-y-4 overflow-hidden p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">Solicitudes de Eventos</h1>
          <p className="text-sm text-gray-600 sm:text-base">Gestiona las solicitudes de cobertura de eventos</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 text-xs text-gray-500 sm:text-sm">
          <div className={`h-2 w-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          {isFetching ? 'Actualizando...' : 'En vivo'}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-3 shadow sm:p-4">
            <p className="text-xl font-bold text-gray-900 sm:text-2xl">{stats.total}</p>
            <p className="text-xs text-gray-500 sm:text-sm">Total</p>
          </div>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = stats[key as keyof typeof stats] || 0;
            const Icon = config.icon;
            return (
              <div key={key} className={`${config.bgColor} rounded-lg p-3 sm:p-4`}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.color}`} />
                  <span className={`text-xl font-bold sm:text-2xl ${config.color}`}>{count}</span>
                </div>
                <p className={`text-xs sm:text-sm ${config.color}`}>{config.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b sm:gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:text-base ${
              activeTab === 'pending'
                ? 'text-[#CC0000]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pendientes
            {stats?.pending ? (
              <span className="ml-1.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] text-yellow-700 sm:ml-2 sm:px-2 sm:text-xs">
                {stats.pending}
              </span>
            ) : null}
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CC0000]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:text-base ${
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
            className={`relative flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:text-base ${
              activeTab === 'recovery'
                ? 'text-[#CC0000]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Recuperacion</span>
            <span className="sm:hidden">Recup.</span>
            {recoveryRequests && recoveryRequests.length > 0 && (
              <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700 sm:px-2 sm:text-xs">
                {recoveryRequests.length}
              </span>
            )}
            {activeTab === 'recovery' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CC0000]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`relative flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:text-base ${
              activeTab === 'config'
                ? 'text-[#CC0000]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Configuracion</span>
            <span className="sm:hidden">Config.</span>
            {activeTab === 'config' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CC0000]" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'config' && config ? (
        <ConfigPanel
          config={config}
          onUpdate={(data) => updateConfigMutation.mutate(data)}
          isLoading={updateConfigMutation.isPending}
        />
      ) : activeTab === 'recovery' ? (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base">Solicitudes de Recuperacion de Token</h3>
            <p className="text-xs text-gray-500 sm:text-sm">Los solicitantes que olvidaron su codigo pueden pedir recuperarlo aqui</p>
          </div>

          {isLoadingRecovery ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#CC0000] border-t-transparent"></div>
            </div>
          ) : recoveryRequests?.length === 0 ? (
            <div className="p-6 text-center sm:p-8">
              <Key className="mx-auto mb-3 h-10 w-10 text-gray-300 sm:h-12 sm:w-12" />
              <p className="text-sm text-gray-500 sm:text-base">No hay solicitudes de recuperacion pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recoveryRequests?.map((recovery) => (
                <div key={recovery.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                      <span className="truncate text-sm font-medium text-gray-900 sm:text-base">{recovery.email}</span>
                      {recovery.status === 'not_found' && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700 sm:px-2 sm:text-xs">
                          Sin token
                        </span>
                      )}
                      {recovery.status === 'sent' && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700 sm:px-2 sm:text-xs">
                          Enviado
                        </span>
                      )}
                    </div>
                    {recovery.token && recovery.status !== 'not_found' && (
                      <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs text-gray-500 sm:text-sm">Token:</span>
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs sm:px-2 sm:text-sm">{recovery.token}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(recovery.token!)}
                          className="min-h-[28px] min-w-[28px] rounded p-1 hover:bg-gray-100 sm:min-h-0 sm:min-w-0"
                          title="Copiar token"
                        >
                          <Copy className="h-3 w-3 text-gray-400" />
                        </button>
                      </div>
                    )}
                    <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
                      Solicitado: {formatDateTime(recovery.createdAt)}
                      {recovery.sentAt && <span className="hidden sm:inline"> | Enviado: {formatDateTime(recovery.sentAt)}</span>}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {recovery.status === 'pending' && recovery.token && (
                      <Button
                        size="sm"
                        onClick={() => markRecoverySentMutation.mutate(recovery.id)}
                        disabled={markRecoverySentMutation.isPending}
                        className="min-h-[36px] text-xs sm:min-h-0 sm:text-sm"
                      >
                        <Send className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Marcar Enviado</span>
                        <span className="sm:hidden">Enviado</span>
                      </Button>
                    )}
                    <button
                      onClick={() => deleteRecoveryMutation.mutate(recovery.id)}
                      disabled={deleteRecoveryMutation.isPending}
                      className="min-h-[36px] min-w-[36px] rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 sm:min-h-0 sm:min-w-0"
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
            <div className="mb-3 sm:mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:w-auto sm:text-base"
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
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#CC0000] border-t-transparent"></div>
            </div>
          ) : requests?.length === 0 ? (
            <div className="rounded-lg bg-white p-6 text-center shadow sm:p-8">
              <p className="text-sm text-gray-500 sm:text-base">No hay solicitudes {activeTab === 'pending' ? 'pendientes' : ''}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-hidden rounded-lg bg-white shadow sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Codigo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Evento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Solicitante</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Recibida</th>
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
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-mono text-sm text-gray-500">{request.code}</td>
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
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.bgColor} ${status.color}`}>
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

              {/* Mobile Cards */}
              <div className="space-y-2 sm:hidden">
                {requests?.map((request) => {
                  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium text-gray-900">{request.eventoNombre}</h3>
                          <p className="truncate text-xs text-gray-500">{request.eventoUbicacion}</p>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="font-mono">{request.code}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.eventoFecha)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                        <User className="h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{request.solicitanteNombre}</span>
                        <span className="truncate text-gray-400">• {formatOrganizacion(request)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
