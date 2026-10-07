import bcrypt from 'bcryptjs';
import { prisma } from './db/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.activityLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Demo User
  const demoUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'demo@example.com',
      password: passwordHash,
    },
  });
  console.log(`👤 Created Demo User: ${demoUser.email} (Password: Password123!)`);

  // 2. Create Second User for isolation test
  const testUser = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password: passwordHash,
    },
  });

  // Projects for Alex
  const project1 = await prisma.project.create({
    data: {
      name: 'Mobile App Redesign',
      description: 'Revamping the core mobile client with a modern, Apple-inspired minimal UI and offline support.',
      status: 'In Progress',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-11-15'),
      userId: demoUser.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Cloud Infrastructure Migration',
      description: 'Migrating microservices and database instances to high-availability Kubernetes clusters.',
      status: 'In Progress',
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-10-30'),
      userId: demoUser.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Security & Compliance Audit',
      description: 'Quarterly penetration testing, role-based authorization audit, and SOC2 compliance validation.',
      status: 'Completed',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-08-30'),
      userId: demoUser.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: 'AI Smart Assistant Integration',
      description: 'Integrating intelligent task categorization and natural language scheduling assistant.',
      status: 'Not Started',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-12-31'),
      userId: demoUser.id,
    },
  });

  // Tasks for Project 1 (Mobile App Redesign)
  await prisma.task.createMany({
    data: [
      {
        name: 'Design high-fidelity Figma components',
        description: 'Create cohesive design tokens, typography scales, and dark/light modes.',
        priority: 'High',
        status: 'Completed',
        dueDate: new Date('2026-09-20'),
        projectId: project1.id,
        userId: demoUser.id,
      },
      {
        name: 'Implement biometric and Keychain auth',
        description: 'Secure token storage using Expo SecureStore and Android Keystore.',
        priority: 'High',
        status: 'In Progress',
        dueDate: new Date('2026-10-15'),
        projectId: project1.id,
        userId: demoUser.id,
      },
      {
        name: 'Build project dashboard & pull-to-refresh',
        description: 'Ensure smooth gestures and responsive layout across phones and tablets.',
        priority: 'Medium',
        status: 'In Progress',
        dueDate: new Date('2026-10-22'),
        projectId: project1.id,
        userId: demoUser.id,
      },
      {
        name: 'Conduct accessibility testing (WCAG 2.1 AA)',
        description: 'Verify color contrast, screen reader labels, and minimum tap targets.',
        priority: 'Low',
        status: 'Pending',
        dueDate: new Date('2026-11-05'),
        projectId: project1.id,
        userId: demoUser.id,
      },
    ],
  });

  // Tasks for Project 2 (Cloud Migration)
  await prisma.task.createMany({
    data: [
      {
        name: 'Provision PostgreSQL RDS multi-region replicas',
        description: 'Setup automated daily backups and zero-downtime failover test.',
        priority: 'High',
        status: 'Completed',
        dueDate: new Date('2026-09-10'),
        projectId: project2.id,
        userId: demoUser.id,
      },
      {
        name: 'Configure rate limiting & Cloudflare WAF',
        description: 'Prevent brute-force and DDoS attacks on auth and public endpoints.',
        priority: 'Medium',
        status: 'In Progress',
        dueDate: new Date('2026-10-18'),
        projectId: project2.id,
        userId: demoUser.id,
      },
      {
        name: 'Setup Prometheus & Grafana alerts',
        description: 'Monitor API p99 latency, database connections, and memory utilization.',
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date('2026-10-28'),
        projectId: project2.id,
        userId: demoUser.id,
      },
    ],
  });

  // Tasks for Project 3 (Security Audit)
  await prisma.task.createMany({
    data: [
      {
        name: 'Run automated static code analysis',
        description: 'Audit dependencies for CVE vulnerabilities and secret leakages.',
        priority: 'High',
        status: 'Completed',
        dueDate: new Date('2026-07-20'),
        projectId: project3.id,
        userId: demoUser.id,
      },
      {
        name: 'Rotate production API keys and JWT signing secrets',
        description: 'Ensure all staging and production secrets are managed in vault.',
        priority: 'High',
        status: 'Completed',
        dueDate: new Date('2026-08-15'),
        projectId: project3.id,
        userId: demoUser.id,
      },
    ],
  });

  // Tasks for Project 4 (AI Integration)
  await prisma.task.createMany({
    data: [
      {
        name: 'Evaluate LLM latency benchmarks',
        description: 'Test structured JSON output generation for task breakdown.',
        priority: 'Low',
        status: 'Pending',
        dueDate: new Date('2026-11-20'),
        projectId: project4.id,
        userId: demoUser.id,
      },
    ],
  });

  // Project and tasks for Sarah (to verify user data isolation)
  const sarahProject = await prisma.project.create({
    data: {
      name: 'Confidential Internal Operations',
      description: 'This is private to Sarah and should NEVER be visible to Alex.',
      status: 'In Progress',
      userId: testUser.id,
    },
  });

  await prisma.task.create({
    data: {
      name: 'Private Sarah Task',
      description: 'Secret checklist',
      priority: 'High',
      status: 'Pending',
      projectId: sarahProject.id,
      userId: testUser.id,
    },
  });

  // Activity logs for demo user
  await prisma.activityLog.createMany({
    data: [
      {
        userId: demoUser.id,
        action: 'PROJECT_CREATED',
        details: 'Created project "Mobile App Redesign"',
      },
      {
        userId: demoUser.id,
        action: 'TASK_CREATED',
        details: 'Created task "Implement biometric and Keychain auth"',
      },
      {
        userId: demoUser.id,
        action: 'TASK_COMPLETED',
        details: 'Completed task "Design high-fidelity Figma components"',
      },
      {
        userId: demoUser.id,
        action: 'USER_LOGGED_IN',
        details: 'Logged in from Web Client',
      },
    ],
  });

  console.log('✅ Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
