'use client';

import React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarView from '@/components/calendar/CalendarView';
export default function CoachCalendarPage() {
  return (
    <CalendarView
      role="coach"
      canManageEvents={true}
    />
  );
}
