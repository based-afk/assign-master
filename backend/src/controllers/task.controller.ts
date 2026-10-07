import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { CreateTaskInput, UpdateTaskInput } from '../validators/task.validator';

export const createTask = async (
  req: Request<{}, {}, CreateTaskInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId, name, description, priority, status, dueDate } = req.body;

    // Verify parent project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Parent project not found or does not belong to you.',
      });
      return;
    }

    const task = await prisma.task.create({
      data: {
        name,
        description: description || null,
        priority: priority || 'Medium',
        status: status || 'Pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'TASK_CREATED',
        details: `Created task "${task.name}" in project "${project.name}"`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      projectId,
      search,
      status,
      priority,
      page = 1,
      limit = 100,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as any;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 100));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
    };

    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      where.priority = priority;
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found or you do not have permission to access it.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request<{ id: string }, {}, UpdateTaskInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { projectId, name, description, priority, status, dueDate } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found or you do not have permission to modify it.',
      });
      return;
    }

    // If moving to a new project, verify destination project ownership
    if (projectId && projectId !== existingTask.projectId) {
      const destinationProject = await prisma.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!destinationProject) {
        res.status(404).json({
          success: false,
          message: 'Destination project not found or does not belong to you.',
        });
        return;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(projectId !== undefined && { projectId }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: status === 'Completed' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
        details: `${status === 'Completed' ? 'Completed' : 'Updated'} task "${updatedTask.name}"`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found or you do not have permission to delete it.',
      });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'TASK_DELETED',
        details: `Deleted task "${existingTask.name}"`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
