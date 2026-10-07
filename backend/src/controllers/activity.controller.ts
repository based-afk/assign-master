import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';

export const getActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const activities = await prisma.activityLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    next(error);
  }
};
