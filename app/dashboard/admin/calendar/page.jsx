'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventForm from '@/components/EventForm';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MapPin, Clock, Users, Plus, Calendar as CalendarIcon, Edit3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const localizer = momentLocalizer(moment);

const EventTypeColors = {
  game: '#3b82f6',
  individualTraining: '#10b981',
  practice: '#8b5cf6',
  other: '#6b7280',
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formattedEvents = data.map((event) => ({
        ...event,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
      }));
      setEvents(formattedEvents);
    } catch (err) {
      setError('Failed to load events. Please try again later.');
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventCreated = () => {
    fetchEvents();
    setIsAddingEvent(false);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditingEvent(true);
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: EventTypeColors[event.eventType] || '#6b7280',
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      padding: '3px 8px',
      fontSize: '0.8rem',
      fontWeight: '600',
    };
    return { style };
  };

  const EventDetails = ({ event }) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {event.eventType}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {event.title}
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEditEvent(event)}
          className="h-8 text-xs shrink-0"
        >
          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          <span>
            {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
            {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="truncate">{event.venue?.name || event.location || 'BBA Court'}</span>
        </div>

        {event.team && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Users className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{event.team.name || 'Team'}</span>
          </div>
        )}

        {event.description && (
          <p className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Academy Calendar"
        subtitle="Court bookings, team practices, match schedules, and individual training sessions"
        badge={`${events.length} Events`}
        icon={CalendarIcon}
        actions={
          <Button
            onClick={() => setIsAddingEvent(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Event
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <EventForm
            event={selectedEvent}
            onEventCreated={handleEventCreated}
            onClose={() => {
              setIsAddingEvent(false);
              setIsEditingEvent(false);
              setSelectedEvent(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="h-[650px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              eventPropGetter={eventStyleGetter}
              onSelectEvent={setSelectedEvent}
              className={isLoading ? 'opacity-50' : ''}
            />
          </div>
        </div>

        {/* Sidebar: Legend & Selected Event Details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              Event Types
            </h3>
            <div className="space-y-2 text-xs font-medium">
              {Object.entries(EventTypeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                  <span className="capitalize text-slate-700 dark:text-slate-300">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedEvent && <EventDetails event={selectedEvent} />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
