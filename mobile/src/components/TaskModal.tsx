import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, Project, TaskPriority, TaskStatus } from '../types';
import { mobileApi } from '../services/api';

interface TaskModalProps {
  visible: boolean;
  task?: Task | null;
  projects: Project[];
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  task,
  projects,
  defaultProjectId,
  onClose,
  onSaved,
}) => {
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setProjectId(task.projectId);
      setName(task.name);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
    } else {
      setProjectId(defaultProjectId || (projects[0]?.id || ''));
      setName('');
      setDescription('');
      setPriority('Medium');
      setStatus('Pending');
    }
    setError(null);
  }, [task, defaultProjectId, projects, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Task name is required');
      return;
    }
    if (!projectId) {
      setError('Please select a project');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        projectId,
        name: name.trim(),
        description: description.trim() || null,
        priority,
        status,
      };

      if (task) {
        await mobileApi.updateTask(task.id, payload);
      } else {
        await mobileApi.createTask(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{task ? 'Edit Task' : 'New Task'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#1D1D1F" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.label}>Project *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.projectChip,
                    projectId === p.id && styles.projectChipActive,
                  ]}
                  onPress={() => setProjectId(p.id)}
                >
                  <Text
                    style={[
                      styles.projectChipText,
                      projectId === p.id && styles.projectChipTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Task Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Implement push notification"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Requirements and notes..."
              placeholderTextColor="#8E8E93"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.buttonRow}>
              {(['Low', 'Medium', 'High'] as TaskPriority[]).map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[styles.toggleBtn, priority === pr && styles.toggleBtnActive]}
                  onPress={() => setPriority(pr)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      priority === pr && styles.toggleTextActive,
                    ]}
                  >
                    {pr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Status</Text>
            <View style={styles.buttonRow}>
              {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.toggleBtn, status === st && styles.toggleBtnActive]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      status === st && styles.toggleTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={isSubmitting || projects.length === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveText}>{task ? 'Save' : 'Create'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginTop: 16,
  },
  errorBox: {
    backgroundColor: '#FFEBEA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
    marginBottom: 6,
    marginTop: 10,
  },
  projectScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  projectChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    marginRight: 8,
  },
  projectChipActive: {
    backgroundColor: '#1D1D1F',
  },
  projectChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6E6E73',
  },
  projectChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1D1D1F',
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#0071E3',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6E6E73',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F5F5F7',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6E6E73',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#0071E3',
    minWidth: 80,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
