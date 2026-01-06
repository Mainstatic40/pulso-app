import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/app-error';

const prisma = new PrismaClient();

// Generar codigo unico para solicitud (SOL-2026-00001)
function generateRequestCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `SOL-${year}-${random}`;
}

// Generar token unico: 6 digitos
function generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const eventRequestService = {
  // ========== CONFIGURACION ==========

  async getConfig() {
    let config = await prisma.eventRequestConfig.findFirst();
    if (!config) {
      // Crear configuracion por defecto
      config = await prisma.eventRequestConfig.create({
        data: {
          accessCode: 'MULTIMEDIA' + new Date().getFullYear(),
          isActive: true,
          rateLimit: 5
        }
      });
    }
    return config;
  },

  async updateConfig(data: { accessCode?: string; isActive?: boolean; rateLimit?: number }) {
    const config = await this.getConfig();
    return prisma.eventRequestConfig.update({
      where: { id: config.id },
      data
    });
  },

  async validateAccessCode(code: string): Promise<boolean> {
    const config = await this.getConfig();
    return config.isActive && config.accessCode === code;
  },

  // ========== SOLICITUDES ==========

  async create(data: {
    // Organización
    tipoOrganizacion: 'facultad' | 'departamento';
    facultad?: string;
    facultadCarrera?: string;
    departamentoNombre?: string;
    // Solicitante
    solicitanteNombre: string;
    solicitanteCargo: string;
    solicitanteEmail: string;
    solicitanteTelefono: string;
    // Evento
    eventoNombre: string;
    eventoTipo: string;
    eventoTipoOtro?: string;
    eventoFecha: Date;
    eventoHoraInicio: string;
    eventoHoraFin: string;
    eventoUbicacion: string;
    eventoAsistentes?: number;
    // Servicios
    servicioFotografia?: boolean;
    servicioVideo?: boolean;
    // Detalles
    descripcion?: string;
    requerimientosEspeciales?: string;
    ipAddress?: string;
  }) {
    // Generar codigo unico
    let code = generateRequestCode();
    let exists = await prisma.eventRequest.findUnique({ where: { code } });
    while (exists) {
      code = generateRequestCode();
      exists = await prisma.eventRequest.findUnique({ where: { code } });
    }

    // Crear solicitud
    const request = await prisma.eventRequest.create({
      data: {
        code,
        ...data
      }
    });

    // Crear o obtener token del solicitante
    const token = await this.getOrCreateSolicitorToken(data.solicitanteEmail);

    return { request, token };
  },

  async findById(id: string) {
    return prisma.eventRequest.findUnique({
      where: { id },
      include: { event: true }
    });
  },

  async findByCode(code: string) {
    return prisma.eventRequest.findUnique({
      where: { code },
      include: { event: true }
    });
  },

  async findAll(params?: { status?: string; limit?: number }) {
    return prisma.eventRequest.findMany({
      where: params?.status ? { status: params.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 100,
      include: { event: true }
    });
  },

  async findPending() {
    return prisma.eventRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' }
    });
  },

  async findByEmail(email: string) {
    return prisma.eventRequest.findMany({
      where: { solicitanteEmail: email },
      orderBy: { createdAt: 'desc' },
      include: { event: true }
    });
  },

  async update(id: string, email: string, data: {
    // Organización
    tipoOrganizacion?: 'facultad' | 'departamento';
    facultad?: string;
    facultadCarrera?: string;
    departamentoNombre?: string;
    // Solicitante
    solicitanteNombre?: string;
    solicitanteCargo?: string;
    solicitanteTelefono?: string;
    // Evento
    eventoNombre?: string;
    eventoTipo?: string;
    eventoTipoOtro?: string;
    eventoFecha?: Date;
    eventoHoraInicio?: string;
    eventoHoraFin?: string;
    eventoUbicacion?: string;
    eventoAsistentes?: number;
    // Servicios
    servicioFotografia?: boolean;
    servicioVideo?: boolean;
    // Detalles
    descripcion?: string;
    requerimientosEspeciales?: string;
  }) {
    const request = await prisma.eventRequest.findUnique({ where: { id } });

    if (!request) throw new AppError('Solicitud no encontrada', 404);
    if (request.solicitanteEmail !== email) throw new AppError('No autorizado', 403);
    if (request.status !== 'changes_requested') {
      throw new AppError('Solo puedes editar solicitudes con cambios solicitados', 400);
    }

    return prisma.eventRequest.update({
      where: { id },
      data: {
        ...data,
        status: 'pending',
        respondedAt: null,
        mensajeSolicitante: null
      },
      include: { event: true }
    });
  },

  // ========== RESPUESTAS ==========

  async approve(id: string, data: { notasInternas?: string; mensajeSolicitante?: string; respondedBy: string }) {
    const request = await prisma.eventRequest.findUnique({ where: { id } });
    if (!request) throw new AppError('Solicitud no encontrada', 404);

    // Crear evento automaticamente
    const eventDate = new Date(request.eventoFecha);
    const event = await prisma.event.create({
      data: {
        name: request.eventoNombre,
        eventType: 'congress', // Default type, puede ser ajustado
        startDatetime: eventDate,
        endDatetime: eventDate,
        description: request.descripcion || '',
        clientRequirements: request.requerimientosEspeciales,
        createdBy: data.respondedBy
      }
    });

    // Actualizar solicitud
    const updated = await prisma.eventRequest.update({
      where: { id },
      data: {
        status: 'approved',
        notasInternas: data.notasInternas,
        mensajeSolicitante: data.mensajeSolicitante,
        respondedAt: new Date(),
        respondedBy: data.respondedBy,
        eventId: event.id
      },
      include: { event: true }
    });

    return updated;
  },

  async reject(id: string, data: { notasInternas?: string; mensajeSolicitante?: string; respondedBy: string }) {
    const updated = await prisma.eventRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        notasInternas: data.notasInternas,
        mensajeSolicitante: data.mensajeSolicitante,
        respondedAt: new Date(),
        respondedBy: data.respondedBy
      }
    });

    return updated;
  },

  async requestChanges(id: string, data: { notasInternas?: string; mensajeSolicitante?: string; respondedBy: string }) {
    const updated = await prisma.eventRequest.update({
      where: { id },
      data: {
        status: 'changes_requested',
        notasInternas: data.notasInternas,
        mensajeSolicitante: data.mensajeSolicitante,
        respondedAt: new Date(),
        respondedBy: data.respondedBy
      }
    });

    return updated;
  },

  // ========== TOKENS DE SOLICITANTE ==========

  async getOrCreateSolicitorToken(email: string): Promise<string> {
    let solicitor = await prisma.solicitorToken.findUnique({ where: { email } });

    if (!solicitor) {
      // Generar token unico
      let token = generateToken();

      // Verificar que no exista
      let exists = await prisma.solicitorToken.findUnique({ where: { token } });
      while (exists) {
        token = generateToken();
        exists = await prisma.solicitorToken.findUnique({ where: { token } });
      }

      solicitor = await prisma.solicitorToken.create({
        data: {
          email,
          token
        }
      });
    }

    return solicitor.token;
  },

  async findByToken(token: string) {
    const solicitor = await prisma.solicitorToken.findUnique({ where: { token } });
    if (!solicitor) return null;

    const requests = await this.findByEmail(solicitor.email);
    return { email: solicitor.email, requests };
  },

  async sendTokenByEmail(email: string): Promise<boolean> {
    const solicitor = await prisma.solicitorToken.findUnique({ where: { email } });
    if (!solicitor) return false;

    // TODO: Enviar email con el link

    return true;
  },

  // ========== RATE LIMITING ==========

  async checkRateLimit(ipAddress: string): Promise<boolean> {
    const config = await this.getConfig();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const count = await prisma.eventRequest.count({
      where: {
        ipAddress,
        createdAt: { gte: oneHourAgo }
      }
    });

    return count < config.rateLimit;
  },

  // ========== ESTADISTICAS ==========

  async getStats() {
    const [total, pending, approved, rejected, changesRequested] = await Promise.all([
      prisma.eventRequest.count(),
      prisma.eventRequest.count({ where: { status: 'pending' } }),
      prisma.eventRequest.count({ where: { status: 'approved' } }),
      prisma.eventRequest.count({ where: { status: 'rejected' } }),
      prisma.eventRequest.count({ where: { status: 'changes_requested' } })
    ]);

    return { total, pending, approved, rejected, changesRequested };
  },

  // ========== RECUPERACION DE CODIGOS ==========

  async createRecoveryRequest(email: string) {
    // Buscar si existe token para este email
    const solicitor = await prisma.solicitorToken.findUnique({
      where: { email }
    });

    // Crear solicitud de recuperación
    await prisma.tokenRecoveryRequest.create({
      data: {
        email,
        token: solicitor?.token || null,
        status: solicitor ? 'pending' : 'not_found'
      }
    });

    return { success: true, message: 'Solicitud enviada al administrador' };
  },

  async getRecoveryRequests() {
    return prisma.tokenRecoveryRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
  },

  async markRecoveryAsSent(id: string) {
    return prisma.tokenRecoveryRequest.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });
  },

  async deleteRecoveryRequest(id: string) {
    return prisma.tokenRecoveryRequest.delete({
      where: { id }
    });
  }
};
