import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { eventRequestService } from '../services/event-request.service';

const prisma = new PrismaClient();

export const eventRequestController = {
  // ========== ENDPOINTS PUBLICOS ==========

  // GET /api/event-requests/public/validate/:code - Validar codigo de acceso
  async validateAccessCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const isValid = await eventRequestService.validateAccessCode(code);
      res.json({ success: true, data: { isValid } });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/event-requests/public/submit/:accessCode - Crear solicitud
  async submitRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessCode } = req.params;

      // Validar codigo
      const isValid = await eventRequestService.validateAccessCode(accessCode);
      if (!isValid) {
        return res.status(403).json({
          success: false,
          error: { message: 'Codigo de acceso invalido o formulario desactivado' }
        });
      }

      // Verificar rate limit
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const withinLimit = await eventRequestService.checkRateLimit(ipAddress);
      if (!withinLimit) {
        return res.status(429).json({
          success: false,
          error: { message: 'Demasiadas solicitudes. Intenta mas tarde.' }
        });
      }

      // Parsear fecha
      const eventoFecha = new Date(req.body.eventoFecha);

      // Crear solicitud
      const { request, token } = await eventRequestService.create({
        ...req.body,
        eventoFecha,
        ipAddress
      });

      res.status(201).json({
        success: true,
        data: {
          code: request.code,
          token,
          message: 'Solicitud enviada correctamente'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/event-requests/public/my-requests/:token - Ver historial por token
  async getByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const data = await eventRequestService.findByToken(token);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: { message: 'Token invalido' }
        });
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/event-requests/public/recover-access - Solicitar recuperación de token
  async recoverAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await eventRequestService.createRecoveryRequest(email);

      // Siempre responder OK para no revelar si el email existe
      res.json({
        success: true,
        message: 'Solicitud enviada. El administrador revisara tu peticion.'
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/event-requests/public/update/:id - Editar solicitud (solo si status es changes_requested)
  async updateRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { token, eventoFecha, ...data } = req.body;

      // Verificar token
      const solicitor = await prisma.solicitorToken.findUnique({ where: { token } });
      if (!solicitor) {
        return res.status(403).json({
          success: false,
          error: { message: 'Token invalido' }
        });
      }

      // Parsear fecha si viene
      const updateData = {
        ...data,
        ...(eventoFecha && { eventoFecha: new Date(eventoFecha) })
      };

      const request = await eventRequestService.update(id, solicitor.email, updateData);
      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/event-requests/public/status/:code - Ver estado de una solicitud
  async getStatusByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const request = await eventRequestService.findByCode(code);

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { message: 'Solicitud no encontrada' }
        });
      }

      // Solo devolver informacion publica
      res.json({
        success: true,
        data: {
          code: request.code,
          status: request.status,
          eventoNombre: request.eventoNombre,
          eventoFecha: request.eventoFecha,
          eventoUbicacion: request.eventoUbicacion,
          mensajeSolicitante: request.mensajeSolicitante,
          createdAt: request.createdAt,
          respondedAt: request.respondedAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== ENDPOINTS PRIVADOS (ADMIN) ==========

  // GET /api/event-requests - Listar todas
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, limit } = req.query;
      const requests = await eventRequestService.findAll({
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/event-requests/pending - Listar pendientes
  async getPending(_req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await eventRequestService.findPending();
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/event-requests/stats - Estadisticas
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await eventRequestService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/event-requests/:id - Ver detalle
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const request = await eventRequestService.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { message: 'Solicitud no encontrada' }
        });
      }

      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/event-requests/:id/approve - Aprobar
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notasInternas, mensajeSolicitante } = req.body;
      const respondedBy = req.user!.userId;

      const request = await eventRequestService.approve(id, {
        notasInternas,
        mensajeSolicitante,
        respondedBy
      });

      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/event-requests/:id/reject - Rechazar
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notasInternas, mensajeSolicitante } = req.body;
      const respondedBy = req.user!.userId;

      const request = await eventRequestService.reject(id, {
        notasInternas,
        mensajeSolicitante,
        respondedBy
      });

      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/event-requests/:id/request-changes - Solicitar cambios
  async requestChanges(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notasInternas, mensajeSolicitante } = req.body;
      const respondedBy = req.user!.userId;

      const request = await eventRequestService.requestChanges(id, {
        notasInternas,
        mensajeSolicitante,
        respondedBy
      });

      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  // ========== CONFIGURACION ==========

  // GET /api/event-requests/config - Obtener configuracion
  async getConfig(_req: Request, res: Response, next: NextFunction) {
    try {
      const config = await eventRequestService.getConfig();
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/event-requests/config - Actualizar configuracion
  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessCode, isActive, rateLimit } = req.body;
      const config = await eventRequestService.updateConfig({
        accessCode,
        isActive,
        rateLimit
      });
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  },

  // ========== RECUPERACION DE TOKENS ==========

  // GET /api/event-requests/recovery - Obtener solicitudes de recuperación pendientes
  async getRecoveryRequests(_req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await eventRequestService.getRecoveryRequests();
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/event-requests/recovery/:id/sent - Marcar como enviado
  async markRecoveryAsSent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const request = await eventRequestService.markRecoveryAsSent(id);
      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/event-requests/recovery/:id - Eliminar solicitud de recuperación
  async deleteRecoveryRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await eventRequestService.deleteRecoveryRequest(id);
      res.json({ success: true, message: 'Solicitud eliminada' });
    } catch (error) {
      next(error);
    }
  }
};
