import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { attachmentService } from '../services/attachment.service';

export const attachmentController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId, eventId } = req.body;
      const userId = req.user!.userId;

      // Must have either taskId or eventId
      if (!taskId && !eventId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Either taskId or eventId is required' },
        });
      }

      // Handle both single and multiple files
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file as Express.Multer.File | undefined;

      if (!files?.length && !file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No files uploaded' },
        });
      }

      let attachments;
      if (files && files.length > 0) {
        attachments = await attachmentService.createMany(
          files,
          { taskId, eventId },
          userId
        );
      } else if (file) {
        const attachment = await attachmentService.create(
          {
            filename: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            taskId,
            eventId,
          },
          userId
        );
        attachments = [attachment];
      }

      res.status(201).json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getByTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;

      const attachments = await attachmentService.findByTask(taskId);

      res.json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;

      const attachments = await attachmentService.findByEvent(eventId);

      res.json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      next(error);
    }
  },

  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const attachment = await attachmentService.findById(id);

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: { message: 'Attachment not found' },
        });
      }

      const filePath = attachmentService.getFilePath(attachment.storedName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: { message: 'File not found on server' },
        });
      }

      // Set headers for inline display (preview)
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.filename)}"`);
      res.setHeader('Content-Type', attachment.mimeType);

      res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({
            success: false,
            error: { message: 'Error sending file' },
          });
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;


      const attachment = await attachmentService.findById(id);

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: { message: 'Attachment not found' },
        });
      }

        id: attachment.id,
        filename: attachment.filename,
        storedName: attachment.storedName,
        mimeType: attachment.mimeType,
      });

      const filePath = attachmentService.getFilePath(attachment.storedName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: { message: 'File not found on server' },
        });
      }


      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
      res.setHeader('Content-Type', attachment.mimeType);

      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('[Attachment Download] Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: { message: 'Error sending file' },
            });
          }
        } else {
        }
      });
    } catch (error) {
      console.error('[Attachment Download] Error:', error);
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await attachmentService.delete(id, userId, userRole);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
