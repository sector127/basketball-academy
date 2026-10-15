'use client';

import React from 'react';
import { Trophy, Activity, Target, Calendar, Repeat, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EventTheme {
  label: string;
  icon: LucideIcon;
  color: string;
  pillClass: string;
  dotClass: string;
  badgeClass: string;
}

export type EventTypeKey = 'game' | 'practice' | 'individualTraining' | 'other';

export const EVENT_TYPE_THEMES: Record<EventTypeKey, EventTheme> = {
  game: {
    label: 'Game',
    icon: Trophy,
    color: '#3b82f6',
    pillClass:
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/20',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  practice: {
    label: 'Practice',
    icon: Activity,
    color: '#8b5cf6',
    pillClass:
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/20',
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  individualTraining: {
    label: 'Individual',
    icon: Target,
    color: '#10b981',
    pillClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/20',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  other: {
    label: 'Other',
    icon: Calendar,
    color: '#6b7280',
    pillClass:
      'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 hover:border-slate-500/60 hover:bg-slate-500/20',
    dotClass: 'bg-slate-500',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
};

export interface CalendarEventItem {
  _id?: string;
  id?: string;
  eventType?: string;
  title?: string;
  start?: Date | string;
  end?: Date | string;
  startTime?: string | Date;
  endTime?: string | Date;
  location?: string;
  venue?: {
    _id?: string;
    name?: string;
    address?: string;
  };
  team?: {
    _id?: string;
    name?: string;
    ageGroup?: string;
  };
  isRecurring?: boolean;
  recurringGroupId?: string;
  isAwayGame?: boolean;
  opponent?: string;
  trainingType?: string;
  focusAreas?: string;
  description?: string;
}

export interface CalendarEventProps {
  event?: CalendarEventItem;
  title?: string;
}

export default function CalendarEvent({ event, title }: CalendarEventProps) {
  const eventKey = (event?.eventType as EventTypeKey) in EVENT_TYPE_THEMES
    ? (event?.eventType as EventTypeKey)
    : 'other';
  const theme = EVENT_TYPE_THEMES[eventKey] || EVENT_TYPE_THEMES.other;
  const Icon = theme.icon;

  const startTimeStr = event?.start
    ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold shadow-xs transition-all duration-150 overflow-hidden',
        theme.pillClass
      )}
      title={`${event?.title || title} (${startTimeStr})`}
    >
      <Icon className="h-3 w-3 shrink-0 opacity-80 group-hover:opacity-100" />
      {startTimeStr && (
        <span className="font-mono text-[10px] font-bold opacity-75 shrink-0">
          {startTimeStr}
        </span>
      )}
      {event?.isRecurring && (
        <span title="Recurring practice schedule" className="inline-flex items-center">
          <Repeat className="h-2.5 w-2.5 shrink-0 text-amber-500 opacity-90" />
        </span>
      )}
      <span className="truncate leading-tight font-medium">
        {event?.title || title}
      </span>
    </div>
  );
}
