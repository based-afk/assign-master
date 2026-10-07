import React, { useState, useEffect } from 'react';
import type { Task, Project, TaskStatus, TaskPriority } from '../types';
import { api } from '../api/client';
import { TaskModal } from '../components/TaskModal';
import { DeleteModal } from '../components/DeleteModal';
import {
  Search,
  Plus,
  Calendar,
  Check,
  Edit2,
  Trash2,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TasksViewProps {
  initialProjectId?: string;
  onClearInitialProject?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  initialProjectId,
  onClearInitialProject,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  const loadProjects = async () => {
    try {
      const res = await api.getProjects();
      if (res?.data?.projects) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects for filter:', err);
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTasks({
        projectId: selectedProjectId !== 'ALL' ? selectedProjectId : undefined,
        search,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        sortOrder: sortBy === 'name' ? 'asc' : 'desc',
      });
      if (res?.data?.tasks) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedProjectId, search, statusFilter, priorityFilter, sortBy]);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setUpdatingTaskId(task.id);

    try {
      await api.updateTask(task.id, { status: nextStatus });
      if (nextStatus === 'Completed') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#34C759', '#0071E3', '#FF9500'],
        });
      }
      // Optimistic update in UI
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      console.error('Failed to toggle task status:', err);
      fetchTasks();
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await api.deleteTask(deletingTask.id);
      setDeletingTask(null);
      await fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return <span className="badge badge-priority-high">High</span>;
      case 'Medium':
        return <span className="badge badge-priority-medium">Medium</span>;
      case 'Low':
        return <span className="badge badge-priority-low">Low</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="badge badge-completed">
            <span className="badge-dot" />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="badge badge-in-progress">
            <span className="badge-dot" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="badge badge-not-started">
            <span className="badge-dot" />
            Pending
          </span>
        );
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            {activeProject ? `Tasks: ${activeProject.name}` : 'All Tasks'}
          </h1>
          <p>Prioritize, manage, and execute tasks across your active workspaces.</p>
        </div>
        <div className="header-actions">
          {selectedProjectId !== 'ALL' && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedProjectId('ALL');
                if (onClearInitialProject) onClearInitialProject();
              }}
            >
              Show All Projects
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Multi-Filters */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by title or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="select-input"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="select-input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="name">Task Name (A-Z)</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CheckSquare size={24} />
          </div>
          <h4>No tasks found</h4>
          <p>
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || selectedProjectId !== 'ALL'
              ? 'Try changing your search query or filters.'
              : 'Add tasks to organize your project deliverables.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div className="tasks-container">
          {tasks.map((t) => (
            <div key={t.id} className="task-item">
              <div className="task-checkbox-group">
                <button
                  type="button"
                  className={`task-check-btn ${t.status === 'Completed' ? 'checked' : ''}`}
                  onClick={() => handleToggleStatus(t)}
                  disabled={updatingTaskId === t.id}
                >
                  {t.status === 'Completed' && <Check size={12} strokeWidth={3} />}
                </button>

                <div className="task-info">
                  <span className={`task-name ${t.status === 'Completed' ? 'completed' : ''}`}>
                    {t.name}
                  </span>
                  <div className="task-meta">
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {t.project?.name || 'Project'}
                    </span>
                    {t.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={12} />
                        {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {t.description && (
                      <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        • {t.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="task-actions">
                {getStatusBadge(t.status)}
                {getPriorityBadge(t.priority)}

                <button
                  className="btn-icon"
                  title="Edit Task"
                  onClick={() => {
                    setEditingTask(t);
                    setIsModalOpen(true);
                  }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn-icon"
                  title="Delete Task"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => setDeletingTask(t)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        defaultProjectId={selectedProjectId !== 'ALL' ? selectedProjectId : undefined}
        projects={projects}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={fetchTasks}
      />

      <DeleteModal
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete task "${deletingTask?.name}"?`}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingTask(null)}
      />
    </div>
  );
};
