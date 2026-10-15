'use client';

import React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CalendarView from '@/components/calendar/CalendarView';
import { useIsAdmin } from '@/hooks/use-is-admin';

export default function CalendarPage() {
  const isAdmin = useIsAdmin();
  return (
    <CalendarView
      role="admin"
      canManageEvents={isAdmin}
    />
  );
}
