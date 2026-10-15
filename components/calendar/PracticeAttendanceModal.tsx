'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle2, XCircle, Clock, AlertTriangle, Save } from 'lucide-react';
import Loader from '@/components/Loader';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));
interface PracticeAttendanceModalProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'injured';

export interface AttendancePlayerInfo {
  jerseyNum?: number | string;
  name?: string;
  lastname?: string;
  position?: string;
}

export interface AttendanceRecordItem {
  player?: AttendancePlayerInfo;
  status: AttendanceStatus;
  notes?: string;
}

export default function PracticeAttendanceModal({
  eventId,
  isOpen,
  onClose,
  eventTitle = 'Team Practice',
}: PracticeAttendanceModalProps) {
  const t = useTranslations('Calendar');
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { data, isLoading } = useSWR<{ attendance?: AttendanceRecordItem[] }>(
    isOpen && eventId ? `/api/admin/events/${eventId}/attendance` : null,
    fetcher
  );

  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);

  useEffect(() => {
    if (data?.attendance) {
      setRecords(data.attendance);
    }
  }, [data]);

  const updateStatus = (index: number, status: AttendanceStatus) => {
    const updated = [...records];
    updated[index] = { ...updated[index], status };
    setRecords(updated);
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = [...records];
    updated[index] = { ...updated[index], notes };
    setRecords(updated);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: records }),
      });

      if (!res.ok) {
        throw new Error('Failed to record attendance');
      }

      await mutate(`/api/admin/events/${eventId}/attendance`);
      toast({
        title: 'Attendance Recorded',
        description: 'Squad attendance and availability logs updated successfully.',
        variant: 'default',
      });
      onClose();
    } catch (err: unknown) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const injuredCount = records.filter((r) => r.status === 'injured').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t('attendanceTitle')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {eventTitle} &bull; {t('attendanceSubtitle')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No squad players registered for this event.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Summary KPI Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">
                {presentCount} {t('present')}
              </Badge>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold">
                {absentCount} {t('absent')}
              </Badge>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">
                {excusedCount} {t('excused')}
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold">
                {injuredCount} {t('injured')}
              </Badge>
            </div>

            {/* Attendance List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {records.map((item, idx) => {
                const player = item.player || {};
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-amber-500 w-7">
                        #{player.jerseyNum ?? '0'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {player.name} {player.lastname}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {player.position || 'Player'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => updateStatus(idx, 'present')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          item.status === 'present'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {t('present')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(idx, 'absent')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          item.status === 'absent'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {t('absent')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(idx, 'excused')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          item.status === 'excused'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {t('excused')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(idx, 'injured')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          item.status === 'injured'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {t('injured')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting || records.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {submitting ? '...' : t('saveAttendance')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
