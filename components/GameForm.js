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
import { Users, Trophy, Clock, MapPin, AlignLeft, ShieldAlert } from 'lucide-react';

const GameForm = ({ register, setValue, initialValues }) => {
  const t = useTranslations('Games');
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isAwayGame, setIsAwayGame] = useState(initialValues?.isAwayGame || false);
  const [selectedTeam, setSelectedTeam] = useState(
    initialValues?.team?._id || initialValues?.team || ''
  );
  const [selectedVenue, setSelectedVenue] = useState(
    initialValues?.venue?._id || initialValues?.venue || ''
  );

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams');
        const data = await response.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
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
        const data = await response.json();
        setVenues(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    };
    fetchVenues();
  }, []);

  // Set default values for the form fields
  useEffect(() => {
    if (initialValues) {
      const teamId = initialValues.team?._id || initialValues.team || '';
      const venueId = initialValues.venue?._id || initialValues.venue || '';

      setSelectedTeam(teamId);
      setSelectedVenue(venueId);
      setIsAwayGame(initialValues.isAwayGame || false);

      setValue('team', teamId);
      setValue('opponent', initialValues.opponent || '');
      setValue('startTime', formatDateTime(initialValues.startTime));
      setValue('endTime', formatDateTime(initialValues.endTime));
      setValue('venue', venueId);
      setValue('location', initialValues.location || '');
      setValue('isAwayGame', initialValues.isAwayGame || false);
      setValue('description', initialValues.description || '');
    } else {
      setSelectedTeam('');
      setSelectedVenue('');
      setIsAwayGame(false);

      setValue('team', '');
      setValue('opponent', '');
      setValue('startTime', '');
      setValue('endTime', '');
      setValue('venue', '');
      setValue('location', '');
      setValue('isAwayGame', false);
      setValue('description', '');
    }
  }, [initialValues, setValue]);

  const handleAwayGameToggle = (checked) => {
    setIsAwayGame(checked);
    setValue('isAwayGame', checked);
    if (checked) {
      setValue('venue', '');
      setSelectedVenue('');
    } else {
      setValue('location', '');
    }
  };

  const handleTeamChange = (val) => {
    setSelectedTeam(val);
    setValue('team', val);
  };

  const handleVenueChange = (val) => {
    setSelectedVenue(val);
    setValue('venue', val);
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
              {teams.map((t) => (
                <SelectItem key={t._id} value={t._id} className="text-xs">
                  {t.name} {t.ageGroup ? `(${t.ageGroup})` : ''}
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
            {...register('opponent')}
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
            {...register('startTime')}
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
            {...register('endTime')}
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
            {...register('location')}
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
          {...register('description')}
          placeholder="Jersey colors, arrival time, locker room instructions..."
          rows={2}
          className="text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
        />
      </div>
    </div>
  );
};

export default GameForm;
