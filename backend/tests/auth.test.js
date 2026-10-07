"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const prisma_1 = require("../src/db/prisma");
const app = (0, app_1.createApp)();
describe('Authentication API Tests', () => {
    const testUser = {
        name: 'Unit Tester',
        email: `tester_${Date.now()}@example.com`,
        password: 'TestPassword123!',
    };
    afterAll(async () => {
        // Cleanup created test user
        await prisma_1.prisma.activityLog.deleteMany({ where: { user: { email: testUser.email } } });
        await prisma_1.prisma.user.deleteMany({ where: { email: testUser.email } });
        await prisma_1.prisma.$disconnect();
    });
    it('should register a new user successfully', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/register').send(testUser);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
        expect(res.body.data.user.password).toBeUndefined(); // Password must NEVER be returned
        expect(res.body.data.token).toBeDefined();
    });
    it('should reject registration with already registered email', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/register').send(testUser);
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });
    it('should reject registration with invalid email or short password', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/register').send({
            name: 'A',
            email: 'invalid-email',
            password: '123',
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
    });
    it('should login successfully with valid credentials', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    });
    it('should fail login with incorrect password', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/login').send({
            email: testUser.email,
            password: 'WrongPassword!',
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
    it('should return user profile on /api/auth/me with valid Bearer token', async () => {
        const loginRes = await (0, supertest_1.default)(app).post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password,
        });
        const token = loginRes.body.data.token;
        const meRes = await (0, supertest_1.default)(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);
        expect(meRes.status).toBe(200);
        expect(meRes.body.data.user.email).toBe(testUser.email.toLowerCase());
    });
    it('should reject protected route when token is missing', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/auth/me');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
