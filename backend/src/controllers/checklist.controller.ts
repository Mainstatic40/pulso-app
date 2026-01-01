import { Request, Response, NextFunction } from 'express';
import { checklistService } from '../services/checklist.service';

export const checklistController = {
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const { content, order } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Content is required' },
        });
      }

      const item = await checklistService.addItem(taskId, {
        content: content.trim(),
        order,
      });

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const { content, isCompleted } = req.body;

      // Check if item exists
      const existingItem = await checklistService.getItemById(itemId);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          error: { message: 'Checklist item not found' },
        });
      }

      const item = await checklistService.updateItem(itemId, {
        content: content?.trim(),
        isCompleted,
      });

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;

      // Check if item exists
      const existingItem = await checklistService.getItemById(itemId);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          error: { message: 'Checklist item not found' },
        });
      }

      await checklistService.deleteItem(itemId);

      res.json({
        success: true,
        data: { message: 'Item deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  },

  async reorderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'itemIds array is required' },
        });
      }

      const items = await checklistService.reorderItems(taskId, itemIds);

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  },

  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;

      const items = await checklistService.getItemsByTaskId(taskId);

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  },
};
