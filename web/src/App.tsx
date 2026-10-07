import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ProjectsView } from './views/ProjectsView';
import { TasksView } from './views/TasksView';
import { ProjectModal } from './components/ProjectModal';
import { TaskModal } from './components/TaskModal';
import type { Project } from './types';
import { api } from './api/client';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'projects' | 'tasks'>('dashboard');
  const [selectedProjectIdForTasks, setSelectedProjectIdForTasks] = useState<string | undefined>(undefined);

  // Global quick-add modal controls
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState<Project[]>([]);

  const fetchGlobalProjects = async () => {
    if (!user) return;
    try {
      const res = await api.getProjects();
      if (res?.data?.projects) {
        setProjectsList(res.data.projects);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGlobalProjects();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleSelectProjectForTasks = (projectId: string) => {
    setSelectedProjectIdForTasks(projectId);
    setCurrentTab('tasks');
  };

  return (
    <div className="app-layout">
      <OfflineBanner />
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'tasks') {
            setSelectedProjectIdForTasks(undefined);
          }
        }}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenTaskModal={() => {
          fetchGlobalProjects();
          setIsTaskModalOpen(true);
        }}
      />

      <main className="main-content">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigateToProjects={() => setCurrentTab('projects')}
            onNavigateToTasks={() => {
              setSelectedProjectIdForTasks(undefined);
              setCurrentTab('tasks');
            }}
            onOpenProjectModal={() => setIsProjectModalOpen(true)}
            onOpenTaskModal={() => {
              fetchGlobalProjects();
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsView
            onSelectProjectForTasks={handleSelectProjectForTasks}
            onOpenCreateProjectModal={() => setIsProjectModalOpen(true)}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksView
            initialProjectId={selectedProjectIdForTasks}
            onClearInitialProject={() => setSelectedProjectIdForTasks(undefined)}
          />
        )}
      </main>

      {/* Global Quick Action Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSaved={() => {
          fetchGlobalProjects();
        }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        projects={projectsList}
        defaultProjectId={selectedProjectIdForTasks}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={() => {}}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
