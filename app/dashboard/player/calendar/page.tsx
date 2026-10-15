'use client';

import React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarView from '@/components/calendar/CalendarView';

// Read-only academy calendar for players
export default function PlayerCalendarPage() {
  return (
    <CalendarView
      role="player"
      canManageEvents={false}
    />
  );
}
