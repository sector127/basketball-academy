'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, type Components } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, ka } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, Calendar as CalendarIcon, RefreshCw, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import EventForm from '@/components/EventForm';
import CalendarToolbar, { type CalendarToolbarProps } from './CalendarToolbar';
import CalendarEvent, { type CalendarEventItem, type CalendarEventProps } from './CalendarEvent';
import CalendarSidebar from './CalendarSidebar';
import PracticeAttendanceModal from './PracticeAttendanceModal';
import TeamPracticePlannerModal from './TeamPracticePlannerModal';
import { useToast } from '@/hooks/use-toast';

const locales: Record<string, unknown> = {
  'en-US': enUS,
  'ka': ka,
  'ka-GE': ka,
  en: enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date || new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export interface CalendarViewProps {
  role?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  badgeText?: string;
  canManageEvents?: boolean;
}

export default function CalendarView({
  role = 'admin',
  pageTitle,
  pageSubtitle,
  badgeText,
  canManageEvents = true,
}: CalendarViewProps) {
  const locale = useLocale();
  const t = useTranslations('Calendar');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState<CalendarEventItem | null>(null);
  const [isPlanningSeason, setIsPlanningSeason] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CalendarEventItem[] = await response.json();
      const formattedEvents = (Array.isArray(data) ? data : []).map((event) => ({
        ...event,
        start: new Date(event.startTime || 0),
        end: new Date(event.endTime || 0),
      }));
      setEvents(formattedEvents);
    } catch (err: unknown) {
      setError('Failed to load academy events. Please try again.');
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events based on active legend/filter selection
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return events;
    return events.filter((e) => e.eventType === selectedFilter);
  }, [events, selectedFilter]);

  const handleStartAddEvent = () => {
    setSelectedEvent(null);
    setIsAddingEvent(true);
  };

  const handleStartEditEvent = (event: CalendarEventItem) => {
    setSelectedEvent(event);
    setIsEditingEvent(true);
  };

  const handleEventCreatedOrUpdated = () => {
    fetchEvents();
    setIsAddingEvent(false);
    setIsEditingEvent(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async (eventToDelete: CalendarEventItem) => {
    const eventId = eventToDelete._id || eventToDelete.id;
    if (!eventId) return;

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: 'Event Deleted',
          description: `"${eventToDelete.title}" has been removed from the schedule.`,
          variant: 'newSuccess',
        });
        setSelectedEvent(null);
        fetchEvents();
      } else {
        const errorData: { error?: string } = await res.json();
        toast({
          title: 'Delete Failed',
          description: errorData.error || 'Could not delete event.',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to communicate with server.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSeries = async (groupId: string) => {
    if (!groupId) return;
    try {
      // Only remove upcoming sessions; past ones keep their attendance history
      const params = new URLSearchParams({ groupId, futureOnly: 'true', fromDate: new Date().toISOString() });
      const res = await fetch(`/api/admin/events/recurring?${params}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data: { message?: string } = await res.json();
        toast({
          title: 'Series Deleted',
          description: data.message || 'Upcoming practices in this season plan have been removed.',
          variant: 'newSuccess',
        });
        setSelectedEvent(null);
        fetchEvents();
      } else {
        const errorData: { error?: string } = await res.json();
        toast({
          title: 'Delete Failed',
          description: errorData.error || 'Could not delete recurring series.',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to communicate with server.',
        variant: 'destructive',
      });
    }
  };

  // Calendar custom components map
  const calendarComponents = useMemo<Components<CalendarEventItem, object>>(
    () => ({
      toolbar: (props) => <CalendarToolbar {...(props as unknown as CalendarToolbarProps)} />,
      event: (props) => <CalendarEvent event={props.event} title={props.title} />,
    }),
    []
  );

  return (
    <DashboardLayout>
      <PageHeader
        title={pageTitle || t('academyCalendar')}
        subtitle={pageSubtitle || t('calendarSubtitle')}
        badge={badgeText || `${events.length} ${t('allEvents')}`}
        icon={CalendarIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={isLoading}
              className="h-9 px-3 text-xs font-semibold rounded-xl"
              title="Refresh events"
            >
              <RefreshCw className={isLoading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            </Button>

            {canManageEvents && (
              <>
                {role === 'admin' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlanningSeason(true)}
                    className="h-9 px-3 text-xs font-semibold rounded-xl border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                    {t('planSeason') || 'Plan Team Practices'}
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleStartAddEvent}
                  className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm"
                >
                  <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" />
                  {role === 'coach' ? 'Schedule Skills Training' : t('scheduleSession')}
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-5 rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Add / Edit Event Dialog */}
      <Dialog
        open={isAddingEvent || isEditingEvent}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingEvent(false);
            setIsEditingEvent(false);
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[580px] rounded-2xl p-6 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {selectedEvent ? 'Edit Academy Event' : 'Schedule New Event'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {selectedEvent
                ? 'Update fixture parameters, court assignments, or session notes.'
                : 'Choose the event type and assign teams, court venue, and time slot.'}
            </DialogDescription>
          </DialogHeader>

          <EventForm
            event={selectedEvent}
            role={role}
            onEventCreated={handleEventCreatedOrUpdated}
            onClose={() => {
              setIsAddingEvent(false);
              setIsEditingEvent(false);
              setSelectedEvent(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Main Layout Grid: Calendar View (3 Cols) + Sidebar (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar View Container */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition-all">
          <div className="h-[680px]">
            <Calendar
              culture={locale === 'ka' ? 'ka' : 'en-US'}
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              components={calendarComponents}
              onSelectEvent={(e) => setSelectedEvent(e)}
              popup
              className={isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}
            />
          </div>
        </div>

        {/* Sidebar: Legend, Filters, Details & Quick Schedule */}
        <div className="lg:col-span-1">
          <CalendarSidebar
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
            onEditEvent={handleStartEditEvent}
            onDeleteEvent={handleDeleteEvent}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            canManage={canManageEvents}
            role={role}
            onOpenAttendance={setAttendanceEvent}
            onDeleteSeries={handleDeleteSeries}
            onOpenPlanner={() => setIsPlanningSeason(true)}
          />
        </div>
      </div>

      {/* Practice Attendance Modal */}
      <PracticeAttendanceModal
        eventId={attendanceEvent?._id || attendanceEvent?.id || null}
        eventTitle={attendanceEvent?.title}
        isOpen={Boolean(attendanceEvent)}
        onClose={() => setAttendanceEvent(null)}
      />

      {/* Team Season Practice Planner Modal */}
      <TeamPracticePlannerModal
        isOpen={isPlanningSeason}
        onClose={() => setIsPlanningSeason(false)}
        onScheduleCreated={fetchEvents}
      />
    </DashboardLayout>
  );
}
