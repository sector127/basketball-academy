'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UseFormRegister, UseFormSetValue, FieldValues, Path, PathValue } from 'react-hook-form';

export interface CoachOption {
  _id: string;
  name?: string;
  lastName?: string;
}

export interface TeamFormInitialValues {
  name?: string;
  description?: string;
  coach?: string;
}

export interface TeamAddEditFormProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  initialValues?: TeamFormInitialValues | null;
}

export default function TeamAddEditForm<T extends FieldValues = FieldValues>({
  register,
  setValue,
  initialValues,
}: TeamAddEditFormProps<T>) {
  const t = useTranslations('Teams');
  const [coaches, setCoaches] = useState<CoachOption[]>([]);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await fetch('/api/admin/coaches');
        const data: CoachOption[] = await response.json();
        setCoaches(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        console.error('Error fetching coach:', error);
      }
    };
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (initialValues) {
      setValue('name' as Path<T>, (initialValues.name || '') as PathValue<T, Path<T>>);
      setValue('description' as Path<T>, (initialValues.description || '') as PathValue<T, Path<T>>);
      setValue('coach' as Path<T>, (initialValues.coach || '') as PathValue<T, Path<T>>);
    } else {
      setValue('name' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('description' as Path<T>, '' as PathValue<T, Path<T>>);
      setValue('coach' as Path<T>, '' as PathValue<T, Path<T>>);
    }
  }, [initialValues, setValue]);

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>{t('teamDetails')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('teamName')}</Label>
          <Input id="name" {...register('name' as Path<T>)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('teamDescription')}</Label>
          <Input id="description" {...register('description' as Path<T>)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coach">{t('coach')}</Label>
          <Select
            onValueChange={(value) => setValue('coach' as Path<T>, value as PathValue<T, Path<T>>)}
            defaultValue={initialValues?.coach}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectCoach')} />
            </SelectTrigger>
            <SelectContent>
              {coaches.map((coach) => (
                <SelectItem key={coach._id} value={coach._id}>
                  {coach.name} {coach.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </div>
  );
}
