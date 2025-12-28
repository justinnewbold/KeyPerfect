import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  iconColor = 'text-white/60',
  className = '',
}: StatCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-1" aria-hidden="true">
        <span className={`w-4 h-4 ${iconColor}`}>{icon}</span>
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <div className="text-2xl font-bold" aria-label={`${label}: ${value}`}>
        {value}
      </div>
    </Card>
  );
}
