import type { Request, Response, NextFunction } from 'express';
import { equipmentService } from '../services/equipment.service';
import type {
  ListEquipmentQuery,
  AvailableEquipmentQuery,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  UpdateEquipmentStatusInput,
} from '../schemas/equipment.schema';

export const equipmentController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListEquipmentQuery;
      const result = await equipmentService.findAll(query);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as AvailableEquipmentQuery;
      const equipment = await equipmentService.findAvailableForTimeRange(query);

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const equipment = await equipmentService.findById(id);

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateEquipmentInput;
      const equipment = await equipmentService.create(input);

      res.status(201).json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateEquipmentInput;
      const equipment = await equipmentService.update(id, input);

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateEquipmentStatusInput;
      const equipment = await equipmentService.updateStatus(id, input);

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await equipmentService.delete(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
