import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'var(--accent-primary)',
  iconBg = 'var(--accent-primary-light)',
}) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span>{title}</span>
        <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-footer">{subtitle}</div>}
    </div>
  );
};
