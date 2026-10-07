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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Project, ProjectStatus } from '../types';
import { mobileApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ProjectModal } from '../components/ProjectModal';
import { OfflineBanner } from '../components/OfflineBanner';

interface ProjectsScreenProps {
  onSelectProject: (projectId: string) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      setNetworkError(false);
      const res = await mobileApi.getProjects({
        search,
        status: statusFilter,
      });
      if (res?.data?.projects) {
        setProjects(res.data.projects);
      }
    } catch (err: any) {
      if (err.status === 0) setNetworkError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleDelete = (project: Project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? All associated tasks will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileApi.deleteProject(project.id);
              fetchProjects();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const statuses: { label: string; value: string }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Not Started', value: 'Not Started' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
  ];

  return (
    <View style={styles.container}>
      <OfflineBanner visible={networkError} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {statuses.map((st) => (
          <TouchableOpacity
            key={st.value}
            style={[styles.filterChip, statusFilter === st.value && styles.filterChipActive]}
            onPress={() => setStatusFilter(st.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === st.value && styles.filterChipTextActive,
              ]}
            >
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0071E3" />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0071E3" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={40} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No projects found</Text>
              <Text style={styles.emptySubtitle}>
                {search || statusFilter !== 'ALL'
                  ? 'Try changing your search or filters'
                  : 'Tap the + New button to create a project'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const totalTasks = item.stats?.totalTasks || 0;
            const completedTasks = item.stats?.completedTasks || 0;
            const progress = item.stats?.progress || 0;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => onSelectProject(item.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>

                {item.description ? (
                  <Text style={styles.projectDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.progressContainer}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progress}%`,
                          backgroundColor:
                            item.status === 'Completed' ? '#34C759' : '#0071E3',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressFooter}>
                    <Text style={styles.taskCountText}>
                      {completedTasks}/{totalTasks} tasks
                    </Text>
                    <Text style={styles.progressPercentText}>{progress}%</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.footerAction}
                    onPress={() => {
                      setEditingProject(item);
                      setIsModalOpen(true);
                    }}
                  >
                    <Ionicons name="pencil-outline" size={14} color="#0071E3" />
                    <Text style={styles.footerActionText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.footerAction}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                    <Text style={[styles.footerActionText, { color: '#FF3B30' }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <ProjectModal
        visible={isModalOpen}
        project={editingProject}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSaved={fetchProjects}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
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
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    flex: 1,
    marginRight: 8,
  },
  projectDesc: {
    fontSize: 13,
    color: '#6E6E73',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F5F5F7',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskCountText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F5F5F7',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0071E3',
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
