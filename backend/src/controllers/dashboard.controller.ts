import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [
      totalProjects,
      projectsInProgress,
      projectsCompleted,
      projectsNotStarted,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      recentProjects,
      recentTasks,
      recentActivities,
    ] = await Promise.all([
      // Projects count
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: 'In Progress' } }),
      prisma.project.count({ where: { userId, status: 'Completed' } }),
      prisma.project.count({ where: { userId, status: 'Not Started' } }),

      // Tasks count
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'Completed' } }),
      prisma.task.count({ where: { userId, status: 'Pending' } }),
      prisma.task.count({ where: { userId, status: 'In Progress' } }),

      // Priority distribution
      prisma.task.count({ where: { userId, priority: 'High' } }),
      prisma.task.count({ where: { userId, priority: 'Medium' } }),
      prisma.task.count({ where: { userId, priority: 'Low' } }),

      // Recent 5 projects with task metrics
      prisma.project.findMany({
        where: { userId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),

      // Recent 6 tasks
      prisma.task.findMany({
        where: { userId },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Recent activity logs
      prisma.activityLog.findMany({
        where: { userId },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const projectCompletionRate =
      totalProjects > 0 ? Math.round((projectsCompleted / totalProjects) * 100) : 0;

    const formattedRecentProjects = recentProjects.map((p) => {
      const taskCount = p.tasks.length;
      const doneCount = p.tasks.filter((t) => t.status === 'Completed').length;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        totalTasks: taskCount,
        completedTasks: doneCount,
        progress: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          projectsInProgress,
          inProgressTasks,
          projectsCompleted,
          projectsNotStarted,
          taskCompletionRate,
          projectCompletionRate,
        },
        priorityBreakdown: {
          high: highPriorityTasks,
          medium: mediumPriorityTasks,
          low: lowPriorityTasks,
        },
        statusBreakdown: {
          projects: {
            notStarted: projectsNotStarted,
            inProgress: projectsInProgress,
            completed: projectsCompleted,
          },
          tasks: {
            pending: pendingTasks,
            inProgress: inProgressTasks,
            completed: completedTasks,
          },
        },
        recentProjects: formattedRecentProjects,
        recentTasks,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};
