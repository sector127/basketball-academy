'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Clock,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const viewIcons = {
  month: CalendarDays,
  week: CalendarRange,
  day: Clock,
  agenda: CalendarCheck,
};

export default function CalendarToolbar({
  date,
  view,
  views = ['month', 'week', 'day', 'agenda'],
  label,
  onNavigate,
  onView,
}) {
  const t = useTranslations('Calendar');
  const viewsList = Array.isArray(views) ? views : Object.keys(views);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
      {/* Left: Navigation Controls & Current Date Label */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50/60 p-0.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('TODAY')}
            className="h-8 px-3 text-xs font-bold text-slate-700 hover:text-amber-600 dark:text-slate-200 dark:hover:text-amber-400"
          >
            {t('today')}
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('PREV')}
            className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label={t('prevPeriod')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('NEXT')}
            className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label={t('nextPeriod')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {label}
          </h2>
        </div>
      </div>

      {/* Right: Modern Segmented View Switcher */}
      <div className="flex items-center self-start sm:self-auto rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {viewsList.map((viewName) => {
          const Icon = viewIcons[viewName] || CalendarIcon;
          const isActive = view === viewName;
          return (
            <button
              key={viewName}
              type="button"
              onClick={() => onView(viewName)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200',
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-amber-500' : 'opacity-70')} />
              <span>{t(viewName) || viewName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
