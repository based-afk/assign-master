import { z } from 'zod';

export const projectStatusEnum = z.enum(['Not Started', 'In Progress', 'Completed'], {
  errorMap: () => ({ message: 'Status must be "Not Started", "In Progress", or "Completed"' }),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, { message: 'Project name is required' }).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  status: projectStatusEnum.default('Not Started'),
  startDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  endDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 50)),
  sortBy: z.enum(['createdAt', 'name', 'status', 'startDate', 'endDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
