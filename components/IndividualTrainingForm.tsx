'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/hooks/use-dateTime';
import {
  Target,
  Clock,
  MapPin,
  Users,
  Search,
  X,
  Check,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseFormRegister, UseFormSetValue, FieldValues, Path, PathValue } from 'react-hook-form';

export interface TrainingVenue {
  _id: string;
  name: string;
  address?: string;
}

export interface TrainingPlayer {
  _id: string;
  name: string;
  lastname?: string;
  position?: string;
  jerseyNum?: number | string;
  jerseyNumber?: number | string;
}

export interface IndividualTrainingInitialValues {
  title?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  venue?: { _id?: string; name?: string; address?: string } | string;
  trainingType?: string;
  players?: Array<{ _id?: string } | string>;
}

export interface IndividualTrainingFormProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  initialValues?: IndividualTrainingInitialValues | null;
}

const TRAINING_TYPES = [
  { value: 'skills', label: 'Skills & Ball Handling' },
  { value: 'shooting', label: 'Shooting Clinic' },
  { value: 'strength', label: 'Strength & Conditioning' },
  { value: 'conditioning', label: 'Speed & Agility' },
  { value: 'recovery', label: 'Recovery & Mobility' },
];

export default function IndividualTrainingForm<T extends FieldValues = FieldValues>({
  register,
  setValue,
  initialValues,
}: IndividualTrainingFormProps<T>) {
  const [venues, setVenues] = useState<TrainingVenue[]>([]);
  const [players, setPlayers] = useState<TrainingPlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>(
    typeof initialValues?.venue === 'object' && initialValues?.venue !== null
      ? initialValues.venue._id || ''
      : (initialValues?.venue as string) || ''
  );
  const [selectedTrainingType, setSelectedTrainingType] = useState<string>(
    initialValues?.trainingType || 'skills'
  );
  const [playerSearch, setPlayerSearch] = useState('');

  // Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch('/api/admin/venues');
        const data: TrainingVenue[] = await response.json();
        setVenues(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        console.error('Error fetching venues:', error);
      }
    };
    fetchVenues();
  }, []);

  // Fetch players: admins get every active player, coaches only their own teams' players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const coachRes = await fetch('/api/coach/players');
        if (coachRes.ok) {
          const res: TrainingPlayer[] | { data?: TrainingPlayer[] } = await coachRes.json();
          const list = Array.isArray(res) ? res : res.data || [];
          setPlayers(list);
        }
      } catch (error: unknown) {
        console.error('Error fetching players:', error);
      }
    };
    fetchPlayers();
  }, []);

  // Set default values for the form fields
  useEffect(() => {
    if (initialValues) {
      const venueId =
        typeof initialValues.venue === 'object' && initialValues.venue !== null
          ? initialValues.venue._id || ''
          : (initialValues.venue as string) || '';
      const type = initialValues.trainingType || 'skills';
      const initialIds: string[] = (initialValues.players || [])
        .map((p) => (typeof p === 'object' && p !== null ? p._id : p))
        .filter((id): id is string => typeof id === 'string');

      setSelectedVenue(venueId);
      setSelectedTrainingType(type);
      setSelectedPlayerIds(initialIds);

      setValue('title' as Path<T>, (initialValues.title || '') as PathValue<T, Path<T>>);
      setValue(
        'startTime' as Path<T>,
        (initialValues.startTime ? formatDateTime(initialValues.startTime) : '') as PathValue<T, Path<T>>
      );
      setValue(
        'endTime' as Path<T>,
        (initialValues.endTime ? formatDateTime(initialValues.endTime) : '') as PathValue<T, Path<T>>
      );
      setValue('venue' as Path<T>, venueId as PathValue<T, Path<T>>);
      setValue('trainingType' as Path<T>, type as PathValue<T, Path<T>>);
      setValue('players' as Path<T>, initialIds as PathValue<T, Path<T>>);
    } else {
      setSelectedVenue('');
      setSelectedTrainingType('skills');
      setSelectedPlayerIds([]);

      setValue('title' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('startTime' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('endTime' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('venue' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('trainingType' as Path<T>, 'skills' as PathValue<T, Path<T>>);
      setValue('players' as Path<T>, [] as PathValue<T, Path<T>>);
    }
  }, [initialValues, setValue]);

  // Handle player toggle
  const togglePlayer = (playerId: string) => {
    const next = selectedPlayerIds.includes(playerId)
      ? selectedPlayerIds.filter((id) => id !== playerId)
      : [...selectedPlayerIds, playerId];

    setSelectedPlayerIds(next);
    setValue('players' as Path<T>, next as PathValue<T, Path<T>>);
  };

  const removePlayer = (playerId: string) => {
    const next = selectedPlayerIds.filter((id) => id !== playerId);
    setSelectedPlayerIds(next);
    setValue('players' as Path<T>, next as PathValue<T, Path<T>>);
  };

  const handleVenueChange = (val: string) => {
    setSelectedVenue(val);
    setValue('venue' as Path<T>, val as PathValue<T, Path<T>>);
  };

  const handleTrainingTypeChange = (val: string) => {
    setSelectedTrainingType(val);
    setValue('trainingType' as Path<T>, val as PathValue<T, Path<T>>);
  };

  // Filter players by search query
  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return players;
    const q = playerSearch.toLowerCase();
    return players.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.lastname?.toLowerCase().includes(q) ||
        p.position?.toLowerCase().includes(q) ||
        String(p.jerseyNum || p.jerseyNumber || '').includes(q)
    );
  }, [players, playerSearch]);

  const selectedPlayersObjects = useMemo(() => {
    return players.filter((p) => selectedPlayerIds.includes(p._id));
  }, [players, selectedPlayerIds]);

  return (
    <div className="space-y-4 text-xs">
      {/* Session Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-emerald-500" />
          Workout / Session Title
        </Label>
        <Input
          id="title"
          {...register('title' as Path<T>)}
          placeholder="e.g. Shooting Clinic & Guard Decision Making"
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

      {/* Training Type & Venue Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="trainingType" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Training Specialty
          </Label>
          <Select onValueChange={handleTrainingTypeChange} value={selectedTrainingType}>
            <SelectTrigger id="trainingType" className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800">
              <SelectValue placeholder="Select training type..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {TRAINING_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venue" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            Training Court / Facility
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

      {/* Participating Players */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            Participating Players ({selectedPlayerIds.length})
          </Label>
          {selectedPlayerIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedPlayerIds([]);
                setValue('players' as Path<T>, [] as PathValue<T, Path<T>>);
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Selected Players Badges Pill Bar */}
        {selectedPlayersObjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850/50">
            {selectedPlayersObjects.map((p) => (
              <Badge
                key={p._id}
                variant="outline"
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 rounded-lg"
              >
                <span>
                  {p.name} {p.lastname}
                </span>
                {p.jerseyNumber && (
                  <span className="font-mono text-[9px] opacity-75">#{p.jerseyNumber}</span>
                )}
                <button
                  type="button"
                  onClick={() => removePlayer(p._id)}
                  className="ml-0.5 hover:text-rose-500 transition-colors"
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search & Selection Container */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="relative border-b border-slate-100 dark:border-slate-800">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search academy player by name or jersey..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-transparent focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="max-h-36 overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayerIds.includes(player._id);
                return (
                  <button
                    key={player._id}
                    type="button"
                    onClick={() => togglePlayer(player._id)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors',
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs">
                        {player.name} {player.lastname}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      {player.position && <span>{player.position}</span>}
                      {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="p-3 text-center text-xs text-slate-400">
                No players match &ldquo;{playerSearch}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
