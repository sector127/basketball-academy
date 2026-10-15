'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/hooks/use-dateTime';
import { Users, Trophy, Clock, MapPin, AlignLeft } from 'lucide-react';
import type { UseFormRegister, UseFormSetValue, FieldValues, Path, PathValue } from 'react-hook-form';

export interface GameFormTeam {
  _id: string;
  name: string;
  ageGroup?: string;
}

export interface GameFormVenue {
  _id: string;
  name: string;
  address?: string;
}

export interface GameFormInitialValues {
  team?: { _id?: string; name?: string } | string;
  venue?: { _id?: string; name?: string } | string;
  opponent?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  location?: string;
  isAwayGame?: boolean;
  description?: string;
}

export interface GameFormProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  initialValues?: GameFormInitialValues | null;
}

export default function GameForm<T extends FieldValues = FieldValues>({
  register,
  setValue,
  initialValues,
}: GameFormProps<T>) {
  const t = useTranslations('Games');
  const [, setLoading] = useState(true);
  const [teams, setTeams] = useState<GameFormTeam[]>([]);
  const [venues, setVenues] = useState<GameFormVenue[]>([]);
  const [isAwayGame, setIsAwayGame] = useState(initialValues?.isAwayGame || false);
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

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams');
        const data: GameFormTeam[] = await response.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch('/api/admin/venues');
        const data: GameFormVenue[] = await response.json();
        setVenues(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        console.error('Error fetching venues:', error);
      }
    };
    fetchVenues();
  }, []);

  // Set default values for the form fields
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
      setIsAwayGame(initialValues.isAwayGame || false);

      setValue('team' as Path<T>, teamId as PathValue<T, Path<T>>);
      setValue('opponent' as Path<T>, (initialValues.opponent || '') as PathValue<T, Path<T>>);
      setValue(
        'startTime' as Path<T>,
        (initialValues.startTime ? formatDateTime(initialValues.startTime) : '') as PathValue<T, Path<T>>
      );
      setValue(
        'endTime' as Path<T>,
        (initialValues.endTime ? formatDateTime(initialValues.endTime) : '') as PathValue<T, Path<T>>
      );
      setValue('venue' as Path<T>, venueId as PathValue<T, Path<T>>);
      setValue('location' as Path<T>, (initialValues.location || '') as PathValue<T, Path<T>>);
      setValue(
        'isAwayGame' as Path<T>,
        (initialValues.isAwayGame || false) as PathValue<T, Path<T>>
      );
      setValue(
        'description' as Path<T>,
        (initialValues.description || '') as PathValue<T, Path<T>>
      );
    } else {
      setSelectedTeam('');
      setSelectedVenue('');
      setIsAwayGame(false);

      setValue('team' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('opponent' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('startTime' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('endTime' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('venue' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('location' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('isAwayGame' as Path<T>, false as PathValue<T, Path<T>>);
      setValue('description' as Path<T>, '' as PathValue<T, Path<T>>);
    }
  }, [initialValues, setValue]);

  const handleAwayGameToggle = (checked: boolean) => {
    setIsAwayGame(checked);
    setValue('isAwayGame' as Path<T>, checked as PathValue<T, Path<T>>);
    if (checked) {
      setValue('venue' as Path<T>, '' as PathValue<T, Path<T>>);
      setSelectedVenue('');
    } else {
      setValue('location' as Path<T>, '' as PathValue<T, Path<T>>);
    }
  };

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
      {/* Team & Opponent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="team" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            {t('team')}
          </Label>
          <Select onValueChange={handleTeamChange} value={selectedTeam}>
            <SelectTrigger id="team" className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800">
              <SelectValue placeholder="Select our team..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {teams.map((teamItem) => (
                <SelectItem key={teamItem._id} value={teamItem._id} className="text-xs">
                  {teamItem.name} {teamItem.ageGroup ? `(${teamItem.ageGroup})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="opponent" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            {t('opponent')}
          </Label>
          <Input
            id="opponent"
            {...register('opponent' as Path<T>)}
            placeholder="e.g. Dinamo Tbilisi U18"
            className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Start Time & End Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="startTime" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-500" />
            {t('time')}
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
            Expected End Time
          </Label>
          <Input
            id="endTime"
            type="datetime-local"
            {...register('endTime' as Path<T>)}
            className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 font-mono"
          />
        </div>
      </div>

      {/* Away Game Toggle Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
            {t('isAwayGame')}
          </span>
        </div>
        <Switch
          id="isAwayGame"
          checked={isAwayGame}
          onCheckedChange={handleAwayGameToggle}
        />
      </div>

      {/* Venue / Location */}
      {isAwayGame ? (
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            {t('venue')}
          </Label>
          <Input
            id="location"
            {...register('location' as Path<T>)}
            placeholder="e.g. Olympic Palace, Tbilisi, Georgia"
            className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="venue" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            {t('venue')}
          </Label>
          <Select onValueChange={handleVenueChange} value={selectedVenue}>
            <SelectTrigger id="venue" className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800">
              <SelectValue placeholder="Select home court venue..." />
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
      )}

      {/* Additional Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
          Tactical Notes / Instructions (Optional)
        </Label>
        <Textarea
          id="description"
          {...register('description' as Path<T>)}
          placeholder="Jersey colors, arrival time, locker room instructions..."
          rows={2}
          className="text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
        />
      </div>
    </div>
  );
}
