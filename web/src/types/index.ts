export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type ProjectStatus = 'Not Started' | 'In Progress' | 'Completed';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  progress: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: ProjectStats;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    status: ProjectStatus;
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DashboardData {
  summary: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    projectsInProgress: number;
    inProgressTasks: number;
    projectsCompleted: number;
    projectsNotStarted: number;
    taskCompletionRate: number;
    projectCompletionRate: number;
  };
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  statusBreakdown: {
    projects: {
      notStarted: number;
      inProgress: number;
      completed: number;
    };
    tasks: {
      pending: number;
      inProgress: number;
      completed: number;
    };
  };
  recentProjects: Project[];
  recentTasks: Task[];
  recentActivities: ActivityLog[];
}
