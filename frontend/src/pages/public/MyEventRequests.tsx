import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Camera,
  Video,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { eventRequestService, EventRequest } from '../../services/event-request.service';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  approved: { label: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  changes_requested: { label: 'Cambios Solicitados', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertCircle },
};

const CARGOS = [
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'director', label: 'Director' },
  { value: 'docente', label: 'Docente' },
  { value: 'administrativo', label: 'Administrativo' },
];

const FACULTADES = [
  { value: 'FITEC', label: 'FITEC', tieneCarreras: false },
  { value: 'FATEO', label: 'FATEO', tieneCarreras: false },
  { value: 'FAPSI', label: 'FAPSI', tieneCarreras: false },
  { value: 'FACSA', label: 'FACSA', tieneCarreras: true, carreras: [
    { value: 'medicina', label: 'Medicina' },
    { value: 'terapia_fisica', label: 'Terapia Fisica' },
    { value: 'nutricion', label: 'Nutricion' },
    { value: 'enfermeria', label: 'Enfermeria' },
  ]},
  { value: 'ESCEST', label: 'ESCEST', tieneCarreras: true, carreras: [
    { value: 'cirujano_dentista', label: 'Cirujano Dentista' },
    { value: 'tecnico_dental', label: 'Tecnico Dental' },
    { value: 'ambas', label: 'Ambas' },
  ]},
  { value: 'ARTCOM', label: 'ARTCOM', tieneCarreras: false },
  { value: 'FACED', label: 'FACED', tieneCarreras: false },
  { value: 'FACEJ', label: 'FACEJ', tieneCarreras: false },
  { value: 'ESMUS', label: 'ESMUS', tieneCarreras: false },
  { value: 'ESPRE', label: 'ESPRE', tieneCarreras: false },
];

const EVENT_TYPES = [
  { value: 'conferencia', label: 'Conferencia' },
  { value: 'ceremonia', label: 'Ceremonia' },
  { value: 'graduacion', label: 'Graduacion' },
  { value: 'deportivo', label: 'Evento Deportivo' },
  { value: 'cultural', label: 'Evento Cultural' },
  { value: 'academico', label: 'Evento Academico' },
  { value: 'administrativo', label: 'Reunion Administrativa' },
  { value: 'otro', label: 'Otro' },
];

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

function formatCargo(cargo: string): string {
  const found = CARGOS.find(c => c.value === cargo);
  return found?.label || cargo;
}

const editRequestSchema = z.object({
  // Organizacion
  tipoOrganizacion: z.enum(['facultad', 'departamento']),
  facultad: z.string().optional(),
  facultadCarrera: z.string().optional(),
  departamentoNombre: z.string().optional(),
  // Solicitante
  solicitanteNombre: z.string().min(1, 'Nombre es requerido'),
  solicitanteCargo: z.string().min(1, 'Cargo es requerido'),
  solicitanteTelefono: z.string().min(1, 'Telefono es requerido'),
  // Evento
  eventoNombre: z.string().min(1, 'Nombre del evento es requerido'),
  eventoTipo: z.string().min(1, 'Tipo de evento es requerido'),
  eventoTipoOtro: z.string().optional(),
  eventoFecha: z.string().min(1, 'Fecha es requerida'),
  eventoHoraInicio: z.string().min(1, 'Hora de inicio es requerida'),
  eventoHoraFin: z.string().min(1, 'Hora de fin es requerida'),
  eventoUbicacion: z.string().min(1, 'Ubicacion es requerida'),
  eventoAsistentes: z.number().optional(),
  // Servicios
  servicioFotografia: z.boolean().default(false),
  servicioVideo: z.boolean().default(false),
  // Detalles
  descripcion: z.string().optional(),
  requerimientosEspeciales: z.string().optional(),
});

type EditRequestFormData = z.infer<typeof editRequestSchema>;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateForInput(dateString: string) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

interface EditModalProps {
  request: EventRequest;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditModal({ request, token, onClose, onSuccess }: EditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditRequestFormData>({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      tipoOrganizacion: request.tipoOrganizacion,
      facultad: request.facultad || '',
      facultadCarrera: request.facultadCarrera || '',
      departamentoNombre: request.departamentoNombre || '',
      solicitanteNombre: request.solicitanteNombre,
      solicitanteCargo: request.solicitanteCargo,
      solicitanteTelefono: request.solicitanteTelefono,
      eventoNombre: request.eventoNombre,
      eventoTipo: request.eventoTipo,
      eventoTipoOtro: request.eventoTipoOtro || '',
      eventoFecha: formatDateForInput(request.eventoFecha),
      eventoHoraInicio: request.eventoHoraInicio,
      eventoHoraFin: request.eventoHoraFin,
      eventoUbicacion: request.eventoUbicacion,
      eventoAsistentes: request.eventoAsistentes || undefined,
      servicioFotografia: request.servicioFotografia,
      servicioVideo: request.servicioVideo,
      descripcion: request.descripcion || '',
      requerimientosEspeciales: request.requerimientosEspeciales || '',
    },
  });

  const tipoOrganizacion = watch('tipoOrganizacion');
  const facultad = watch('facultad');
  const eventoTipo = watch('eventoTipo');

  const facultadSeleccionada = FACULTADES.find(f => f.value === facultad);
  const mostrarCarreras = facultadSeleccionada?.tieneCarreras;

  // Resetear campos dependientes cuando cambia tipoOrganizacion
  useEffect(() => {
    if (tipoOrganizacion === 'facultad') {
      setValue('departamentoNombre', '');
    } else if (tipoOrganizacion === 'departamento') {
      setValue('facultad', '');
      setValue('facultadCarrera', '');
    }
  }, [tipoOrganizacion, setValue]);

  // Resetear carrera cuando cambia facultad
  useEffect(() => {
    if (!mostrarCarreras) {
      setValue('facultadCarrera', '');
    }
  }, [facultad, mostrarCarreras, setValue]);

  const onSubmit = async (data: EditRequestFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await eventRequestService.updateRequest(request.id, token, {
        ...data,
        eventoAsistentes: data.eventoAsistentes ? Number(data.eventoAsistentes) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(error.response?.data?.error?.message || 'Error al actualizar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <span className="text-sm font-mono text-gray-500">{request.code}</span>
            <h2 className="text-xl font-bold text-gray-900">Editar y Reenviar Solicitud</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin message banner */}
        {request.mensajeSolicitante && (
          <div className="mx-4 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Cambios solicitados por el equipo:</p>
                <p className="text-sm text-orange-700 mt-1">{request.mensajeSolicitante}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-6">
          {submitError && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          {/* Datos del Solicitante */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Informacion del Solicitante
            </h3>

            {/* Tipo de Organizacion */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de organizacion *</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${tipoOrganizacion === 'facultad' ? 'border-[#CC0000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" value="facultad" className="w-4 h-4 text-[#CC0000]" {...register('tipoOrganizacion')} />
                  <GraduationCap className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Facultad/Escuela</span>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${tipoOrganizacion === 'departamento' ? 'border-[#CC0000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" value="departamento" className="w-4 h-4 text-[#CC0000]" {...register('tipoOrganizacion')} />
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Departamento</span>
                </label>
              </div>
            </div>

            {/* Facultad/Escuela */}
            {tipoOrganizacion === 'facultad' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facultad/Escuela *</label>
                  <select
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.facultad ? 'border-red-500' : 'border-gray-300'}`}
                    {...register('facultad')}
                  >
                    <option value="">Selecciona una facultad</option>
                    {FACULTADES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {mostrarCarreras && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrera *</label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.facultadCarrera ? 'border-red-500' : 'border-gray-300'}`}
                      {...register('facultadCarrera')}
                    >
                      <option value="">Selecciona una carrera</option>
                      {facultadSeleccionada?.carreras?.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Departamento */}
            {tipoOrganizacion === 'departamento' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del departamento *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.departamentoNombre ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('departamentoNombre')}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del solicitante *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.solicitanteNombre ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('solicitanteNombre')}
                />
                {errors.solicitanteNombre && <p className="text-red-500 text-sm mt-1">{errors.solicitanteNombre.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.solicitanteCargo ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('solicitanteCargo')}
                >
                  <option value="">Selecciona tu cargo</option>
                  {CARGOS.map((cargo) => (
                    <option key={cargo.value} value={cargo.value}>{cargo.label}</option>
                  ))}
                </select>
                {errors.solicitanteCargo && <p className="text-red-500 text-sm mt-1">{errors.solicitanteCargo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
                <input
                  type="tel"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.solicitanteTelefono ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('solicitanteTelefono')}
                />
                {errors.solicitanteTelefono && <p className="text-red-500 text-sm mt-1">{errors.solicitanteTelefono.message}</p>}
              </div>
            </div>
          </section>

          {/* Datos del Evento */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Datos del Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Evento *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoNombre ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoNombre')}
                />
                {errors.eventoNombre && <p className="text-red-500 text-sm mt-1">{errors.eventoNombre.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento *</label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoTipo ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoTipo')}
                >
                  <option value="">Selecciona un tipo</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.eventoTipo && <p className="text-red-500 text-sm mt-1">{errors.eventoTipo.message}</p>}
              </div>
              {eventoTipo === 'otro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especifica el tipo</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                    {...register('eventoTipoOtro')}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoFecha ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoFecha')}
                />
                {errors.eventoFecha && <p className="text-red-500 text-sm mt-1">{errors.eventoFecha.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio *</label>
                <input
                  type="time"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoHoraInicio ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoHoraInicio')}
                />
                {errors.eventoHoraInicio && <p className="text-red-500 text-sm mt-1">{errors.eventoHoraInicio.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin *</label>
                <input
                  type="time"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoHoraFin ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoHoraFin')}
                />
                {errors.eventoHoraFin && <p className="text-red-500 text-sm mt-1">{errors.eventoHoraFin.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicacion *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoUbicacion ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoUbicacion')}
                />
                {errors.eventoUbicacion && <p className="text-red-500 text-sm mt-1">{errors.eventoUbicacion.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero de Asistentes</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                  {...register('eventoAsistentes', { valueAsNumber: true })}
                />
              </div>
            </div>
          </section>

          {/* Servicios */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Servicios Requeridos</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="w-5 h-5 text-[#CC0000] rounded" {...register('servicioFotografia')} />
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Fotografia</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="w-5 h-5 text-[#CC0000] rounded" {...register('servicioVideo')} />
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Video</span>
                </div>
              </label>
            </div>
          </section>

          {/* Informacion Adicional */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Informacion Adicional</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                  rows={3}
                  {...register('descripcion')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requerimientos Especiales</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                  rows={3}
                  {...register('requerimientosEspeciales')}
                />
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#CC0000] text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              'Guardar y Reenviar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RequestCardProps {
  request: EventRequest;
  token: string;
  onEditSuccess: () => void;
}

function RequestCard({ request, token, onEditSuccess }: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const canEdit = request.status === 'changes_requested';

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md overflow-hidden ${canEdit ? 'ring-2 ring-orange-300' : ''}`}>
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-gray-500">{request.code}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{request.eventoNombre}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(request.eventoFecha)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {request.eventoUbicacion}
                </span>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {/* Banner for changes_requested */}
          {canEdit && request.mensajeSolicitante && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-orange-700">{request.mensajeSolicitante}</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Editar y Reenviar
                </button>
              </div>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t bg-gray-50">
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Organizacion</h4>
                <p className="text-sm text-gray-900">{formatOrganizacion(request)}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Solicitante</h4>
                <p className="text-sm text-gray-900">{request.solicitanteNombre}</p>
                <p className="text-xs text-gray-500">{formatCargo(request.solicitanteCargo)}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Horario</h4>
                <p className="text-sm text-gray-900">{request.eventoHoraInicio} - {request.eventoHoraFin}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Tipo de Evento</h4>
                <p className="text-sm text-gray-900 capitalize">
                  {request.eventoTipo === 'otro' ? request.eventoTipoOtro : request.eventoTipo}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Asistentes</h4>
                <p className="text-sm text-gray-900">{request.eventoAsistentes || 'No especificado'}</p>
              </div>
            </div>

            <div className="py-3 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Servicios Solicitados</h4>
              <div className="flex flex-wrap gap-2">
                {request.servicioFotografia && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Fotografia</span>
                )}
                {request.servicioVideo && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Video</span>
                )}
                {!request.servicioFotografia && !request.servicioVideo && (
                  <span className="text-sm text-gray-500">Ninguno especificado</span>
                )}
              </div>
            </div>

            {request.descripcion && (
              <div className="py-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Descripcion</h4>
                <p className="text-sm text-gray-700">{request.descripcion}</p>
              </div>
            )}

            {request.requerimientosEspeciales && (
              <div className="py-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Requerimientos Especiales</h4>
                <p className="text-sm text-gray-700">{request.requerimientosEspeciales}</p>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
              <p>Solicitud enviada: {formatDate(request.createdAt)}</p>
              {request.respondedAt && (
                <p>Respuesta: {formatDate(request.respondedAt)}</p>
              )}
            </div>

            {canEdit && (
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Editar y Reenviar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditModal
          request={request}
          token={token}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={onEditSuccess}
        />
      )}
    </>
  );
}

export function MyEventRequests() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['my-requests', token],
    queryFn: () => eventRequestService.getMyRequests(token!),
    enabled: !!token,
    refetchInterval: 10000,
  });

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['my-requests', token] });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">Token no proporcionado</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#CC0000] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">Token invalido o expirado</p>
          <Link
            to="/recuperar-acceso"
            className="text-[#CC0000] hover:underline"
          >
            Recuperar acceso
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#CC0000] mb-2">PULSO</h1>
          <h2 className="text-xl font-semibold text-gray-900">Mis Solicitudes de Eventos</h2>
          <p className="text-gray-600 mt-2">
            Solicitudes asociadas a: <span className="font-medium">{data.email}</span>
          </p>
          {/* Live indicator */}
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <div className={`h-2 w-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            {isFetching ? 'Actualizando...' : 'Actualizado'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = data.requests.filter((r) => r.status === key).length;
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

        {/* New Request Button */}
        <div className="mb-6">
          <Link
            to="/solicitar/MULTIMEDIA2026"
            className="inline-flex items-center gap-2 bg-[#CC0000] text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nueva Solicitud
          </Link>
        </div>

        {/* Requests List */}
        {data.requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No tienes solicitudes registradas.</p>
            <Link
              to="/solicitar/MULTIMEDIA2026"
              className="text-[#CC0000] hover:underline"
            >
              Crear tu primera solicitud
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                token={token}
                onEditSuccess={handleEditSuccess}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
