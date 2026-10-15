'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  MapPin,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  Activity,
  CalendarCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addMonths, format, parseISO } from 'date-fns';

export interface PlannerTeam {
  _id: string;
  name: string;
  coach?: { name?: string; lastname?: string };
  ageGroup?: string;
}

export interface PlannerVenue {
  _id: string;
  name: string;
  address?: string;
  capacity?: number;
}

export interface PlannerDaySchedule {
  startTime: string;
  endTime: string;
}

export interface PlannerSessionPreview {
  dayName: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflictReason?: string;
}

export interface PlannerPreviewData {
  totalSessions: number;
  availableCount: number;
  conflictCount: number;
  sessions: PlannerSessionPreview[];
}

export interface TeamPracticePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleCreated?: () => void;
}

const WEEKDAYS = [
  { day: 1, short: 'Mon', full: 'Monday' },
  { day: 2, short: 'Tue', full: 'Tuesday' },
  { day: 3, short: 'Wed', full: 'Wednesday' },
  { day: 4, short: 'Thu', full: 'Thursday' },
  { day: 5, short: 'Fri', full: 'Friday' },
  { day: 6, short: 'Sat', full: 'Saturday' },
  { day: 0, short: 'Sun', full: 'Sunday' },
];

const DEFAULT_DURATIONS = [
  { label: '60 min', minutes: 60 },
  { label: '75 min', minutes: 75 },
  { label: '90 min', minutes: 90 },
  { label: '120 min', minutes: 120 },
];

export default function TeamPracticePlannerModal({
  isOpen,
  onClose,
  onScheduleCreated,
}: TeamPracticePlannerModalProps) {
  const { toast } = useToast();

  // Data sources
  const [teams, setTeams] = useState<PlannerTeam[]>([]);
  const [venues, setVenues] = useState<PlannerVenue[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form State
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [sessionType, setSessionType] = useState('practice');
  const [frequency, setFrequency] = useState(3); // 1 to 5 days
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // default: Mon, Wed, Fri

  // Day schedules: { [dayOfWeek]: { startTime: '18:00', endTime: '19:30' } }
  const [daySchedules, setDaySchedules] = useState<Record<number, PlannerDaySchedule>>({
    1: { startTime: '18:00', endTime: '19:30' },
    3: { startTime: '18:00', endTime: '19:30' },
    5: { startTime: '18:00', endTime: '19:30' },
  });

  // Season dates
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [startDate, setStartDate] = useState(today);

  // Default end date: 3 months from now
  const defaultEndDate = useMemo(() => {
    return format(addMonths(new Date(), 3), 'yyyy-MM-dd');
  }, []);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Venue
  const [selectedVenueId, setSelectedVenueId] = useState('');

  // Title template
  const [customTitle, setCustomTitle] = useState('');

  // Preview & conflict state
  const [previewData, setPreviewData] = useState<PlannerPreviewData | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [skipConflicts, setSkipConflicts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch teams and venues on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingData(true);

    Promise.all([
      fetch('/api/admin/teams').then((r) => r.json()),
      fetch('/api/admin/venues').then((r) => r.json()),
    ])
      .then(([teamsData, venuesData]: [unknown, unknown]) => {
        if (!isMounted) return;
        const validTeams: PlannerTeam[] = Array.isArray(teamsData) ? teamsData : [];
        const validVenues: PlannerVenue[] = Array.isArray(venuesData) ? venuesData : [];
        setTeams(validTeams);
        setVenues(validVenues);

        if (validTeams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(validTeams[0]._id);
        }
        if (validVenues.length > 0 && !selectedVenueId) {
          setSelectedVenueId(validVenues[0]._id);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load teams/venues:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle day toggle
  const toggleDay = (dayNum: number) => {
    setSelectedDays((prev) => {
      let next: number[];
      if (prev.includes(dayNum)) {
        if (prev.length <= 1) return prev; // Keep at least one
        next = prev.filter((d) => d !== dayNum);
      } else {
        if (prev.length >= 6) return prev;
        next = [...prev, dayNum].sort((a, b) => {
          const orderA = a === 0 ? 7 : a;
          const orderB = b === 0 ? 7 : b;
          return orderA - orderB;
        });
      }

      setFrequency(next.length);

      // Ensure day schedule exists for new day
      setDaySchedules((prevSchedules) => {
        if (!prevSchedules[dayNum]) {
          const sampleTime = prevSchedules[prev[0]] || {
            startTime: '18:00',
            endTime: '19:30',
          };
          return { ...prevSchedules, [dayNum]: { ...sampleTime } };
        }
        return prevSchedules;
      });

      return next;
    });
  };

  // Change frequency pill
  const handleFrequencyChange = (newFreq: number) => {
    setFrequency(newFreq);
    const standardPresets: Record<number, number[]> = {
      1: [3], // Wed
      2: [2, 4], // Tue, Thu
      3: [1, 3, 5], // Mon, Wed, Fri
      4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
      5: [1, 2, 3, 4, 5], // Mon-Fri
    };

    const targetDays = standardPresets[newFreq] || [1, 3, 5];
    setSelectedDays(targetDays);

    setDaySchedules((prev) => {
      const updated = { ...prev };
      targetDays.forEach((d) => {
        if (!updated[d]) {
          updated[d] = { startTime: '18:00', endTime: '19:30' };
        }
      });
      return updated;
    });
  };

  // Update specific day time
  const handleDayTimeChange = (
    dayNum: number,
    field: keyof PlannerDaySchedule,
    value: string
  ) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayNum]: {
        ...(prev[dayNum] || { startTime: '18:00', endTime: '19:30' }),
        [field]: value,
      },
    }));
  };

  // Quick helper: Set duration for a day
  const handleSetDuration = (dayNum: number, minutes: number) => {
    const current = daySchedules[dayNum] || { startTime: '18:00', endTime: '19:30' };
    const [h, m] = current.startTime.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + minutes;
    const endH = Math.floor(endMins / 60) % 24;
    const endM = endMins % 60;
    const formattedEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    handleDayTimeChange(dayNum, 'endTime', formattedEnd);
  };

  // Copy first day's times to all other selected days
  const handleCopyTimesToAll = () => {
    if (selectedDays.length === 0) return;
    const sourceDay = selectedDays[0];
    const sourceSchedule = daySchedules[sourceDay] || {
      startTime: '18:00',
      endTime: '19:30',
    };

    setDaySchedules((prev) => {
      const updated = { ...prev };
      selectedDays.forEach((d) => {
        updated[d] = { ...sourceSchedule };
      });
      return updated;
    });

    toast({
      title: 'Times Copied',
      description: `Applied ${sourceSchedule.startTime} – ${sourceSchedule.endTime} to all ${selectedDays.length} practice days.`,
    });
  };

  // Quick preset for season end date
  const setQuickEndDate = (months: number) => {
    setEndDate(format(addMonths(parseISO(startDate || today), months), 'yyyy-MM-dd'));
  };

  // Active selected team info
  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === selectedTeamId),
    [teams, selectedTeamId]
  );

  // Construct schedule payload
  const currentScheduleArray = useMemo(() => {
    return selectedDays.map((dayNum) => ({
      dayOfWeek: dayNum,
      startTime: daySchedules[dayNum]?.startTime || '18:00',
      endTime: daySchedules[dayNum]?.endTime || '19:30',
      venueId: selectedVenueId,
    }));
  }, [selectedDays, daySchedules, selectedVenueId]);

  // Fetch Preview
  const fetchPreview = useCallback(async () => {
    if (!selectedTeamId || !selectedVenueId || !startDate || !endDate) return;

    try {
      setIsPreviewing(true);
      const res = await fetch('/api/admin/events/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          teamId: selectedTeamId,
          venueId: selectedVenueId,
          sessionType,
          title: customTitle,
          startDate,
          endDate,
          schedule: currentScheduleArray,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (res.ok) {
        const data: PlannerPreviewData = await res.json();
        setPreviewData(data);
      } else {
        setPreviewData(null);
      }
    } catch (err: unknown) {
      console.warn('Preview error:', err);
      setPreviewData(null);
    } finally {
      setIsPreviewing(false);
    }
  }, [
    selectedTeamId,
    selectedVenueId,
    sessionType,
    customTitle,
    startDate,
    endDate,
    currentScheduleArray,
  ]);

  // Debounce preview update when schedule changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 450);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  // Submit and batch create events
  const handleBatchCreate = async () => {
    if (!selectedTeamId || !selectedVenueId) {
      toast({
        title: 'Missing information',
        description: 'Please select a squad and venue.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/events/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          teamId: selectedTeamId,
          venueId: selectedVenueId,
          sessionType,
          title: customTitle,
          startDate,
          endDate,
          schedule: currentScheduleArray,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          skipConflicts,
        }),
      });

      const data: { error?: string; message?: string; count?: number } = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create recurring practices');
      }

      toast({
        title: 'Season Schedule Booked!',
        description: data.message || `Successfully created ${data.count ?? 0} practice sessions.`,
      });

      onScheduleCreated?.();
      onClose();
    } catch (err: unknown) {
      toast({
        title: 'Booking Error',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-amber-500">
            <Sparkles className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Plan Team Season Practices
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Configure weekly frequency, court time slots, and season duration to automatically
            populate the entire practice calendar.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span>Loading academy teams and facilities...</span>
          </div>
        ) : (
          <div className="space-y-5 py-3">
            {/* 1. Squad Selection & Session Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <div className="space-y-1.5">
                <Label htmlFor="plan-team" className="text-xs font-semibold flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-500" /> Select Squad / Team *
                </Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger id="plan-team" className="h-9.5 text-xs rounded-xl bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Choose a squad..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {teams.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTeam && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Head Coach: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTeam.coach?.name || 'Assigned Staff'}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-session-type" className="text-xs font-semibold flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-500" /> Session Type
                </Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger id="plan-session-type" className="h-9.5 text-xs rounded-xl bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Session Type..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="practice">🏀 Team Practice (Drills & Scrimmage)</SelectItem>
                    <SelectItem value="individualTraining">🎯 Skills & Conditioning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 2. Frequency & Days of Week */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-amber-500" /> Weekly Frequency
                </Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleFrequencyChange(num)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                        frequency === num
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      {num}× / week
                    </button>
                  ))}
                </div>
              </div>

              {/* Day selection chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {WEEKDAYS.map((w) => {
                  const isSelected = selectedDays.includes(w.day);
                  return (
                    <button
                      key={w.day}
                      type="button"
                      onClick={() => toggleDay(w.day)}
                      className={cn(
                        'flex-1 min-w-[70px] py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5',
                        isSelected
                          ? 'border-amber-500/80 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold shadow-xs'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      )}
                    >
                      <span className="text-xs uppercase">{w.short}</span>
                      <span className="text-[10px] font-normal opacity-70">
                        {isSelected ? 'Active' : 'Off'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Detailed Day-by-Day Time Slots */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" /> Court Times per Practice Day
                </span>
                {selectedDays.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyTimesToAll}
                    className="h-7 text-[11px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy first time to all days
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {selectedDays.map((dayNum) => {
                  const dayInfo = WEEKDAYS.find((w) => w.day === dayNum);
                  const schedule = daySchedules[dayNum] || {
                    startTime: '18:00',
                    endTime: '19:30',
                  };

                  return (
                    <div
                      key={dayNum}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                          {dayInfo?.short}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {dayInfo?.full}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="flex items-center gap-1">
                          <Label className="text-[11px] text-slate-400">Start:</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) =>
                              handleDayTimeChange(dayNum, 'startTime', e.target.value)
                            }
                            className="h-8 w-24 text-xs font-mono rounded-lg"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <Label className="text-[11px] text-slate-400">End:</Label>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) =>
                              handleDayTimeChange(dayNum, 'endTime', e.target.value)
                            }
                            className="h-8 w-24 text-xs font-mono rounded-lg"
                          />
                        </div>

                        {/* Quick duration presets */}
                        <div className="hidden md:flex items-center gap-1 ml-1">
                          {DEFAULT_DURATIONS.map((dur) => (
                            <button
                              key={dur.minutes}
                              type="button"
                              onClick={() => handleSetDuration(dayNum, dur.minutes)}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                            >
                              {dur.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Timeline (Start -> Season End) & Primary Venue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Season Duration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5 text-amber-500" /> Start Date *
                  </Label>
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    End of Season *
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Quick end-date presets */}
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setQuickEndDate(1)}
                    className="text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:underline px-1"
                  >
                    +1 Month
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setQuickEndDate(3)}
                    className="text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:underline px-1"
                  >
                    +3 Months (Quarter)
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setQuickEndDate(6)}
                    className="text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:underline px-1"
                  >
                    +6 Months (Semester)
                  </button>
                </div>
              </div>

              {/* Primary Venue */}
              <div className="space-y-1.5">
                <Label htmlFor="plan-venue" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> Practice Court Venue *
                </Label>
                <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                  <SelectTrigger id="plan-venue" className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select home court venue..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {venues.map((venue) => (
                      <SelectItem key={venue._id} value={venue._id}>
                        {venue.name} {venue.capacity ? `(${venue.capacity} seats)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 truncate">
                  {venues.find((v) => v._id === selectedVenueId)?.address || 'Select a venue'}
                </p>
              </div>
            </div>

            {/* Optional Title Template */}
            <div className="space-y-1.5">
              <Label htmlFor="plan-title" className="text-xs font-semibold flex items-center gap-1.5">
                Practice Session Title (Optional)
              </Label>
              <Input
                id="plan-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={`e.g. ${selectedTeam?.name || 'BBA U18'} - Team Practice`}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* 5. Live Schedule Preview & Conflict Summary */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-emerald-500" />
                  Generated Season Schedule Summary
                </span>
                {isPreviewing && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin text-amber-500" /> Calculating dates...
                  </span>
                )}
              </div>

              {previewData ? (
                <div className="space-y-2.5">
                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Total Sessions
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {previewData.totalSessions}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Available
                      </span>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {previewData.availableCount}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">
                        Conflicts
                      </span>
                      <p className="text-base font-bold text-rose-500">
                        {previewData.conflictCount}
                      </p>
                    </div>
                  </div>

                  {/* Conflict notification & auto-skip toggle */}
                  {previewData.conflictCount > 0 ? (
                    <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {previewData.conflictCount} court conflicts detected with existing matches or events.
                        </p>
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={skipConflicts}
                            onChange={(e) => setSkipConflicts(e.target.checked)}
                            className="rounded border-amber-400 text-amber-500 focus:ring-amber-400"
                          />
                          <span>Automatically skip conflicting dates and book remaining ({previewData.availableCount})</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>All {previewData.totalSessions} scheduled time slots are verified open at the court!</span>
                    </div>
                  )}

                  {/* Scrollable list preview of next 6 sessions */}
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border-t border-slate-200/60 dark:border-slate-800 pt-2 text-xs">
                    {previewData.sessions.slice(0, 8).map((session, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px]',
                          session.isAvailable
                            ? 'bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-500">{session.dayName.slice(0, 3)}</span>
                          <span>{session.date}</span>
                          <span className="font-mono text-slate-400">{session.startTime}–{session.endTime}</span>
                        </div>
                        <div>
                          {session.isAvailable ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Available
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1" title={session.conflictReason}>
                              <AlertTriangle className="h-3 w-3" /> Conflict
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {previewData.sessions.length > 8 && (
                      <p className="text-[10px] text-center text-slate-400 pt-1">
                        ... plus {previewData.sessions.length - 8} more sessions across the season
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  Select a team, days, and season timeline to view schedule summary.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleBatchCreate}
            disabled={
              isSubmitting ||
              loadingData ||
              !previewData ||
              (skipConflicts ? previewData.availableCount === 0 : previewData.totalSessions === 0)
            }
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm transition-all hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Booking Season...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Book {previewData ? (skipConflicts ? previewData.availableCount : previewData.totalSessions) : ''} Practices for Season
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
