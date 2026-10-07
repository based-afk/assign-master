import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isCompleted = status === 'Completed';
  const isInProgress = status === 'In Progress';

  return (
    <View
      style={[
        styles.badge,
        isCompleted
          ? styles.badgeCompleted
          : isInProgress
          ? styles.badgeInProgress
          : styles.badgePending,
      ]}
    >
      <View
        style={[
          styles.dot,
          isCompleted
            ? styles.dotCompleted
            : isInProgress
            ? styles.dotInProgress
            : styles.dotPending,
        ]}
      />
      <Text
        style={[
          styles.text,
          isCompleted
            ? styles.textCompleted
            : isInProgress
            ? styles.textInProgress
            : styles.textPending,
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgePending: {
    backgroundColor: '#F3F4F6',
  },
  dotPending: {
    backgroundColor: '#9CA3AF',
  },
  textPending: {
    color: '#4B5563',
  },
  badgeInProgress: {
    backgroundColor: '#EBF5FF',
  },
  dotInProgress: {
    backgroundColor: '#0071E3',
  },
  textInProgress: {
    color: '#0071E3',
  },
  badgeCompleted: {
    backgroundColor: '#E8F9ED',
  },
  dotCompleted: {
    backgroundColor: '#34C759',
  },
  textCompleted: {
    color: '#34C759',
  },
});
