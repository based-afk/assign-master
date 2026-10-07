"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const prisma_1 = require("../src/db/prisma");
const app = (0, app_1.createApp)();
describe('Tasks API and Dashboard Tests', () => {
    let userToken;
    let userId;
    let projectId;
    let taskId;
    beforeAll(async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/register').send({
            name: 'Task Master',
            email: `taskmaster_${Date.now()}@example.com`,
            password: 'Password123!',
        });
        userToken = res.body.data.token;
        userId = res.body.data.user.id;
        // Create a project
        const projRes = await (0, supertest_1.default)(app)
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
            await prisma_1.prisma.activityLog.deleteMany({ where: { userId } });
            await prisma_1.prisma.task.deleteMany({ where: { userId } });
            await prisma_1.prisma.project.deleteMany({ where: { userId } });
            await prisma_1.prisma.user.deleteMany({ where: { id: userId } });
        }
        await prisma_1.prisma.$disconnect();
    });
    it('should create a task under a project', async () => {
        const res = await (0, supertest_1.default)(app)
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
        const res = await (0, supertest_1.default)(app)
            .get('/api/tasks?priority=High&status=Pending&search=automated')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.tasks.length).toBe(1);
        expect(res.body.data.tasks[0].id).toBe(taskId);
    });
    it('should update task status to Completed', async () => {
        const res = await (0, supertest_1.default)(app)
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
            status: 'Completed',
        });
        expect(res.status).toBe(200);
        expect(res.body.data.task.status).toBe('Completed');
    });
    it('should return accurate dashboard metrics', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.summary.totalProjects).toBe(1);
        expect(res.body.data.summary.totalTasks).toBe(1);
        expect(res.body.data.summary.completedTasks).toBe(1);
        expect(res.body.data.summary.pendingTasks).toBe(0);
    });
});
