'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GameForm from '@/components/GameForm';
import PracticeForm from '@/components/PracticeForm';
import IndividualTrainingForm from '@/components/IndividualTrainingForm';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Activity,
  Target,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Save,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_THEMES } from '@/components/calendar/CalendarEvent';

const EVENT_TYPE_OPTIONS = [
  {
    type: 'game',
    label: 'Match & Fixture',
    badge: 'Game',
    description: 'Official league matches, tournaments, and friendlies against opponent squads.',
    icon: Trophy,
    theme: EVENT_TYPE_THEMES.game,
  },
  {
    type: 'practice',
    label: 'Team Practice',
    badge: 'Practice',
    description: 'Court drills, tactical offensive/defensive playbooks, and scrimmage.',
    icon: Activity,
    theme: EVENT_TYPE_THEMES.practice,
  },
  {
    type: 'individualTraining',
    label: 'Skills & Individuals',
    badge: 'Individuals',
    description: 'Personal player workouts, shooting clinics, conditioning, and recovery.',
    icon: Target,
    theme: EVENT_TYPE_THEMES.individualTraining,
  },
];

const EventForm = ({ event, onEventCreated, onClose, role = 'admin' }) => {
  const isCoach = role === 'coach';
  const [step, setStep] = useState(event ? 2 : (isCoach ? 2 : 1));
  const [eventType, setEventType] = useState(event?.eventType || (isCoach ? 'individualTraining' : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: event || (isCoach ? { eventType: 'individualTraining' } : {}),
  });
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      setEventType(event.eventType);
      setStep(2);
      reset(event);
    } else {
      if (isCoach) {
        setStep(2);
        setEventType('individualTraining');
        setValue('eventType', 'individualTraining');
        reset({ eventType: 'individualTraining' });
      } else {
        setStep(1);
        setEventType('');
        reset({});
      }
    }
  }, [event, reset, isCoach, setValue]);

  const handleEventTypeSelect = (type) => {
    setEventType(type);
    setValue('eventType', type);
    setStep(2);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // datetime-local values ("2026-10-03T18:00") have no offset; convert them here in the
      // user's time zone so the server doesn't parse them in its own zone
      const toIso = (value) => {
        const date = value ? new Date(value) : null;
        return date && !isNaN(date.getTime()) ? date.toISOString() : value;
      };
      const payload = {
        ...data,
        startTime: toIso(data.startTime),
        endTime: toIso(data.endTime),
        eventType,
        id: event?._id || event?.id,
      };

      const requestOptions = {
        method: event ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      };

      const endpoint = event
        ? `/api/admin/events/${event._id || event.id}`
        : '/api/admin/events';

      const response = await fetch(endpoint, requestOptions);
      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Event ${event ? 'updated' : 'scheduled'} successfully!`,
          variant: 'newSuccess',
        });
        onEventCreated();
        onClose();
      } else {
        toast({
          title: 'Scheduling Conflict or Error',
          description: result.error || 'Failed to save event. Check venue availability.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Server error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTheme = EVENT_TYPE_THEMES[eventType] || EVENT_TYPE_THEMES.other;
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="w-full space-y-4">
      {/* STEP 1: Rich Event Type Selection */}
      {step === 1 && (
        <div className="space-y-4 py-1">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the category of academy schedule you want to add:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {EVENT_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleEventTypeSelect(opt.type)}
                  className="group flex items-start gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 shadow-xs hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all text-left"
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border group-hover:scale-105 transition-transform',
                      opt.theme.badgeClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {opt.label}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Selected Form Details */}
      {step === 2 && (
        isCoach && event && event.eventType !== 'individualTraining' ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold text-sm">Administrative Event</p>
              <p className="leading-relaxed">
                Team practices and matches are managed through the Academy Administration dashboard.
                Coaches are authorized to schedule and manage Skills &amp; Individual Training sessions only.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs font-semibold rounded-xl">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Header indicator of current event type */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg border',
                  currentTheme.badgeClass
                )}
              >
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Event Category
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                  {eventType.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            </div>

            {!event && !isCoach && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="h-8 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600"
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Change
              </Button>
            )}
          </div>

          {/* Sub-form inputs */}
          <div className="space-y-4">
            {eventType === 'game' && (
              <GameForm register={register} setValue={setValue} initialValues={event} />
            )}
            {eventType === 'practice' && (
              <PracticeForm register={register} setValue={setValue} initialValues={event} />
            )}
            {eventType === 'individualTraining' && (
              <IndividualTrainingForm register={register} setValue={setValue} initialValues={event} />
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {!event ? (
              isCoach ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold rounded-xl"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                </Button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs font-semibold rounded-xl"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-sm rounded-xl text-xs px-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : event ? (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Schedule Event
                  </>
                )}
              </Button>
            </div>
          </div>
          </form>
        )
      )}
    </div>
  );
};

export default EventForm;
