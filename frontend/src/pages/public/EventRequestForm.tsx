import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertCircle, Camera, Video, Building2, GraduationCap, Copy, ArrowLeft } from 'lucide-react';
import { eventRequestService } from '../../services/event-request.service';

// Constantes
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

const eventRequestSchema = z.object({
  // Organizacion
  tipoOrganizacion: z.enum(['facultad', 'departamento'], { required_error: 'Selecciona un tipo de organizacion' }),
  facultad: z.string().optional(),
  facultadCarrera: z.string().optional(),
  departamentoNombre: z.string().optional(),
  // Solicitante
  solicitanteNombre: z.string().min(1, 'Nombre es requerido'),
  solicitanteCargo: z.string().min(1, 'Cargo es requerido'),
  solicitanteEmail: z.string().email('Email invalido').min(1, 'Email es requerido'),
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
}).refine((data) => {
  // Validar que si es facultad, se seleccione una facultad
  if (data.tipoOrganizacion === 'facultad' && !data.facultad) {
    return false;
  }
  return true;
}, {
  message: 'Debes seleccionar una facultad/escuela',
  path: ['facultad'],
}).refine((data) => {
  // Validar que si es departamento, se ingrese el nombre
  if (data.tipoOrganizacion === 'departamento' && !data.departamentoNombre) {
    return false;
  }
  return true;
}, {
  message: 'Debes ingresar el nombre del departamento',
  path: ['departamentoNombre'],
}).refine((data) => {
  // Validar carrera si la facultad tiene carreras
  if (data.tipoOrganizacion === 'facultad' && data.facultad) {
    const facultad = FACULTADES.find(f => f.value === data.facultad);
    if (facultad?.tieneCarreras && !data.facultadCarrera) {
      return false;
    }
  }
  return true;
}, {
  message: 'Debes seleccionar una carrera',
  path: ['facultadCarrera'],
});

type EventRequestFormData = z.infer<typeof eventRequestSchema>;

export function EventRequestForm() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ code: string; token: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventRequestFormData>({
    resolver: zodResolver(eventRequestSchema),
    defaultValues: {
      servicioFotografia: false,
      servicioVideo: false,
    },
  });

  const tipoOrganizacion = watch('tipoOrganizacion');
  const facultad = watch('facultad');
  const eventoTipo = watch('eventoTipo');

  // Obtener la facultad seleccionada para verificar si tiene carreras
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

  useEffect(() => {
    const validate = async () => {
      if (!accessCode) {
        setIsValidating(false);
        return;
      }
      try {
        const isValid = await eventRequestService.validateAccessCode(accessCode);
        setIsValidCode(isValid);
      } catch {
        setIsValidCode(false);
      } finally {
        setIsValidating(false);
      }
    };
    validate();
  }, [accessCode]);

  const onSubmit = async (data: EventRequestFormData) => {
    if (!accessCode) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await eventRequestService.submitRequest(accessCode, {
        ...data,
        eventoAsistentes: data.eventoAsistentes ? Number(data.eventoAsistentes) : undefined,
      });
      setSubmitResult(result);
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(error.response?.data?.error?.message || 'Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#CC0000] border-t-transparent"></div>
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso no valido</h2>
          <p className="text-gray-600 mb-6">
            El codigo de acceso no es valido o el formulario esta desactivado.
          </p>
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta al departamento de multimedia.
          </p>
        </div>
      </div>
    );
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(submitResult?.token || '');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (submitResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Solicitud Enviada!</h2>
            <p className="text-gray-600 mb-4">Tu solicitud ha sido recibida correctamente.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">Codigo de solicitud:</p>
              <p className="text-lg font-mono font-bold text-gray-900">{submitResult.code}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-600 mb-1">Tu codigo de acceso (guardalo):</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-mono font-bold text-blue-900">{submitResult.token}</p>
                <button
                  onClick={handleCopyToken}
                  className="p-1 hover:bg-blue-100 rounded"
                  title="Copiar"
                >
                  <Copy className={`h-4 w-4 ${copiedToken ? 'text-green-600' : 'text-blue-600'}`} />
                </button>
              </div>
              {copiedToken && (
                <p className="text-xs text-green-600 mt-1">Copiado!</p>
              )}
              <p className="text-xs text-blue-500 mt-2">
                Usa este codigo para ver y editar tus solicitudes.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/mis-solicitudes/${submitResult.token}`)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Ver mis solicitudes
              </button>
              <button
                onClick={() => navigate(`/solicitar/${accessCode}`)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Volver al portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(`/solicitar/${accessCode}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al portal
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#CC0000] mb-2">PULSO</h1>
          <h2 className="text-xl font-semibold text-gray-900">Solicitud de Cobertura de Evento</h2>
          <p className="text-gray-600 mt-2">
            Completa el formulario para solicitar servicios de multimedia para tu evento.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6 space-y-8">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de organizacion *
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${tipoOrganizacion === 'facultad' ? 'border-[#CC0000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    value="facultad"
                    className="w-4 h-4 text-[#CC0000] focus:ring-[#CC0000]"
                    {...register('tipoOrganizacion')}
                  />
                  <GraduationCap className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Facultad/Escuela</span>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${tipoOrganizacion === 'departamento' ? 'border-[#CC0000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    value="departamento"
                    className="w-4 h-4 text-[#CC0000] focus:ring-[#CC0000]"
                    {...register('tipoOrganizacion')}
                  />
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Departamento</span>
                </label>
              </div>
              {errors.tipoOrganizacion && (
                <p className="text-red-500 text-sm mt-1">{errors.tipoOrganizacion.message}</p>
              )}
            </div>

            {/* Facultad/Escuela */}
            {tipoOrganizacion === 'facultad' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facultad/Escuela *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.facultad ? 'border-red-500' : 'border-gray-300'}`}
                    {...register('facultad')}
                  >
                    <option value="">Selecciona una facultad</option>
                    {FACULTADES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  {errors.facultad && (
                    <p className="text-red-500 text-sm mt-1">{errors.facultad.message}</p>
                  )}
                </div>

                {mostrarCarreras && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carrera *
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.facultadCarrera ? 'border-red-500' : 'border-gray-300'}`}
                      {...register('facultadCarrera')}
                    >
                      <option value="">Selecciona una carrera</option>
                      {facultadSeleccionada?.carreras?.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {errors.facultadCarrera && (
                      <p className="text-red-500 text-sm mt-1">{errors.facultadCarrera.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Departamento */}
            {tipoOrganizacion === 'departamento' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del departamento *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.departamentoNombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Servicios Escolares, Recursos Humanos..."
                  {...register('departamentoNombre')}
                />
                {errors.departamentoNombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.departamentoNombre.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del solicitante *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.solicitanteNombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Tu nombre completo"
                  {...register('solicitanteNombre')}
                />
                {errors.solicitanteNombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.solicitanteNombre.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.solicitanteCargo ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('solicitanteCargo')}
                >
                  <option value="">Selecciona tu cargo</option>
                  {CARGOS.map((cargo) => (
                    <option key={cargo.value} value={cargo.value}>
                      {cargo.label}
                    </option>
                  ))}
                </select>
                {errors.solicitanteCargo && (
                  <p className="text-red-500 text-sm mt-1">{errors.solicitanteCargo.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email institucional *
                </label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.solicitanteEmail ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="correo@universidad.edu.mx"
                  {...register('solicitanteEmail')}
                />
                {errors.solicitanteEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.solicitanteEmail.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefono de contacto *
                </label>
                <input
                  type="tel"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.solicitanteTelefono ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: 618-123-4567"
                  {...register('solicitanteTelefono')}
                />
                {errors.solicitanteTelefono && (
                  <p className="text-red-500 text-sm mt-1">{errors.solicitanteTelefono.message}</p>
                )}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoNombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Ceremonia de Graduacion 2026"
                  {...register('eventoNombre')}
                />
                {errors.eventoNombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventoNombre.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Evento *
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoTipo ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoTipo')}
                >
                  <option value="">Selecciona un tipo</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.eventoTipo && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventoTipo.message}</p>
                )}
              </div>
              {eventoTipo === 'otro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especifica el tipo *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                    placeholder="Describe el tipo de evento"
                    {...register('eventoTipoOtro')}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha del Evento *
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoFecha ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoFecha')}
                />
                {errors.eventoFecha && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventoFecha.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoHoraInicio ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoHoraInicio')}
                />
                {errors.eventoHoraInicio && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventoHoraInicio.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoHoraFin ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoHoraFin')}
                />
                {errors.eventoHoraFin && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventoHoraFin.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicacion *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000] ${errors.eventoUbicacion ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Auditorio Principal, Campus Norte"
                  {...register('eventoUbicacion')}
                />
                {errors.eventoUbicacion && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventoUbicacion.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero de Asistentes Esperados
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                  placeholder="Ej: 200"
                  {...register('eventoAsistentes', { valueAsNumber: true })}
                />
              </div>
            </div>
          </section>

          {/* Servicios Requeridos */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Servicios Requeridos
            </h3>
            <p className="text-sm text-gray-600 mb-4">Selecciona los servicios que necesitas para tu evento:</p>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-[#CC0000] rounded focus:ring-[#CC0000]"
                  {...register('servicioFotografia')}
                />
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Fotografia</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-[#CC0000] rounded focus:ring-[#CC0000]"
                  {...register('servicioVideo')}
                />
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Video</span>
                </div>
              </label>
            </div>
          </section>

          {/* Informacion Adicional */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Informacion Adicional
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripcion del Evento
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                  rows={3}
                  placeholder="Describe brevemente el evento..."
                  {...register('descripcion')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requerimientos Especiales
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
                  rows={3}
                  placeholder="Ej: Cobertura de momento especifico, tomas especiales..."
                  {...register('requerimientosEspeciales')}
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#CC0000] text-white py-3 px-4 rounded-md font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </button>
            <p className="text-sm text-gray-500 text-center mt-4">
              Al enviar esta solicitud, aceptas que el equipo de multimedia evaluara
              la disponibilidad y te contactara para confirmar.
            </p>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Universidad de Quintana Roo - Oficina de Multimedia
        </p>
      </div>
    </div>
  );
}
