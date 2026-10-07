import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.validator';

export const createProject = async (
  req: Request<{}, {}, CreateProjectInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, status, startDate, endDate } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status: status || 'Not Started',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROJECT_CREATED',
        details: `Created project "${project.name}"`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      search,
      status,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as any;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
    };

    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
              priority: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      }),
    ]);

    // Enhance project objects with task stats
    const formattedProjects = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === 'Completed').length;
      const inProgressTasks = p.tasks.filter((t) => t.status === 'In Progress').length;
      const pendingTasks = p.tasks.filter((t) => t.status === 'Pending').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          progress,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        projects: formattedProjects,
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

export const getProjectById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you do not have permission to access it.',
      });
      return;
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'Completed').length;
    const inProgressTasks = project.tasks.filter((t) => t.status === 'In Progress').length;
    const pendingTasks = project.tasks.filter((t) => t.status === 'Pending').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project,
          stats: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            progress,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request<{ id: string }, {}, UpdateProjectInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, status, startDate, endDate } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!existingProject) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you do not have permission to modify it.',
      });
      return;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      include: {
        tasks: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROJECT_UPDATED',
        details: `Updated project "${updatedProject.name}"`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!existingProject) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you do not have permission to delete it.',
      });
      return;
    }

    await prisma.project.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROJECT_DELETED',
        details: `Deleted project "${existingProject.name}"`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
