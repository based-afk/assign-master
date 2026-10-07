import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';

const app = createApp();

describe('Tasks API and Dashboard Tests', () => {
  let userToken: string;
  let userId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Task Master',
      email: `taskmaster_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    userToken = res.body.data.token;
    userId = res.body.data.user.id;

    // Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Dashboard Test Project',
        description: 'Test container',
        status: 'In Progress',
      });
    projectId = projRes.body.data.project.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.activityLog.deleteMany({ where: { userId } });
      await prisma.task.deleteMany({ where: { userId } });
      await prisma.project.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it('should create a task under a project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        projectId,
        name: 'Set up automated tests',
        description: 'Configure Jest and Supertest',
        priority: 'High',
        status: 'Pending',
        dueDate: '2026-10-30',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task.name).toBe('Set up automated tests');
    expect(res.body.data.task.priority).toBe('High');
    taskId = res.body.data.task.id;
  });

  it('should query tasks with status, priority, and search filters', async () => {
    const res = await request(app)
      .get('/api/tasks?priority=High&status=Pending&search=automated')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBe(1);
    expect(res.body.data.tasks[0].id).toBe(taskId);
  });

  it('should update task status to Completed', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        status: 'Completed',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('Completed');
  });

  it('should return accurate dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalProjects).toBe(1);
    expect(res.body.data.summary.totalTasks).toBe(1);
    expect(res.body.data.summary.completedTasks).toBe(1);
    expect(res.body.data.summary.pendingTasks).toBe(0);
  });
});
