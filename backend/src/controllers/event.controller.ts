import type { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import type { ListEventsQuery, CreateEventInput, UpdateEventInput } from '../schemas/event.schema';

export const eventController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListEventsQuery;
      const result = await eventService.findAll(query);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const event = await eventService.findById(id);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUpcoming(_req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventService.findUpcoming();

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateEventInput;
      const event = await eventService.create(input, req.user!.userId);

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateEventInput;
      const event = await eventService.update(id, input);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await eventService.delete(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
