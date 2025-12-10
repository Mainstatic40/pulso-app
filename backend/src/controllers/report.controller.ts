import type { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { ValidationError } from '../utils/app-error';

interface ReportQuery {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

function parseQuery(query: ReportQuery) {
  return {
    dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
    dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    userId: query.userId,
  };
}

export const reportController = {
  async getHoursByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(req.query as ReportQuery);
      const result = await reportService.getHoursByUser(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getHoursByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(req.query as ReportQuery);
      const result = await reportService.getHoursByEvent(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getTasksSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(req.query as ReportQuery);
      const result = await reportService.getTasksSummary(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductivity(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(req.query as ReportQuery);
      const result = await reportService.getProductivity(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getWeeklyLogsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(req.query as ReportQuery);
      const result = await reportService.getWeeklyLogsReport(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async exportToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;

      if (!['hours', 'tasks', 'logs'].includes(type)) {
        throw new ValidationError('Invalid export type. Must be: hours, tasks, or logs');
      }

      const query = parseQuery(req.query as ReportQuery);
      const workbook = await reportService.exportToExcel(type, query);

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `pulso-${type}-report-${date}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  },
};
