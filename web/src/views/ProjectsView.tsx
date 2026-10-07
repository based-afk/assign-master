import React, { useState, useEffect } from 'react';
import type { Project, ProjectStatus } from '../types';
import { api } from '../api/client';
import { ProjectModal } from '../components/ProjectModal';
import { DeleteModal } from '../components/DeleteModal';
import {
  Search,
  Plus,
  Calendar,
  FolderKanban,
  Edit2,
  Trash2,
  ListTodo,
  Loader2,
} from 'lucide-react';

interface ProjectsViewProps {
  onSelectProjectForTasks: (projectId: string) => void;
  onOpenCreateProjectModal: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onSelectProjectForTasks,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProjects({
        search,
        status: statusFilter,
        sortBy,
        sortOrder: sortBy === 'name' ? 'asc' : 'desc',
      });
      if (res?.data?.projects) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, sortBy]);

  const handleDelete = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    try {
      await api.deleteProject(deletingProject.id);
      setDeletingProject(null);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
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
            Not Started
          </span>
        );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Projects</h1>
          <p>Organize, plan, and track project milestones across your team.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Toolbar: Search, Status Filter, Sort */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search projects by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Date Created</option>
            <option value="name">Project Name (A-Z)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Projects Grid / Empty State */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderKanban size={24} />
          </div>
          <h4>No projects found</h4>
          <p>
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or status filter.'
              : 'Create your first project to start organizing tasks.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => {
            const totalTasks = p.stats?.totalTasks || 0;
            const completedTasks = p.stats?.completedTasks || 0;
            const progress = p.stats?.progress || 0;

            return (
              <div
                key={p.id}
                className="project-card"
                onClick={() => onSelectProjectForTasks(p.id)}
              >
                <div>
                  <div className="project-card-header">
                    <h3 className="project-card-title">{p.name}</h3>
                    {getStatusBadge(p.status)}
                  </div>

                  {p.description && (
                    <p className="project-card-desc">{p.description}</p>
                  )}

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: p.status === 'Completed' ? 'var(--success)' : 'var(--accent-primary)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>
                      {completedTasks} / {totalTasks} tasks completed
                    </span>
                    <span style={{ fontWeight: 600 }}>{progress}%</span>
                  </div>
                </div>

                <div>
                  <div className="project-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>
                        {p.endDate
                          ? `Due ${new Date(p.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : 'No due date'}
                      </span>
                    </div>

                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn-icon"
                        title="View Tasks"
                        onClick={() => onSelectProjectForTasks(p.id)}
                      >
                        <ListTodo size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Edit Project"
                        onClick={() => {
                          setEditingProject(p);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete Project"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeletingProject(p)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ProjectModal
        isOpen={isModalOpen}
        project={editingProject}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSaved={fetchProjects}
      />

      <DeleteModal
        isOpen={!!deletingProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? All associated tasks will be permanently removed.`}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingProject(null)}
      />
    </div>
  );
};
