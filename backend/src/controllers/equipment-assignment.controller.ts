import type { Request, Response, NextFunction } from 'express';
import { equipmentAssignmentService } from '../services/equipment-assignment.service';
import type {
  ListAssignmentsQuery,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  ReturnEquipmentInput,
} from '../schemas/equipment-assignment.schema';

export const equipmentAssignmentController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListAssignmentsQuery;
      const result = await equipmentAssignmentService.findAll(query);

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
      const assignment = await equipmentAssignmentService.findById(id);

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateAssignmentInput;
      const assignments = await equipmentAssignmentService.create(
        input,
        req.user!.userId
      );

      res.status(201).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateAssignmentInput;
      const assignment = await equipmentAssignmentService.update(id, input);

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  },

  async returnEquipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as ReturnEquipmentInput;
      const assignment = await equipmentAssignmentService.returnEquipment(
        id,
        input
      );

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await equipmentAssignmentService.delete(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
