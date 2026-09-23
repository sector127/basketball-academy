'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'active'
  | 'disabled'
  | 'firstTeam'
  | 'admin'
  | 'coach'
  | 'player'
  | 'guardian'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'gold' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const statusMap: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'info' | 'gold' | 'neutral' }
> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  active: { label: 'Active', variant: 'success' },
  disabled: { label: 'Inactive', variant: 'destructive' },
  firstTeam: { label: 'Starter', variant: 'gold' },
  admin: { label: 'Admin', variant: 'destructive' },
  coach: { label: 'Coach', variant: 'gold' },
  player: { label: 'Player', variant: 'info' },
  guardian: { label: 'Guardian', variant: 'neutral' },
};

const variantStyles = {
  success: {
    container: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
  warning: {
    container: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500',
  },
  destructive: {
    container: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    dot: 'bg-rose-500',
  },
  info: {
    container: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500',
  },
  gold: {
    container: 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/60',
    dot: 'bg-amber-500',
  },
  neutral: {
    container: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  default: {
    container: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

export function StatusBadge({
  status,
  label,
  variant,
  size = 'sm',
  dot = true,
  className,
}: StatusBadgeProps) {
  const meta = statusMap[status] || { label: status, variant: 'neutral' };
  const currentVariant = variant || meta.variant;
  const styles = variantStyles[currentVariant] || variantStyles.default;
  const displayLabel = label || meta.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        styles.container,
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full animate-pulse', styles.dot)} />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
