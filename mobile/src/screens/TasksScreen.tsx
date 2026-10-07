import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, Project, TaskStatus, TaskPriority } from '../types';
import { mobileApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { TaskModal } from '../components/TaskModal';
import { OfflineBanner } from '../components/OfflineBanner';

interface TasksScreenProps {
  initialProjectId?: string;
  onClearProjectFilter?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  initialProjectId,
  onClearProjectFilter,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || 'ALL'
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  const loadProjects = async () => {
    try {
      const res = await mobileApi.getProjects();
      if (res?.data?.projects) {
        setProjects(res.data.projects);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    try {
      setNetworkError(false);
      const res = await mobileApi.getTasks({
        projectId: selectedProjectId !== 'ALL' ? selectedProjectId : undefined,
        search,
        status: statusFilter,
        priority: priorityFilter,
      });
      if (res?.data?.tasks) {
        setTasks(res.data.tasks);
      }
    } catch (err: any) {
      if (err.status === 0) setNetworkError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedProjectId, search, statusFilter, priorityFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
    loadProjects();
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === 'Completed' ? 'Pending' : 'Completed';
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await mobileApi.updateTask(task.id, { status: nextStatus });
    } catch (err) {
      fetchTasks();
    }
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileApi.deleteTask(task.id);
            fetchTasks();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const statuses = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
  ];

  const priorities = [
    { label: 'All Priority', value: 'ALL' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  return (
    <View style={styles.container}>
      <OfflineBanner visible={networkError} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks by name..."
          placeholderTextColor="#8E8E93"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Row 1: Projects */}
      {projects.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedProjectId === 'ALL' && styles.filterChipActive,
            ]}
            onPress={() => {
              setSelectedProjectId('ALL');
              if (onClearProjectFilter) onClearProjectFilter();
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedProjectId === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All Projects
            </Text>
          </TouchableOpacity>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.filterChip,
                selectedProjectId === p.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedProjectId(p.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedProjectId === p.id && styles.filterChipTextActive,
                ]}
              >
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Filter Row 2: Status & Priority */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollSecondary}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
      >
        {statuses.map((st) => (
          <TouchableOpacity
            key={st.value}
            style={[
              styles.subFilterChip,
              statusFilter === st.value && styles.subFilterChipActive,
            ]}
            onPress={() => setStatusFilter(st.value)}
          >
            <Text
              style={[
                styles.subFilterChipText,
                statusFilter === st.value && styles.subFilterChipTextActive,
              ]}
            >
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}

        {priorities.map((pr) => (
          <TouchableOpacity
            key={pr.value}
            style={[
              styles.subFilterChip,
              priorityFilter === pr.value && styles.subFilterChipActive,
            ]}
            onPress={() => setPriorityFilter(pr.value)}
          >
            <Text
              style={[
                styles.subFilterChipText,
                priorityFilter === pr.value && styles.subFilterChipTextActive,
              ]}
            >
              {pr.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0071E3" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0071E3" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={40} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try clearing active filters'
                  : 'Tap + New to create your first task'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={styles.taskTopRow}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    item.status === 'Completed' && styles.checkboxChecked,
                  ]}
                  onPress={() => handleToggleStatus(item)}
                >
                  {item.status === 'Completed' && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <View style={styles.taskTitleGroup}>
                  <Text
                    style={[
                      styles.taskName,
                      item.status === 'Completed' && styles.taskNameCompleted,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.taskProjectName}>
                    {item.project?.name || 'Project'}
                  </Text>
                </View>

                <PriorityBadge priority={item.priority} />
              </View>

              {item.description ? (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.taskBottomRow}>
                <StatusBadge status={item.status} />

                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() => {
                      setEditingTask(item);
                      setIsModalOpen(true);
                    }}
                  >
                    <Ionicons name="pencil-outline" size={15} color="#0071E3" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={15} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <TaskModal
        visible={isModalOpen}
        task={editingTask}
        projects={projects}
        defaultProjectId={
          selectedProjectId !== 'ALL' ? selectedProjectId : undefined
        }
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={fetchTasks}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1D1D1F',
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0071E3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1D1D1F',
  },
  filterScroll: {
    maxHeight: 36,
    marginTop: 10,
  },
  filterScrollSecondary: {
    maxHeight: 32,
    marginTop: 6,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#1D1D1F',
    borderColor: '#1D1D1F',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6E6E73',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  subFilterChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  subFilterChipActive: {
    backgroundColor: '#0071E3',
  },
  subFilterChipText: {
    fontSize: 11,
    color: '#48484A',
    fontWeight: '500',
  },
  subFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  taskTitleGroup: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskProjectName: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  taskDescription: {
    fontSize: 13,
    color: '#6E6E73',
    lineHeight: 18,
    marginTop: 8,
    marginLeft: 34,
  },
  taskBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F5F5F7',
    marginLeft: 34,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
});
