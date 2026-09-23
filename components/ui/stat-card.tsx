'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  accent?: 'gold' | 'blue' | 'emerald' | 'purple' | 'rose';
  className?: string;
  onClick?: () => void;
}

const accentStyles = {
  gold: {
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/40',
    glow: 'from-amber-500/5',
  },
  blue: {
    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-500/40',
    glow: 'from-blue-500/5',
  },
  emerald: {
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/40',
    glow: 'from-emerald-500/5',
  },
  purple: {
    bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-500/40',
    glow: 'from-purple-500/5',
  },
  rose: {
    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    border: 'hover:border-rose-500/40',
    glow: 'from-rose-500/5',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendType = 'neutral',
  accent = 'gold',
  className,
  onClick,
}: StatCardProps) {
  const currentAccent = accentStyles[accent] || accentStyles.gold;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90',
        currentAccent.border,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Background soft glow gradient */}
      <div
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-xl',
          currentAccent.glow
        )}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', currentAccent.bg)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trendType === 'positive' && 'text-emerald-600 dark:text-emerald-400',
              trendType === 'negative' && 'text-rose-600 dark:text-rose-400',
              trendType === 'neutral' && 'text-slate-500 dark:text-slate-400'
            )}
          >
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          {description}
        </p>
      )}
    </div>
  );
}
