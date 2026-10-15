'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Loader from '@/components/Loader';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Mail,
  User,
  Plus,
  Edit2,
  Power,
  Search,
  Phone,
  Award,
  ArrowRight,
  Shield,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AssignedTeam {
  _id: string;
  name: string;
  description?: string;
  coach?: string;
  assistantCoach?: string;
}

interface Coach {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  role: string;
  image?: string;
  isActive: boolean;
  phone?: string;
  specialty?: string;
  bio?: string;
  experience?: string;
  assignedTeams?: AssignedTeam[];
  createdAt?: string;
}

export default function CoachesPage() {
  const t = useTranslations('Coaches');
  const tCommon = useTranslations('Common');

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDisableOpen, setIsDisableOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active coach being edited or disabled
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  // Form fields state
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specialty: 'Head Coach',
    experience: '',
    image: '',
    bio: '',
    isActive: true,
  });

  const fetchCoaches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coaches?all=true');
      if (!res.ok) {
        throw new Error('Failed to fetch coaches');
      }
      const data = await res.json();
      setCoaches(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error loading coaching staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  // Filtered coaches
  const filteredCoaches = useMemo(() => {
    return coaches.filter((coach) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? coach.isActive !== false
          : coach.isActive === false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${coach.name} ${coach.lastName}`.toLowerCase().includes(q) ||
        (coach.email || '').toLowerCase().includes(q) ||
        (coach.specialty || '').toLowerCase().includes(q) ||
        (coach.phone || '').toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [coaches, searchQuery, statusFilter]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      specialty: 'Head Coach',
      experience: '',
      image: '',
      bio: '',
      isActive: true,
    });
    setActionError(null);
    setIsAddOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (coach: Coach) => {
    setSelectedCoach(coach);
    setFormData({
      name: coach.name || '',
      lastName: coach.lastName || '',
      email: coach.email || '',
      password: '',
      phone: coach.phone || '',
      specialty: coach.specialty || 'Head Coach',
      experience: coach.experience || '',
      image: coach.image || '',
      bio: coach.bio || '',
      isActive: coach.isActive !== false,
    });
    setActionError(null);
    setIsEditOpen(true);
  };

  // Open Disable / Enable Dialog
  const handleOpenToggleStatus = (coach: Coach) => {
    setSelectedCoach(coach);
    setActionError(null);
    setIsDisableOpen(true);
  };

  // Submit Add Coach
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch('/api/admin/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create coach');
      }

      setIsAddOpen(false);
      await fetchCoaches();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error creating coach');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Coach
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach) return;

    try {
      setSubmitting(true);
      setActionError(null);

      const payload: Record<string, unknown> = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      const res = await fetch(`/api/admin/coaches/${selectedCoach._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update coach');
      }

      setIsEditOpen(false);
      await fetchCoaches();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error updating coach');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Toggle Active Status (Disable/Enable)
  const handleSubmitToggleStatus = async () => {
    if (!selectedCoach) return;

    try {
      setSubmitting(true);
      setActionError(null);

      const nextStatus = selectedCoach.isActive === false ? true : false;
      const res = await fetch(`/api/admin/coaches/${selectedCoach._id}/disable`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update coach status');
      }

      setIsDisableOpen(false);
      await fetchCoaches();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error updating coach status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && coaches.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader title={t('staffTitle')} subtitle={t('loadingCoaches')} />
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={t('staffTitle')}
        subtitle={t('staffSubtitle')}
        badge={`${coaches.length} ${t('title')}`}
        icon={ShieldCheck}
        actions={
          <Button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="mr-1.5 h-4 w-4" /> {t('addCoach')}
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 mb-6">
          {error}
        </div>
      )}

      {/* Search & Status Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/90 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchCoaches')}
            className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {tCommon('all')} ({coaches.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t('active')} ({coaches.filter((c) => c.isActive !== false).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'inactive'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t('inactive')} ({coaches.filter((c) => c.isActive === false).length})
          </button>
        </div>
      </div>

      {/* Coaches Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {filteredCoaches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCoaches.map((coach) => {
              const isCoachActive = coach.isActive !== false;
              const assignedTeams = coach.assignedTeams || [];

              return (
                <div
                  key={coach._id}
                  className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900/90 ${
                    isCoachActive
                      ? 'border-slate-200/80 hover:border-amber-500/40 dark:border-slate-800'
                      : 'border-slate-200/50 bg-slate-50/50 opacity-75 dark:border-slate-800/60 dark:bg-slate-950/40'
                  }`}
                >
                  {/* Top Status & Role Bar */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 truncate max-w-[130px]"
                      >
                        {coach.specialty || t('headCoach')}
                      </Badge>

                      <StatusBadge
                        status={isCoachActive ? 'active' : 'disabled'}
                        label={isCoachActive ? t('active') : t('inactive')}
                        variant={isCoachActive ? 'success' : 'destructive'}
                      />
                    </div>

                    {/* Avatar & Coach Name */}
                    <div className="flex flex-col items-center text-center my-3">
                      <Link
                        href={`/dashboard/admin/coaches/${coach._id}`}
                        className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-amber-500/30 shadow-md transition-transform duration-300 group-hover:scale-105 block"
                      >
                        {coach.image ? (
                          <Image
                            src={coach.image}
                            alt={`${coach.name} ${coach.lastName}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                            <User className="h-10 w-10" />
                          </div>
                        )}
                      </Link>

                      <Link
                        href={`/dashboard/admin/coaches/${coach._id}`}
                        className="mt-3 block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                      >
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {coach.name} {coach.lastName}
                        </h3>
                      </Link>

                      {coach.experience && (
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {coach.experience}
                        </p>
                      )}
                    </div>

                    {/* Contact Telemetry */}
                    <div className="space-y-1.5 my-3 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{coach.email}</span>
                      </div>
                      {coach.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono truncate">{coach.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Squads Preview */}
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {t('assignedTeams')}:
                      </p>
                      {assignedTeams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedTeams.map((team) => (
                            <Link
                              key={team._id}
                              href={`/dashboard/admin/teams/${team._id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                            >
                              <Shield className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{team.name}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          {t('noAssignedSquads')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold px-2.5 shadow-2xs hover:border-amber-500/40"
                    >
                      <Link href={`/dashboard/admin/coaches/${coach._id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5 text-amber-500" />
                        {t('viewProfile')}
                      </Link>
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleOpenEdit(coach)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                        title={t('editCoach')}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="sr-only">{t('editCoach')}</span>
                      </Button>

                      <Button
                        onClick={() => handleOpenToggleStatus(coach)}
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          isCoachActive
                            ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                        title={isCoachActive ? t('disableCoach') : t('enableCoach')}
                      >
                        <Power className="h-3.5 w-3.5" />
                        <span className="sr-only">
                          {isCoachActive ? t('disableCoach') : t('enableCoach')}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title={t('noCoaches')}
            description={t('noCoachesDesc')}
            actionText={t('addCoach')}
            onAction={handleOpenAdd}
          />
        )}
      </motion.div>

      {/* ADD COACH DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {t('createCoachTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t('createCoachSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {actionError}
            </div>
          )}

          <form onSubmit={handleSubmitAdd} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold">
                  {t('firstName')} *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nikoloz"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs font-semibold">
                  {t('lastName')} *
                </Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Mskhalaia"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold">
                  {t('email')} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="coach@bba.ge"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-semibold">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('passwordPlaceholder')}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  {t('phone')}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+995 599 000 000"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="specialty" className="text-xs font-semibold">
                  {t('specialty')}
                </Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder={t('specialtyPlaceholder')}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="experience" className="text-xs font-semibold">
                {t('experience')}
              </Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder={t('experiencePlaceholder')}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="image" className="text-xs font-semibold">
                {t('avatarUrl')}
              </Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="/uploads/coach.jpg or https://..."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio" className="text-xs font-semibold">
                {t('bio')}
              </Label>
              <textarea
                id="bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('bioPlaceholder')}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs"
              >
                {submitting ? t('saving') : t('createCoach')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT COACH DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {t('editCoachTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t('editCoachSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {actionError}
            </div>
          )}

          <form onSubmit={handleSubmitEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  {t('firstName')} *
                </Label>
                <Input
                  id="edit-name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-lastName" className="text-xs font-semibold">
                  {t('lastName')} *
                </Label>
                <Input
                  id="edit-lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-email" className="text-xs font-semibold">
                  {t('email')} *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-password" className="text-xs font-semibold">
                  {t('password')} (Optional)
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty to keep current"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-phone" className="text-xs font-semibold">
                  {t('phone')}
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-specialty" className="text-xs font-semibold">
                  {t('specialty')}
                </Label>
                <Input
                  id="edit-specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-experience" className="text-xs font-semibold">
                {t('experience')}
              </Label>
              <Input
                id="edit-experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-image" className="text-xs font-semibold">
                {t('avatarUrl')}
              </Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-bio" className="text-xs font-semibold">
                {t('bio')}
              </Label>
              <textarea
                id="edit-bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded-md border-slate-300 text-amber-500 focus:ring-amber-500/40"
              />
              <Label htmlFor="edit-isActive" className="text-xs font-medium cursor-pointer">
                {t('active')} — Allow coach portal login and squad management
              </Label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs"
              >
                {submitting ? t('updating') : t('updateCoach')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DISABLE / ENABLE DIALOG */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedCoach?.isActive !== false ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              <DialogTitle className="text-base font-bold">
                {selectedCoach?.isActive !== false
                  ? t('confirmDisable')
                  : t('confirmEnable')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              {selectedCoach?.isActive !== false
                ? t('confirmDisableDesc', {
                    name: `${selectedCoach?.name} ${selectedCoach?.lastName}`,
                  })
                : t('confirmEnableDesc', {
                    name: `${selectedCoach?.name} ${selectedCoach?.lastName}`,
                  })}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {actionError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisableOpen(false)}
              disabled={submitting}
              className="text-xs"
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmitToggleStatus}
              disabled={submitting}
              className={`text-xs font-semibold ${
                selectedCoach?.isActive !== false
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {submitting
                ? t('saving')
                : selectedCoach?.isActive !== false
                ? t('disableCoach')
                : t('enableCoach')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
