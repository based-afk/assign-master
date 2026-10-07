import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, FolderKanban, CheckSquare, LogOut, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'projects' | 'tasks';
  onSelectTab: (tab: 'dashboard' | 'projects' | 'tasks') => void;
  onOpenProjectModal: () => void;
  onOpenTaskModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">
          <CheckCircle2 size={20} strokeWidth={2.5} />
        </div>
        <span>FocusProject</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
        >
          <LayoutGrid size={16} />
          <span>Dashboard</span>
        </button>
        <button
          className={`nav-tab-btn ${currentTab === 'projects' ? 'active' : ''}`}
          onClick={() => onSelectTab('projects')}
        >
          <FolderKanban size={16} />
          <span>Projects</span>
        </button>
        <button
          className={`nav-tab-btn ${currentTab === 'tasks' ? 'active' : ''}`}
          onClick={() => onSelectTab('tasks')}
        >
          <CheckSquare size={16} />
          <span>Tasks</span>
        </button>
      </nav>

      <div className="nav-user">
        <div className="user-pill">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <span>{user?.name || 'User'}</span>
        </div>
        <button
          className="btn-icon"
          title="Sign out"
          onClick={() => logout()}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
