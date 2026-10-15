'use client';

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/hooks/use-dateTime';
import { Clock, MapPin, Users, AlignLeft, Dumbbell } from 'lucide-react';
import type { UseFormRegister, UseFormSetValue, FieldValues, Path, PathValue } from 'react-hook-form';

export interface PracticeFormTeam {
  _id: string;
  name: string;
  ageGroup?: string;
}

export interface PracticeFormVenue {
  _id: string;
  name: string;
  address?: string;
}

export interface PracticeFormInitialValues {
  team?: { _id?: string; name?: string } | string;
  venue?: { _id?: string; name?: string } | string;
  title?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  focusAreas?: string;
}

export interface PracticeFormProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  initialValues?: PracticeFormInitialValues | null;
}

export default function PracticeForm<T extends FieldValues = FieldValues>({
  register,
  setValue,
  initialValues,
}: PracticeFormProps<T>) {
  const [venues, setVenues] = useState<PracticeFormVenue[]>([]);
  const [teams, setTeams] = useState<PracticeFormTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>(
    typeof initialValues?.team === 'object' && initialValues?.team !== null
      ? initialValues.team._id
      : (initialValues?.team as string) || ''
  );
  const [selectedVenue, setSelectedVenue] = useState<string>(
    typeof initialValues?.venue === 'object' && initialValues?.venue !== null
      ? initialValues.venue._id
      : (initialValues?.venue as string) || ''
  );

  useEffect(() => {
    if (initialValues) {
      const teamId =
        typeof initialValues.team === 'object' && initialValues.team !== null
          ? initialValues.team._id
          : (initialValues.team as string) || '';
      const venueId =
        typeof initialValues.venue === 'object' && initialValues.venue !== null
          ? initialValues.venue._id
          : (initialValues.venue as string) || '';

      setSelectedTeam(teamId);
      setSelectedVenue(venueId);

      setValue('title' as Path<T>, (initialValues.title || '') as PathValue<T, Path<T>>);
      setValue(
        'startTime' as Path<T>,
        (initialValues.startTime ? formatDateTime(initialValues.startTime) : '') as PathValue<T, Path<T>>
      );
      setValue(
        'endTime' as Path<T>,
        (initialValues.endTime ? formatDateTime(initialValues.endTime) : '') as PathValue<T, Path<T>>
      );
      setValue(
        'focusAreas' as Path<T>,
        (initialValues.focusAreas || '') as PathValue<T, Path<T>>
      );
      setValue('venue' as Path<T>, venueId as PathValue<T, Path<T>>);
      setValue('team' as Path<T>, teamId as PathValue<T, Path<T>>);
    } else {
      setSelectedTeam('');
      setSelectedVenue('');

      setValue('title' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('startTime' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('endTime' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('focusAreas' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('venue' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('team' as Path<T>, '' as PathValue<T, Path<T>>);
    }
  }, [initialValues, setValue]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams');
        const data: PracticeFormTeam[] = await response.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch('/api/admin/venues');
        const data: PracticeFormVenue[] = await response.json();
        setVenues(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        console.error('Error fetching venues:', error);
      }
    };
    fetchVenues();
  }, []);

  const handleTeamChange = (val: string) => {
    setSelectedTeam(val);
    setValue('team' as Path<T>, val as PathValue<T, Path<T>>);
  };

  const handleVenueChange = (val: string) => {
    setSelectedVenue(val);
    setValue('venue' as Path<T>, val as PathValue<T, Path<T>>);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Practice Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Dumbbell className="h-3.5 w-3.5 text-purple-500" />
          Practice Title / Topic
        </Label>
        <Input
          id="title"
          {...register('title' as Path<T>)}
          placeholder="e.g. Offensive Fastbreak & Pick-and-Roll Drills"
          className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
        />
      </div>

      {/* Start Time & End Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="startTime" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-500" />
            Session Start Time
          </Label>
          <Input
            id="startTime"
            type="datetime-local"
            {...register('startTime' as Path<T>)}
            className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endTime" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-rose-500" />
            Session End Time
          </Label>
          <Input
            id="endTime"
            type="datetime-local"
            {...register('endTime' as Path<T>)}
            className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 font-mono"
          />
        </div>
      </div>

      {/* Team & Venue Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="team" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            Assigned Squad
          </Label>
          <Select onValueChange={handleTeamChange} value={selectedTeam}>
            <SelectTrigger id="team" className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800">
              <SelectValue placeholder="Select team..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {teams.map((t) => (
                <SelectItem key={t._id} value={t._id} className="text-xs">
                  {t.name} {t.ageGroup ? `(${t.ageGroup})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venue" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-500" />
            Practice Court Venue
          </Label>
          <Select onValueChange={handleVenueChange} value={selectedVenue}>
            <SelectTrigger id="venue" className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800">
              <SelectValue placeholder="Select court venue..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {venues.map((v) => (
                <SelectItem key={v._id} value={v._id} className="text-xs">
                  {v.name} {v.address ? `• ${v.address}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Focus Areas */}
      <div className="space-y-1.5">
        <Label htmlFor="focusAreas" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
          Technical Focus & Drill Objectives
        </Label>
        <Textarea
          id="focusAreas"
          {...register('focusAreas' as Path<T>)}
          placeholder="Main areas of focus: transition defense, spacing, free throws, screening..."
          rows={3}
          className="text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
        />
      </div>
    </div>
  );
}
