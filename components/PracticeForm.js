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
import { Activity, Clock, MapPin, Users, AlignLeft, Dumbbell } from 'lucide-react';

const PracticeForm = ({ register, setValue, initialValues }) => {
  const [venues, setVenues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(
    initialValues?.team?._id || initialValues?.team || ''
  );
  const [selectedVenue, setSelectedVenue] = useState(
    initialValues?.venue?._id || initialValues?.venue || ''
  );

  useEffect(() => {
    if (initialValues) {
      const teamId = initialValues.team?._id || initialValues.team || '';
      const venueId = initialValues.venue?._id || initialValues.venue || '';

      setSelectedTeam(teamId);
      setSelectedVenue(venueId);

      setValue('title', initialValues.title || '');
      setValue('startTime', formatDateTime(initialValues.startTime));
      setValue('endTime', formatDateTime(initialValues.endTime));
      setValue('focusAreas', initialValues.focusAreas || '');
      setValue('venue', venueId);
      setValue('team', teamId);
    } else {
      setSelectedTeam('');
      setSelectedVenue('');

      setValue('title', '');
      setValue('startTime', '');
      setValue('endTime', '');
      setValue('focusAreas', '');
      setValue('venue', '');
      setValue('team', '');
    }
  }, [initialValues, setValue]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams');
        const data = await response.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, []);

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
      {/* Practice Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Dumbbell className="h-3.5 w-3.5 text-purple-500" />
          Practice Title / Topic
        </Label>
        <Input
          id="title"
          {...register('title')}
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
            {...register('startTime')}
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
            {...register('endTime')}
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
          {...register('focusAreas')}
          placeholder="Main areas of focus: transition defense, spacing, free throws, screening..."
          rows={3}
          className="text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
        />
      </div>
    </div>
  );
};

export default PracticeForm;
