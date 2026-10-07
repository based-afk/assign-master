import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { ProjectModal } from './src/components/ProjectModal';
import { TaskModal } from './src/components/TaskModal';
import { Project } from './src/types';
import { mobileApi } from './src/services/api';

type Tab = 'dashboard' | 'projects' | 'tasks';

const MainApp: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  // Global modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState<Project[]>([]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const res = await mobileApi.getProjects();
      if (res?.data?.projects) {
        setProjectsList(res.data.projects);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0071E3" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Minimal Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={20} color="#6E6E73" />
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' && (
          <DashboardScreen
            onNavigateToProjects={() => setCurrentTab('projects')}
            onNavigateToTasks={() => {
              setSelectedProjectId(undefined);
              setCurrentTab('tasks');
            }}
            onOpenNewProject={() => setIsProjectModalOpen(true)}
            onOpenNewTask={() => {
              fetchProjects();
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsScreen
            onSelectProject={(projId) => {
              setSelectedProjectId(projId);
              setCurrentTab('tasks');
            }}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksScreen
            initialProjectId={selectedProjectId}
            onClearProjectFilter={() => setSelectedProjectId(undefined)}
          />
        )}
      </View>

      {/* Apple / Google Minimal Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setCurrentTab('dashboard');
            setSelectedProjectId(undefined);
          }}
        >
          <Ionicons
            name={currentTab === 'dashboard' ? 'grid' : 'grid-outline'}
            size={22}
            color={currentTab === 'dashboard' ? '#0071E3' : '#8E8E93'}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'dashboard' && styles.tabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setCurrentTab('projects');
            setSelectedProjectId(undefined);
          }}
        >
          <Ionicons
            name={currentTab === 'projects' ? 'folder' : 'folder-outline'}
            size={22}
            color={currentTab === 'projects' ? '#0071E3' : '#8E8E93'}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'projects' && styles.tabLabelActive,
            ]}
          >
            Projects
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('tasks')}
        >
          <Ionicons
            name={currentTab === 'tasks' ? 'checkbox' : 'checkbox-outline'}
            size={22}
            color={currentTab === 'tasks' ? '#0071E3' : '#8E8E93'}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'tasks' && styles.tabLabelActive,
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global Modals */}
      <ProjectModal
        visible={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSaved={fetchProjects}
      />

      <TaskModal
        visible={isTaskModalOpen}
        projects={projectsList}
        defaultProjectId={selectedProjectId}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={() => {}}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0071E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  userEmail: {
    fontSize: 11,
    color: '#8E8E93',
  },
  logoutBtn: {
    padding: 6,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabLabelActive: {
    color: '#0071E3',
    fontWeight: '600',
  },
});
