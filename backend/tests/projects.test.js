"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const prisma_1 = require("../src/db/prisma");
const app = (0, app_1.createApp)();
describe('Projects API and Ownership Isolation Tests', () => {
    let userAToken;
    let userBToken;
    let userAId;
    let userBId;
    let createdProjectId;
    beforeAll(async () => {
        // Register User A
        const resA = await (0, supertest_1.default)(app).post('/api/auth/register').send({
            name: 'User Alpha',
            email: `alpha_${Date.now()}@example.com`,
            password: 'Password123!',
        });
        userAToken = resA.body.data.token;
        userAId = resA.body.data.user.id;
        // Register User B
        const resB = await (0, supertest_1.default)(app).post('/api/auth/register').send({
            name: 'User Beta',
            email: `beta_${Date.now()}@example.com`,
            password: 'Password123!',
        });
        userBToken = resB.body.data.token;
        userBId = resB.body.data.user.id;
    });
    afterAll(async () => {
        if (userAId) {
            await prisma_1.prisma.activityLog.deleteMany({ where: { userId: userAId } });
            await prisma_1.prisma.task.deleteMany({ where: { userId: userAId } });
            await prisma_1.prisma.project.deleteMany({ where: { userId: userAId } });
            await prisma_1.prisma.user.deleteMany({ where: { id: userAId } });
        }
        if (userBId) {
            await prisma_1.prisma.activityLog.deleteMany({ where: { userId: userBId } });
            await prisma_1.prisma.task.deleteMany({ where: { userId: userBId } });
            await prisma_1.prisma.project.deleteMany({ where: { userId: userBId } });
            await prisma_1.prisma.user.deleteMany({ where: { id: userBId } });
        }
        await prisma_1.prisma.$disconnect();
    });
    it('User A should create a project successfully', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            name: 'Alpha Website Redesign',
            description: 'New corporate portal',
            status: 'In Progress',
            startDate: '2026-10-01',
            endDate: '2026-12-01',
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.project.name).toBe('Alpha Website Redesign');
        createdProjectId = res.body.data.project.id;
    });
    it('User A should list their own projects', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${userAToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data.projects[0].name).toBe('Alpha Website Redesign');
    });
    it('User B should NOT see User A projects (Isolation test)', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${userBToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.projects.length).toBe(0);
    });
    it('User B should NOT be able to view or edit User A project by ID (Security authorization)', async () => {
        // Attempt View
        const getRes = await (0, supertest_1.default)(app)
            .get(`/api/projects/${createdProjectId}`)
            .set('Authorization', `Bearer ${userBToken}`);
        expect(getRes.status).toBe(404);
        // Attempt Edit
        const putRes = await (0, supertest_1.default)(app)
            .put(`/api/projects/${createdProjectId}`)
            .set('Authorization', `Bearer ${userBToken}`)
            .send({ name: 'Hacked Project Name' });
        expect(putRes.status).toBe(404);
    });
    it('User A can update project details', async () => {
        const res = await (0, supertest_1.default)(app)
            .put(`/api/projects/${createdProjectId}`)
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            status: 'Completed',
            description: 'Updated description',
        });
        expect(res.status).toBe(200);
        expect(res.body.data.project.status).toBe('Completed');
        expect(res.body.data.project.description).toBe('Updated description');
    });
});
