'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  MapPin,
  Users,
  Edit3,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { EVENT_TYPE_THEMES, type CalendarEventItem, type EventTypeKey } from './CalendarEvent';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslations } from 'next-intl';

export interface CalendarSidebarProps {
  events?: CalendarEventItem[];
  selectedEvent?: CalendarEventItem | null;
  onSelectEvent?: (event: CalendarEventItem | null) => void;
  onEditEvent?: (event: CalendarEventItem) => void;
  onDeleteEvent?: (event: CalendarEventItem) => Promise<void> | void;
  selectedFilter?: string;
  onSelectFilter?: (filter: string) => void;
  canManage?: boolean;
  onOpenAttendance?: (event: CalendarEventItem) => void;
  onDeleteSeries?: (groupId: string) => Promise<void> | void;
  onOpenPlanner?: () => void;
  role?: string;
}

export default function CalendarSidebar({
  events = [],
  selectedEvent,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  selectedFilter = 'all',
  onSelectFilter,
  canManage = true,
  onOpenAttendance,
  onDeleteSeries,
  onOpenPlanner,
  role = 'admin',
}: CalendarSidebarProps) {
  const t = useTranslations('Calendar');
  const [deletePending, setDeletePending] = useState(false);

  // Calculate counts per event type
  const counts: Record<string, number> = {
    all: events.length,
    game: events.filter((e) => e.eventType === 'game').length,
    practice: events.filter((e) => e.eventType === 'practice').length,
    individualTraining: events.filter((e) => e.eventType === 'individualTraining').length,
  };

  // Find upcoming events sorted by start time
  const now = new Date();
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.endTime || e.startTime || e.start || 0) >= now)
    .sort(
      (a, b) =>
        new Date(a.startTime || a.start || 0).getTime() -
        new Date(b.startTime || b.start || 0).getTime()
    )
    .slice(0, 4);

  const handleDelete = async () => {
    if (!selectedEvent || !onDeleteEvent) return;
    setDeletePending(true);
    try {
      await onDeleteEvent(selectedEvent);
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Event Type Filters & Legend Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('eventFilters')}
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-400">
            {events.length} total
          </span>
        </div>

        <div className="space-y-1.5">
          {/* All events button */}
          <button
            type="button"
            onClick={() => onSelectFilter?.('all')}
            className={cn(
              'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all duration-150',
              selectedFilter === 'all'
                ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/20'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span>{t('allEvents')}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-mono px-1.5 py-0',
                selectedFilter === 'all'
                  ? 'border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'text-slate-400'
              )}
            >
              {counts.all}
            </Badge>
          </button>

          {/* Specific event types */}
          {(Object.entries(EVENT_TYPE_THEMES) as [EventTypeKey, typeof EVENT_TYPE_THEMES[EventTypeKey]][]).map(([typeKey, theme]) => {
            const count = counts[typeKey] ?? 0;
            const isSelected = selectedFilter === typeKey;
            const Icon = theme.icon;

            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => onSelectFilter?.(typeKey)}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all duration-150',
                  isSelected
                    ? `${theme.badgeClass} border`
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn('h-2.5 w-2.5 rounded-full', theme.dotClass)} />
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  <span>{theme.label}</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0',
                    isSelected ? 'border-current' : 'text-slate-400'
                  )}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Event Detail Card */}
      {selectedEvent ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900/90 space-y-4 animate-in fade-in-50 duration-200">
          {/* Card Top: Type & Dismiss */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const eventKey = ((selectedEvent.eventType || '') in EVENT_TYPE_THEMES)
                  ? (selectedEvent.eventType as EventTypeKey)
                  : 'other';
                const theme = EVENT_TYPE_THEMES[eventKey] || EVENT_TYPE_THEMES.other;
                const Icon = theme.icon;
                return (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border',
                      theme.badgeClass
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {theme.label}
                  </span>
                );
              })()}
              {selectedEvent.isRecurring && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                  Season Series
                </Badge>
              )}
              {selectedEvent.isAwayGame && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                  Away Match
                </Badge>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSelectEvent?.(null)}
              className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg -mr-1 -mt-1"
              title="Deselect event"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Event Title */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {selectedEvent.title}
            </h3>
            {selectedEvent.opponent && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Opponent: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedEvent.opponent}</span>
              </p>
            )}
          </div>

          {/* Detailed Info List */}
          <div className="space-y-3 text-xs">
            {/* Date & Time */}
            {selectedEvent.startTime && selectedEvent.endTime && (
              <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(selectedEvent.startTime).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {new Date(selectedEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} -{' '}
                    {new Date(selectedEvent.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            )}

            {/* Venue / Location */}
            <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedEvent.venue?.name || selectedEvent.location || 'BBA Arena'}
                </span>
                {selectedEvent.venue?.address && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {selectedEvent.venue.address}
                  </span>
                )}
              </div>
            </div>

            {/* Team */}
            {selectedEvent.team && (
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedEvent.team.name || 'Academy Team'}
                  </span>
                  {selectedEvent.team.ageGroup && (
                    <span className="text-[10px] text-slate-400">
                      Age Division: {selectedEvent.team.ageGroup}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Training Type / Focus Areas */}
            {selectedEvent.trainingType && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Session Type
                </span>
                <p className="text-xs capitalize font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                  {selectedEvent.trainingType} Training
                </p>
              </div>
            )}

            {/* Focus Areas or Description */}
            {(selectedEvent.focusAreas || selectedEvent.description) && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Notes / Focus
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {selectedEvent.focusAreas || selectedEvent.description}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {canManage && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {canManage && (selectedEvent.eventType === 'practice' || selectedEvent.eventType === 'individualTraining' || selectedEvent.team) && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onOpenAttendance?.(selectedEvent)}
                  className="w-full h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-sm"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" /> {t('attendance')}
                </Button>
              )}

              {/* Only admins, or coaches for individualTraining, can edit/delete */}
              {canManage && (role === 'admin' || selectedEvent.eventType === 'individualTraining') ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onEditEvent?.(selectedEvent)}
                    className="flex-1 h-9 text-xs font-semibold rounded-xl"
                  >
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" /> {t('editEvent')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label="Delete event"
                        className="h-9 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl"
                        disabled={deletePending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteConfirmDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                        >
                          {t('deleteEvent')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  Administrative event managed by Academy Admin
                </div>
              )}

              {canManage && role === 'admin' && selectedEvent.recurringGroupId && onDeleteSeries && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="w-full h-8 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl"
                      disabled={deletePending}
                    >
                      Delete Remaining Season Sessions
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Remaining Practices?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all upcoming practices in this season plan. Past sessions and their attendance records are kept. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteSeries(selectedEvent.recurringGroupId!)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                      >
                        Delete Series
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Quick Season Planner Callout (Admin only) */}
          {canManage && role === 'admin' && onOpenPlanner && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2 dark:border-amber-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Automate Team Practices
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Pick squad, set weekly cadence and court times, and auto-book the entire season in one click.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={onOpenPlanner}
                className="w-full h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-xs"
              >
                Plan Season Practices
              </Button>
            </div>
          )}
          {/* 3. Empty State: Upcoming Academy Schedule */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('upcomingEvents')}
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 opacity-80" />
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((event) => {
                  const eventKey = ((event.eventType || '') in EVENT_TYPE_THEMES)
                    ? (event.eventType as EventTypeKey)
                    : 'other';
                  const theme = EVENT_TYPE_THEMES[eventKey] || EVENT_TYPE_THEMES.other;
                  const startTime = event.startTime || event.start;
                  return (
                    <button
                      key={event._id || event.id}
                      type="button"
                      onClick={() => onSelectEvent?.(event)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn('h-2 w-2 rounded-full', theme.dotClass)} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {theme.label}
                        </span>
                        {startTime && (
                          <span className="text-[10px] font-mono text-slate-400 ml-auto">
                            {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {event.title}
                      </p>
                      {startTime && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {new Date(startTime).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          &bull; {event.venue?.name || event.location || 'BBA Court'}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">{t('noUpcoming')}</p>
                <p className="text-[11px] mt-0.5">{t('noEventSelected')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
