'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { playerSchema, PlayerFormData } from '@/schemas/playerSchema';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Shield,
  Phone,
  MapPin,
  Calendar,
  Ruler,
  Hash,
  Upload,
  ArrowLeft,
  Save,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Team {
  _id: string;
  name: string;
  description?: string;
}

const POSITIONS = [
  'Point Guard',
  'Shooting Guard',
  'Small Forward',
  'Power Forward',
  'Center',
];

const GUARDIANS = ['Mother', 'Father', 'Other'];

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : []));

export interface PlayerInitialData extends Partial<PlayerFormData> {
  _id?: string;
  profilePicture?: string;
  team?: { _id?: string } | string;
}

interface PlayerFormProps {
  initialData?: PlayerInitialData | null;
  isEditing?: boolean;
  playerId?: string;
}

export default function PlayerForm({ initialData, isEditing = false, playerId }: PlayerFormProps) {
  const t = useTranslations('Players');
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.profilePicture || null);
  const [submitting, setSubmitting] = useState(false);

  const { data: teamsData, isLoading: teamsLoading } = useSWR<Team[]>('/api/admin/teams', fetcher);
  const teams = Array.isArray(teamsData) ? teamsData : [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: '',
      lastname: '',
      dateOfBirth: '',
      height: 180,
      position: '',
      jerseyNum: 0,
      teamId: '',
      tel: '',
      address: '',
      guardian: 'Mother',
      guardianTel: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      const formattedDob = initialData.dateOfBirth
        ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
        : '';
      reset({
        name: initialData.name || '',
        lastname: initialData.lastname || '',
        dateOfBirth: formattedDob,
        height: initialData.height || 180,
        position: initialData.position || '',
        jerseyNum: initialData.jerseyNum ?? 0,
        teamId: typeof initialData.team === 'object' && initialData.team !== null && '_id' in initialData.team
          ? initialData.team._id || ''
          : (typeof initialData.team === 'string' ? initialData.team : ''),
        tel: initialData.tel || '',
        address: initialData.address || '',
        guardian: initialData.guardian || 'Mother',
        guardianTel: initialData.guardianTel || '',
      });
      if (initialData.profilePicture) {
        setImagePreview(initialData.profilePicture);
      }
    }
  }, [initialData, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PlayerFormData) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      const url = isEditing && playerId
        ? `/api/admin/players/${playerId}`
        : '/api/admin/players';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} player`);
      }

      toast({
        title: isEditing ? 'Player Updated' : 'Player Registered',
        description: `Successfully ${isEditing ? 'updated' : 'added'} ${data.name} ${data.lastname}.`,
        variant: 'default',
      });

      router.push('/dashboard/admin/players');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error saving player:', err);
      const message = err instanceof Error ? err.message : 'An error occurred while saving the player profile.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Top Card: Photo & Basic Identification */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-amber-500" /> {t('personalInfo')}
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6 pb-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/40 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center group shadow-sm">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Profile preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <User className="h-10 w-10 stroke-[1.5]" />
                <span className="text-[10px] mt-1 font-semibold uppercase tracking-wider">No Photo</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 border-slate-300 dark:border-slate-700"
            >
              <Upload className="h-4 w-4 text-amber-500" />
              {imagePreview ? 'Change Photo' : 'Upload Player Photo'}
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supported formats: JPEG, PNG, WebP (Max 5MB). Photo displays across rosters and telemetry.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('firstName')} *
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g. Nikoloz"
              className="h-10 text-sm bg-slate-50/50 dark:bg-slate-800/50"
            />
            {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lastname" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('lastName')} *
            </Label>
            <Input
              id="lastname"
              {...register('lastname')}
              placeholder="e.g. Mskhalaia"
              className="h-10 text-sm bg-slate-50/50 dark:bg-slate-800/50"
            />
            {errors.lastname && <p className="text-xs text-rose-500">{errors.lastname.message}</p>}
          </div>
        </div>
      </div>

      {/* Athletic & Team Assignment */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-500" /> {t('academyDetails')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="teamId" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('assignTeam')} *
            </Label>
            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="teamId" className="h-10 text-sm bg-slate-50/50 dark:bg-slate-800/50">
                    <SelectValue placeholder={teamsLoading ? (t.has('loading') ? t('loading') : 'Loading...') : t('selectTeam')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {teams.map((t) => (
                      <SelectItem key={t._id} value={t._id} className="text-sm">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.teamId && <p className="text-xs text-rose-500">{errors.teamId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="position" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('position')} *
            </Label>
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger id="position" className="h-10 text-sm bg-slate-50/50 dark:bg-slate-800/50">
                    <SelectValue placeholder={t('selectPosition')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {POSITIONS.map((pos) => {
                      const keyMap: Record<string, string> = {
                        'Point Guard': 'pg',
                        'Shooting Guard': 'sg',
                        'Small Forward': 'sf',
                        'Power Forward': 'pf',
                        'Center': 'c',
                      };
                      return (
                        <SelectItem key={pos} value={pos} className="text-sm">
                          {t(`positions.${keyMap[pos]}`) || pos}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.position && <p className="text-xs text-rose-500">{errors.position.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jerseyNum" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('jerseyNum')} *
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="jerseyNum"
                type="number"
                min={0}
                max={99}
                {...register('jerseyNum')}
                className="pl-9 h-10 text-sm font-mono bg-slate-50/50 dark:bg-slate-800/50"
              />
            </div>
            {errors.jerseyNum && <p className="text-xs text-rose-500">{errors.jerseyNum.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="height" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('height')} (cm) *
            </Label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="height"
                type="number"
                min={80}
                max={250}
                {...register('height')}
                placeholder="e.g. 195"
                className="pl-9 h-10 text-sm font-mono bg-slate-50/50 dark:bg-slate-800/50"
              />
            </div>
            {errors.height && <p className="text-xs text-rose-500">{errors.height.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('dateOfBirth')} *
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
                className="pl-9 h-10 text-sm font-mono bg-slate-50/50 dark:bg-slate-800/50"
              />
            </div>
            {errors.dateOfBirth && <p className="text-xs text-rose-500">{errors.dateOfBirth.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tel" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Player Contact Phone *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="tel"
                type="tel"
                {...register('tel')}
                placeholder="+995 599 00 00 00"
                className="pl-9 h-10 text-sm font-mono bg-slate-50/50 dark:bg-slate-800/50"
              />
            </div>
            {errors.tel && <p className="text-xs text-rose-500">{errors.tel.message}</p>}
          </div>
        </div>
      </div>

      {/* Address & Guardian Contact */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-amber-500" /> {t('emergencyContact')}
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Residential Address *
            </Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="e.g. 24 Chavchavadze Ave, Vake, Tbilisi"
              className="h-10 text-sm bg-slate-50/50 dark:bg-slate-800/50"
            />
            {errors.address && <p className="text-xs text-rose-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="guardian" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('guardianRelationship')} *
              </Label>
              <Controller
                name="guardian"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || 'Mother'}>
                    <SelectTrigger id="guardian" className="h-10 text-sm bg-slate-50/50 dark:bg-slate-800/50">
                      <SelectValue placeholder="Select guardian type..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                    {GUARDIANS.map((g) => {
                      const gMap: Record<string, string> = {
                        'Mother': 'mother',
                        'Father': 'father',
                        'Other': 'other',
                      };
                      return (
                        <SelectItem key={g} value={g} className="text-sm">
                          {t(`guardians.${gMap[g]}`) || g}
                        </SelectItem>
                      );
                    })}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.guardian && <p className="text-xs text-rose-500">{errors.guardian.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guardianTel" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('guardianPhone')} *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="guardianTel"
                  type="tel"
                  {...register('guardianTel')}
                  placeholder="+995 599 11 22 33"
                  className="pl-9 h-10 text-sm font-mono bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              {errors.guardianTel && <p className="text-xs text-rose-500">{errors.guardianTel.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          asChild
          disabled={submitting}
          className="rounded-xl"
        >
          <Link href="/dashboard/admin/players">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> {t('cancel')}
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={submitting}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md rounded-xl"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              Saving Player Profile...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" /> {isEditing ? t('updatePlayer') : t('savePlayer')}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
