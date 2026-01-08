import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { userService } from '../services/user.service';
import { ValidationError } from '../utils/app-error';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from '../schemas/user.schema';

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await userService.findById(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListUsersQuery;
      const result = await userService.findAll(query);

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
      const user = await userService.findById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateUserInput;
      const user = await userService.create(input);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateUserInput;
      const user = await userService.update(id, input);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.delete(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async hardDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await userService.hardDelete(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.file) {
        throw new ValidationError('No image file provided');
      }

      // Get the previous user data to delete old image if exists
      const previousUser = await userService.findById(id);

      // Delete previous image if exists
      if (previousUser.profileImage) {
        const previousImagePath = path.join(__dirname, '../../uploads/profiles', previousUser.profileImage);
        if (fs.existsSync(previousImagePath)) {
          fs.unlinkSync(previousImagePath);
        }
      }

      // Update user with new image path (just the filename)
      const user = await userService.updateProfileImage(id, req.file.filename);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      next(error);
    }
  },

  async deleteProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { user, previousImage } = await userService.deleteProfileImage(id);

      // Delete the image file if it exists
      if (previousImage) {
        const imagePath = path.join(__dirname, '../../uploads/profiles', previousImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};
