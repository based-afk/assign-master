import React, { useState, useEffect } from 'react';
import type { DashboardData, Task } from '../types';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  ArrowUpRight,
  Activity,
  Check,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  onNavigateToProjects: () => void;
  onNavigateToTasks: () => void;
  onOpenProjectModal: () => void;
  onOpenTaskModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToProjects,
  onNavigateToTasks,
  onOpenProjectModal,
  onOpenTaskModal,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setUpdatingTaskId(task.id);

    try {
      await api.updateTask(task.id, { status: newStatus });
      if (newStatus === 'Completed') {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#34C759', '#0071E3', '#5856D6'],
        });
      }
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem 0' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  const summary = data?.summary || {
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    projectsInProgress: 0,
    inProgressTasks: 0,
    taskCompletionRate: 0,
    projectCompletionRate: 0,
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Overview</h1>
          <p>Real-time progress, project milestones, and upcoming tasks.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onOpenProjectModal}>
            <Plus size={16} />
            <span>New Project</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenTaskModal}>
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 5 Functional Metric Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Projects"
          value={summary.totalProjects}
          subtitle={`${summary.projectsInProgress} actively in progress`}
          icon={FolderKanban}
          iconBg="var(--accent-primary-light)"
          iconColor="var(--accent-primary)"
        />
        <StatCard
          title="Projects In Progress"
          value={summary.projectsInProgress}
          subtitle={`${summary.projectCompletionRate}% completion rate`}
          icon={Layers}
          iconBg="#F3F0FF"
          iconColor="#7C3AED"
        />
        <StatCard
          title="Total Tasks"
          value={summary.totalTasks}
          subtitle={`${summary.inProgressTasks || 0} in development`}
          icon={CheckCircle2}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <StatCard
          title="Completed Tasks"
          value={summary.completedTasks}
          subtitle={`${summary.taskCompletionRate}% of total achieved`}
          icon={CheckCircle2}
          iconBg="var(--success-bg)"
          iconColor="var(--success)"
        />
        <StatCard
          title="Pending Tasks"
          value={summary.pendingTasks}
          subtitle="Awaiting action"
          icon={Clock}
          iconBg="var(--warning-bg)"
          iconColor="var(--warning)"
        />
      </div>

      {/* Progress & Priority Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Task Completion Progress
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {summary.taskCompletionRate}%
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {summary.completedTasks} of {summary.totalTasks} completed
            </span>
          </div>
          <div className="progress-bar-container" style={{ height: '8px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${summary.taskCompletionRate}%`,
                backgroundColor: 'var(--success)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Pending</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>{summary.pendingTasks}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>In Progress</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px', color: 'var(--accent-primary)' }}>{summary.inProgressTasks || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Completed</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px', color: 'var(--success)' }}>{summary.completedTasks}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Tasks by Priority
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, color: 'var(--danger)' }}>High Priority</span>
                <span style={{ fontWeight: 600 }}>{data?.priorityBreakdown?.high || 0}</span>
              </div>
              <div className="progress-bar-container" style={{ height: '6px', margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${summary.totalTasks ? ((data?.priorityBreakdown?.high || 0) / summary.totalTasks) * 100 : 0}%`,
                    backgroundColor: 'var(--danger)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, color: '#D97706' }}>Medium Priority</span>
                <span style={{ fontWeight: 600 }}>{data?.priorityBreakdown?.medium || 0}</span>
              </div>
              <div className="progress-bar-container" style={{ height: '6px', margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${summary.totalTasks ? ((data?.priorityBreakdown?.medium || 0) / summary.totalTasks) * 100 : 0}%`,
                    backgroundColor: 'var(--warning)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, color: '#4B5563' }}>Low Priority</span>
                <span style={{ fontWeight: 600 }}>{data?.priorityBreakdown?.low || 0}</span>
              </div>
              <div className="progress-bar-container" style={{ height: '6px', margin: 0 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${summary.totalTasks ? ((data?.priorityBreakdown?.low || 0) / summary.totalTasks) * 100 : 0}%`,
                    backgroundColor: '#9CA3AF',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Projects & Recent Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Projects */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Recent Projects</h3>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.8125rem', padding: '4px 8px' }}
              onClick={onNavigateToProjects}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {data?.recentProjects && data.recentProjects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recentProjects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '0.875rem 1rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    cursor: 'pointer',
                  }}
                  onClick={onNavigateToProjects}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{p.name}</span>
                    <span
                      className={`badge ${
                        p.status === 'Completed'
                          ? 'badge-completed'
                          : p.status === 'In Progress'
                          ? 'badge-in-progress'
                          : 'badge-not-started'
                      }`}
                    >
                      <span className="badge-dot" />
                      {p.status}
                    </span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '5px', margin: '4px 0' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${p.stats?.progress || (p as any).progress || 0}%`,
                        backgroundColor: p.status === 'Completed' ? 'var(--success)' : 'var(--accent-primary)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <span>
                      {(p as any).completedTasks || 0} / {(p as any).totalTasks || 0} tasks
                    </span>
                    <span>{p.stats?.progress || (p as any).progress || 0}% done</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.875rem' }}>No projects created yet.</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}
                onClick={onOpenProjectModal}
              >
                Create your first project
              </button>
            </div>
          )}
        </div>

        {/* Recent Tasks with 1-click Toggle */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Active Tasks</h3>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.8125rem', padding: '4px 8px' }}
              onClick={onNavigateToTasks}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {data?.recentTasks && data.recentTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recentTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <button
                      type="button"
                      className={`task-check-btn ${t.status === 'Completed' ? 'checked' : ''}`}
                      onClick={(e) => handleToggleTask(t, e)}
                      disabled={updatingTaskId === t.id}
                    >
                      {t.status === 'Completed' && <Check size={12} strokeWidth={3} />}
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        className={`task-name ${t.status === 'Completed' ? 'completed' : ''}`}
                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {t.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {t.project?.name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      t.priority === 'High'
                        ? 'badge-priority-high'
                        : t.priority === 'Medium'
                        ? 'badge-priority-medium'
                        : 'badge-priority-low'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.875rem' }}>No tasks found.</p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}
                onClick={onOpenTaskModal}
              >
                Add a task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log / Activity Timeline (Bonus Feature) */}
      {data?.recentActivities && data.recentActivities.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Activity History (Audit Log)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {data.recentActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                    }}
                  />
                  <span>{act.details}</span>
                </div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
