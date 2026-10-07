import { z } from 'zod';

export const taskPriorityEnum = z.enum(['Low', 'Medium', 'High'], {
  errorMap: () => ({ message: 'Priority must be "Low", "Medium", or "High"' }),
});

export const taskStatusEnum = z.enum(['Pending', 'In Progress', 'Completed'], {
  errorMap: () => ({ message: 'Status must be "Pending", "In Progress", or "Completed"' }),
});

export const createTaskSchema = z.object({
  projectId: z.string().min(1, { message: 'Project ID is required' }),
  name: z.string().trim().min(1, { message: 'Task name is required' }).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  priority: taskPriorityEnum.default('Medium'),
  status: taskStatusEnum.default('Pending'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
});

export const updateTaskSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().trim().min(1, { message: 'Task name cannot be empty' }).max(150).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
});

export const taskQuerySchema = z.object({
  projectId: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 100)),
  sortBy: z.enum(['createdAt', 'name', 'status', 'priority', 'dueDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
