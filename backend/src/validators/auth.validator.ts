import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Full name must be at least 2 characters' }).max(100),
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase().trim(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase().trim(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
