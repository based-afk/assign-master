# FocusProject REST API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new user account.

**Rate limit:** 30 attempts per 15 minutes.

**Request Body:**
```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "password": "Password123!"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "cm2exampleid001",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "createdAt": "2026-10-07T21:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `POST /auth/login`
Authenticates a user with email and password.

**Rate limit:** 30 attempts per 15 minutes.

**Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "Password123!"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cm2exampleid001",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "createdAt": "2026-10-07T21:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `POST /auth/logout` *(Protected)*
Invalidates user session.

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### `GET /auth/me` *(Protected)*
Returns the current authenticated user's profile and summary counts.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm2exampleid001",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "createdAt": "2026-10-07T21:00:00.000Z",
      "updatedAt": "2026-10-07T21:00:00.000Z",
      "_count": {
        "projects": 4,
        "tasks": 12
      }
    }
  }
}
```

---

## 2. Project Endpoints *(All Protected)*

### `GET /projects`
List all projects owned by the user.

**Query Parameters:**
- `search` (string, optional): Search by project name or description
- `status` (string, optional): Filter by `"Not Started" | "In Progress" | "Completed"`
- `sortBy` (string, optional): `"createdAt" | "name" | "status" | "startDate" | "endDate"` (default: `"createdAt"`)
- `sortOrder` (string, optional): `"asc" | "desc"` (default: `"desc"`)
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 50)

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_123",
        "name": "Mobile App Redesign",
        "description": "Revamping the core mobile client with Apple minimal styling",
        "status": "In Progress",
        "startDate": "2026-09-01T00:00:00.000Z",
        "endDate": "2026-11-15T00:00:00.000Z",
        "createdAt": "2026-09-01T00:00:00.000Z",
        "updatedAt": "2026-10-07T21:00:00.000Z",
        "stats": {
          "totalTasks": 4,
          "completedTasks": 1,
          "inProgressTasks": 2,
          "pendingTasks": 1,
          "progress": 25
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### `GET /projects/:id`
Fetch a specific project and all its child tasks.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj_123",
      "name": "Mobile App Redesign",
      "description": "...",
      "status": "In Progress",
      "tasks": [
        {
          "id": "task_1",
          "name": "Design Figma components",
          "priority": "High",
          "status": "Completed"
        }
      ],
      "stats": {
        "totalTasks": 1,
        "completedTasks": 1,
        "inProgressTasks": 0,
        "pendingTasks": 0,
        "progress": 100
      }
    }
  }
}
```

---

### `POST /projects`
Create a new project.

**Request Body:**
```json
{
  "name": "Cloud Migration",
  "description": "Migrating database to PostgreSQL",
  "status": "Not Started",
  "startDate": "2026-11-01",
  "endDate": "2026-12-31"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "proj_456",
      "name": "Cloud Migration",
      "status": "Not Started"
    }
  }
}
```

---

### `PUT /projects/:id`
Update existing project details.

**Request Body:**
```json
{
  "name": "Cloud Infrastructure Migration",
  "status": "In Progress"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": { "project": { "id": "proj_456", "name": "Cloud Infrastructure Migration" } }
}
```

---

### `DELETE /projects/:id`
Deletes a project and cascades deletion to child tasks.

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Project deleted successfully."
}
```

---

## 3. Task Endpoints *(All Protected)*

### `GET /tasks`
List and filter tasks.

**Query Parameters:**
- `projectId` (string, optional): Filter by project ID
- `search` (string, optional): Filter by task name or description
- `status` (string, optional): `"Pending" | "In Progress" | "Completed"`
- `priority` (string, optional): `"Low" | "Medium" | "High"`
- `sortBy` (string, optional): `"createdAt" | "name" | "status" | "priority" | "dueDate"`
- `sortOrder` (string, optional): `"asc" | "desc"`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_999",
        "name": "Implement biometrics auth",
        "description": "Using Expo SecureStore",
        "priority": "High",
        "status": "In Progress",
        "dueDate": "2026-10-15T00:00:00.000Z",
        "projectId": "proj_123",
        "project": {
          "id": "proj_123",
          "name": "Mobile App Redesign",
          "status": "In Progress"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 100, "total": 1, "totalPages": 1 }
  }
}
```

---

### `POST /tasks`
Create a new task.

**Request Body:**
```json
{
  "projectId": "proj_123",
  "name": "Configure rate limiters",
  "description": "Prevent brute force attacks",
  "priority": "Medium",
  "status": "Pending",
  "dueDate": "2026-10-25"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": { "task": { "id": "task_new", "name": "Configure rate limiters" } }
}
```

---

### `PUT /tasks/:id`
Update task attributes or toggle status.

**Request Body:**
```json
{
  "status": "Completed"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": { "task": { "id": "task_new", "status": "Completed" } }
}
```

---

### `DELETE /tasks/:id`
Delete a task.

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Task deleted successfully."
}
```

---

## 4. Dashboard Endpoint *(Protected)*

### `GET /dashboard`
Aggregates summary statistics, priority breakdown, recent projects, and active tasks.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProjects": 4,
      "totalTasks": 10,
      "completedTasks": 5,
      "pendingTasks": 3,
      "projectsInProgress": 2,
      "inProgressTasks": 2,
      "projectsCompleted": 1,
      "projectsNotStarted": 1,
      "taskCompletionRate": 50,
      "projectCompletionRate": 25
    },
    "priorityBreakdown": {
      "high": 4,
      "medium": 4,
      "low": 2
    },
    "recentProjects": [...],
    "recentTasks": [...],
    "recentActivities": [...]
  }
}
```
