import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const isHigh = priority === 'High';
  const isMedium = priority === 'Medium';

  return (
    <View
      style={[
        styles.badge,
        isHigh
          ? styles.badgeHigh
          : isMedium
          ? styles.badgeMedium
          : styles.badgeLow,
      ]}
    >
      <Text
        style={[
          styles.text,
          isHigh
            ? styles.textHigh
            : isMedium
            ? styles.textMedium
            : styles.textLow,
        ]}
      >
        {priority}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeLow: {
    backgroundColor: '#F3F4F6',
  },
  textLow: {
    color: '#6B7280',
  },
  badgeMedium: {
    backgroundColor: '#FFF5E5',
  },
  textMedium: {
    color: '#D97706',
  },
  badgeHigh: {
    backgroundColor: '#FFEBEA',
  },
  textHigh: {
    color: '#FF3B30',
  },
});
