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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg sm:p-8">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500 sm:mb-4 sm:h-16 sm:w-16" />
          <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Acceso no valido</h2>
          <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">
            El codigo de acceso no es valido o el formulario esta desactivado.
          </p>
          <p className="text-xs text-gray-500 sm:text-sm">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 sm:mb-4 sm:h-16 sm:w-16">
              <CheckCircle className="h-7 w-7 text-green-600 sm:h-8 sm:w-8" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-gray-900 sm:text-xl">Solicitud Enviada!</h2>
            <p className="mb-3 text-sm text-gray-600 sm:mb-4 sm:text-base">Tu solicitud ha sido recibida correctamente.</p>

            <div className="mb-3 rounded-lg bg-gray-50 p-3 sm:mb-4 sm:p-4">
              <p className="mb-1 text-xs text-gray-500 sm:text-sm">Codigo de solicitud:</p>
              <p className="font-mono text-base font-bold text-gray-900 sm:text-lg">{submitResult.code}</p>
            </div>

            <div className="mb-3 rounded-lg bg-blue-50 p-3 sm:mb-4 sm:p-4">
              <p className="mb-1 text-xs text-blue-600 sm:text-sm">Tu codigo de acceso (guardalo):</p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-mono text-base font-bold text-blue-900 sm:text-lg">{submitResult.token}</p>
                <button
                  onClick={handleCopyToken}
                  className="min-h-[36px] min-w-[36px] rounded p-1.5 hover:bg-blue-100 sm:min-h-0 sm:min-w-0 sm:p-1"
                  title="Copiar"
                >
                  <Copy className={`h-4 w-4 ${copiedToken ? 'text-green-600' : 'text-blue-600'}`} />
                </button>
              </div>
              {copiedToken && (
                <p className="mt-1 text-xs text-green-600">Copiado!</p>
              )}
              <p className="mt-2 text-[10px] text-blue-500 sm:text-xs">
                Usa este codigo para ver y editar tus solicitudes.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => navigate(`/mis-solicitudes/${submitResult.token}`)}
                className="min-h-[44px] flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:min-h-0 sm:py-2"
              >
                Ver mis solicitudes
              </button>
              <button
                onClick={() => navigate(`/solicitar/${accessCode}`)}
                className="min-h-[44px] flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:min-h-0 sm:py-2"
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
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        {/* Back button */}
        <button
          onClick={() => navigate(`/solicitar/${accessCode}`)}
          className="mb-4 flex min-h-[36px] items-center gap-2 text-sm text-gray-600 hover:text-gray-900 sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al portal
        </button>

        {/* Header */}
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-[#CC0000] sm:text-3xl">PULSO</h1>
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Solicitud de Cobertura de Evento</h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Completa el formulario para solicitar servicios de multimedia para tu evento.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg bg-white p-4 shadow-lg sm:space-y-8 sm:p-6">
          {submitError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 sm:p-4 sm:text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
              {submitError}
            </div>
          )}

          {/* Datos del Solicitante */}
          <section>
            <h3 className="mb-3 border-b pb-2 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
              Informacion del Solicitante
            </h3>

            {/* Tipo de Organizacion */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
                Tipo de organizacion *
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors sm:gap-3 sm:p-4 ${tipoOrganizacion === 'facultad' ? 'border-[#CC0000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    value="facultad"
                    className="h-5 w-5 text-[#CC0000] focus:ring-[#CC0000] sm:h-4 sm:w-4"
                    {...register('tipoOrganizacion')}
                  />
                  <GraduationCap className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
                  <span className="text-sm font-medium sm:text-base">Facultad/Escuela</span>
                </label>
                <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors sm:gap-3 sm:p-4 ${tipoOrganizacion === 'departamento' ? 'border-[#CC0000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    value="departamento"
                    className="h-5 w-5 text-[#CC0000] focus:ring-[#CC0000] sm:h-4 sm:w-4"
                    {...register('tipoOrganizacion')}
                  />
                  <Building2 className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
                  <span className="text-sm font-medium sm:text-base">Departamento</span>
                </label>
              </div>
              {errors.tipoOrganizacion && (
                <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.tipoOrganizacion.message}</p>
              )}
            </div>

            {/* Facultad/Escuela */}
            {tipoOrganizacion === 'facultad' && (
              <div className="mb-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                    Facultad/Escuela *
                  </label>
                  <select
                    className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.facultad ? 'border-red-500' : 'border-gray-300'}`}
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
                    <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.facultad.message}</p>
                  )}
                </div>

                {mostrarCarreras && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                      Carrera *
                    </label>
                    <select
                      className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.facultadCarrera ? 'border-red-500' : 'border-gray-300'}`}
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
                      <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.facultadCarrera.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Departamento */}
            {tipoOrganizacion === 'departamento' && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Nombre del departamento *
                </label>
                <input
                  type="text"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.departamentoNombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Servicios Escolares, Recursos Humanos..."
                  {...register('departamentoNombre')}
                />
                {errors.departamentoNombre && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.departamentoNombre.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Nombre del solicitante *
                </label>
                <input
                  type="text"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.solicitanteNombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Tu nombre completo"
                  {...register('solicitanteNombre')}
                />
                {errors.solicitanteNombre && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.solicitanteNombre.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Cargo *
                </label>
                <select
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.solicitanteCargo ? 'border-red-500' : 'border-gray-300'}`}
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
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.solicitanteCargo.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Email institucional *
                </label>
                <input
                  type="email"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.solicitanteEmail ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="correo@universidad.edu.mx"
                  {...register('solicitanteEmail')}
                />
                {errors.solicitanteEmail && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.solicitanteEmail.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Telefono de contacto *
                </label>
                <input
                  type="tel"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.solicitanteTelefono ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: 618-123-4567"
                  {...register('solicitanteTelefono')}
                />
                {errors.solicitanteTelefono && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.solicitanteTelefono.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Datos del Evento */}
          <section>
            <h3 className="mb-3 border-b pb-2 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
              Datos del Evento
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.eventoNombre ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Ceremonia de Graduacion 2026"
                  {...register('eventoNombre')}
                />
                {errors.eventoNombre && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.eventoNombre.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Tipo de Evento *
                </label>
                <select
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.eventoTipo ? 'border-red-500' : 'border-gray-300'}`}
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
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.eventoTipo.message}</p>
                )}
              </div>
              {eventoTipo === 'otro' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                    Especifica el tipo *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2"
                    placeholder="Describe el tipo de evento"
                    {...register('eventoTipoOtro')}
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Fecha del Evento *
                </label>
                <input
                  type="date"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.eventoFecha ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoFecha')}
                />
                {errors.eventoFecha && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.eventoFecha.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.eventoHoraInicio ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoHoraInicio')}
                />
                {errors.eventoHoraInicio && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.eventoHoraInicio.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.eventoHoraFin ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('eventoHoraFin')}
                />
                {errors.eventoHoraFin && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.eventoHoraFin.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Ubicacion *
                </label>
                <input
                  type="text"
                  className={`w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2 ${errors.eventoUbicacion ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Auditorio Principal, Campus Norte"
                  {...register('eventoUbicacion')}
                />
                {errors.eventoUbicacion && (
                  <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.eventoUbicacion.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Numero de Asistentes Esperados
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2"
                  placeholder="Ej: 200"
                  {...register('eventoAsistentes', { valueAsNumber: true })}
                />
              </div>
            </div>
          </section>

          {/* Servicios Requeridos */}
          <section>
            <h3 className="mb-3 border-b pb-2 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
              Servicios Requeridos
            </h3>
            <p className="mb-3 text-xs text-gray-600 sm:mb-4 sm:text-sm">Selecciona los servicios que necesitas para tu evento:</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors hover:bg-gray-50 sm:gap-3 sm:p-4">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-[#CC0000] focus:ring-[#CC0000]"
                  {...register('servicioFotografia')}
                />
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
                  <span className="text-sm font-medium sm:text-base">Fotografia</span>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors hover:bg-gray-50 sm:gap-3 sm:p-4">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-[#CC0000] focus:ring-[#CC0000]"
                  {...register('servicioVideo')}
                />
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
                  <span className="text-sm font-medium sm:text-base">Video</span>
                </div>
              </label>
            </div>
          </section>

          {/* Informacion Adicional */}
          <section>
            <h3 className="mb-3 border-b pb-2 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
              Informacion Adicional
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Descripcion del Evento
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2"
                  rows={3}
                  placeholder="Describe brevemente el evento..."
                  {...register('descripcion')}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Requerimientos Especiales
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] sm:py-2"
                  rows={3}
                  placeholder="Ej: Cobertura de momento especifico, tomas especiales..."
                  {...register('requerimientosEspeciales')}
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="border-t pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-[#CC0000] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-5 sm:w-5"></div>
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </button>
            <p className="mt-3 text-center text-[10px] text-gray-500 sm:mt-4 sm:text-sm">
              Al enviar esta solicitud, aceptas que el equipo de multimedia evaluara
              la disponibilidad y te contactara para confirmar.
            </p>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-gray-500 sm:mt-6 sm:text-sm">
          Universidad de Quintana Roo - Oficina de Multimedia
        </p>
      </div>
    </div>
  );
}
