import type { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import type { ListEventsQuery, CreateEventInput, UpdateEventInput } from '../schemas/event.schema';

export const eventController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListEventsQuery;

      // Debug: log filter params
      if (query.eventType) {
        console.log('[EventController] getAll - filtering by eventType:', query.eventType);
      }

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

      // Debug: log event structure
      console.log('[EventController] getById -', {
        id: event.id,
        name: event.name,
        eventType: event.eventType,
        daysCount: event.days?.length || 0,
        shiftsCount: event.days?.reduce((acc, d) => acc + d.shifts.length, 0) || 0,
      });

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

      // Debug: log event creation details
      const totalShifts = input.days?.reduce((acc, day) => acc + day.shifts.length, 0) || 0;
      console.log('[EventController] create -', {
        name: input.name,
        eventType: input.eventType,
        daysCount: input.days?.length || 0,
        totalShifts,
        hasPresetTimes: !!(input.morningStartTime || input.afternoonStartTime),
        usePresetEquipment: input.usePresetEquipment,
        assigneeIdsCount: input.assigneeIds?.length || 0,
      });

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

      // Debug: log event update details
      const totalShifts = input.days?.reduce((acc, day) => acc + day.shifts.length, 0) || 0;
      console.log('[EventController] update -', {
        id,
        eventType: input.eventType,
        daysCount: input.days?.length || 0,
        totalShifts,
        hasPresetTimes: !!(input.morningStartTime || input.afternoonStartTime),
        usePresetEquipment: input.usePresetEquipment,
        updatingDays: input.days !== undefined,
        updatingAssignees: input.assigneeIds !== undefined,
      });

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

      console.log('[EventController] delete - id:', id);

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
