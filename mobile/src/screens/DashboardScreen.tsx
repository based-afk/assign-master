import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardData, Task } from '../types';
import { mobileApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAuth } from '../context/AuthContext';

interface DashboardScreenProps {
  onNavigateToProjects: () => void;
  onNavigateToTasks: () => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToProjects,
  onNavigateToTasks,
  onOpenNewTask,
  onOpenNewProject,
}) => {
  const { logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const fetchDashboard = async () => {
    try {
      setNetworkError(false);
      const res = await mobileApi.getDashboard();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      if (err.status === 0) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await mobileApi.updateTask(task.id, { status: nextStatus });
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0071E3" />
      </View>
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
  };

  return (
    <View style={styles.container}>
      <OfflineBanner visible={networkError} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0071E3" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onOpenNewProject}>
              <Ionicons name="folder-open-outline" size={16} color="#0071E3" />
              <Text style={styles.actionBtnText}>+ Project</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onOpenNewTask}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>+ Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]} onPress={logout}>
              <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5 Core Metric Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="folder" size={18} color="#0071E3" />
            </View>
            <Text style={styles.statValue}>{summary.totalProjects}</Text>
            <Text style={styles.statLabel}>Total Projects</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F3F0FF' }]}>
              <Ionicons name="layers" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>{summary.projectsInProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="checkbox" size={18} color="#16A34A" />
            </View>
            <Text style={styles.statValue}>{summary.totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E8F9ED' }]}>
              <Ionicons name="checkmark-done" size={18} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{summary.completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, { width: '100%' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFF5E5' }]}>
              <Ionicons name="time" size={18} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{summary.pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
        </View>

        {/* Task Completion Progress Bar */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Overall Task Progress</Text>
            <Text style={styles.progressPercentage}>{summary.taskCompletionRate}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${summary.taskCompletionRate}%` },
              ]}
            />
          </View>
          <Text style={styles.progressFooter}>
            {summary.completedTasks} of {summary.totalTasks} tasks completed
          </Text>
        </View>

        {/* Recent Tasks List with 1-tap completion */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Active Tasks</Text>
            <TouchableOpacity onPress={onNavigateToTasks}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {data?.recentTasks && data.recentTasks.length > 0 ? (
            data.recentTasks.map((t) => (
              <View key={t.id} style={styles.taskItem}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    t.status === 'Completed' && styles.checkboxChecked,
                  ]}
                  onPress={() => handleToggleTask(t)}
                >
                  {t.status === 'Completed' && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskName,
                      t.status === 'Completed' && styles.taskNameCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {t.name}
                  </Text>
                  <Text style={styles.taskProject} numberOfLines={1}>
                    {t.project?.name || 'Project'}
                  </Text>
                </View>

                <PriorityBadge priority={t.priority} />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tasks yet. Create one to get started.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1D1D1F',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  actionBtnPrimary: {
    backgroundColor: '#0071E3',
    borderColor: '#0071E3',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0071E3',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressFooter: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0071E3',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F5F5F7',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskProject: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 13,
    paddingVertical: 16,
  },
});
