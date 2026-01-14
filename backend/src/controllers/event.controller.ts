import type { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { commentService } from '../services/comment.service';
import { eventChecklistService } from '../services/event-checklist.service';
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

  async releaseEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      const event = await eventService.releaseEquipment(id, userId);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async transferEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      const { toUserId } = req.body;

      if (!toUserId) {
        return res.status(400).json({
          success: false,
          error: 'toUserId is required',
        });
      }

      const event = await eventService.transferEquipment(id, userId, toUserId);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  // Comments
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const comments = await commentService.findByEventId(id);

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  },

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
        });
      }

      const comment = await commentService.createForEvent(id, { content: content.trim() }, req.user!.userId);

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  },

  // Checklist
  async getChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const items = await eventChecklistService.getItemsByEventId(id);

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  },

  async addChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
        });
      }

      const item = await eventChecklistService.addItem(id, { content: content.trim() });

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const { content, isCompleted } = req.body;

      const item = await eventChecklistService.updateItem(itemId, {
        ...(content !== undefined && { content }),
        ...(isCompleted !== undefined && { isCompleted }),
      });

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteChecklistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      await eventChecklistService.deleteItem(itemId);

      res.json({
        success: true,
        message: 'Checklist item deleted',
      });
    } catch (error) {
      next(error);
    }
  },
};
