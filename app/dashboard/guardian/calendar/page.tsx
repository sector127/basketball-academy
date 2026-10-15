'use client';

import React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarView from '@/components/calendar/CalendarView';

// Read-only academy calendar for guardians
export default function GuardianCalendarPage() {
  return (
    <CalendarView
      role="guardian"
      canManageEvents={false}
    />
  );
}
