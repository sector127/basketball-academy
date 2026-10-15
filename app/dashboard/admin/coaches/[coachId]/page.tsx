'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
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
import {
  ShieldCheck,
  Mail,
  User,
  Phone,
  Calendar,
  Shield,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Power,
  Users,
  Award,
  BookOpen,
  MapPin,
  Clock,
  Trophy,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Player {
  _id: string;
  name: string;
  lastname: string;
  jerseyNum: number;
  position: string;
  height: number;
  isFirstTeam: boolean;
  profilePicture?: string;
}

interface AssignedTeam {
  _id: string;
  name: string;
  description: string;
  isHeadCoach: boolean;
  rosterCount: number;
  startersCount: number;
  players: Player[];
}

interface CoachEvent {
  _id: string;
  title: string;
  eventType: 'game' | 'practice' | 'individualTraining';
  startTime: string;
  endTime: string;
  venue?: { name: string; address?: string };
  gameResult?: {
    homeTeamScore: number;
    awayTeamScore: number;
    status: string;
  };
}

interface CoachData {
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
  createdAt?: string;
}

export default function CoachDetailsPage() {
  const t = useTranslations('Coaches');
  const tCommon = useTranslations('Common');
  const routeParams = useParams();
  const coachId = routeParams?.coachId as string;
  const router = useRouter();

  const [coach, setCoach] = useState<CoachData | null>(null);
  const [assignedTeams, setAssignedTeams] = useState<AssignedTeam[]>([]);
  const [totalAthletesCount, setTotalAthletesCount] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<CoachEvent[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit & Disable modal states
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDisableOpen, setIsDisableOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Uploads the photo right away and keeps the returned path for the save request
  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      setActionError(null);
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/uploads', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');
      setFormData((prev) => ({ ...prev, image: data.path }));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingImage(false);
    }
  };

  // Form state
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

  const fetchCoachDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/coaches/${coachId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch coach details');
      }
      const data = await res.json();
      setCoach(data.coach);
      setAssignedTeams(data.assignedTeams || []);
      setTotalAthletesCount(data.totalAthletesCount || 0);
      setRecentEvents(data.recentEvents || []);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error loading coach profile');
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    if (coachId) {
      fetchCoachDetails();
    }
  }, [coachId, fetchCoachDetails]);

  const handleOpenEdit = () => {
    if (!coach) return;
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

  const handleOpenToggleStatus = () => {
    setActionError(null);
    setIsDisableOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setActionError(null);

      const payload: Record<string, unknown> = { ...formData };
      if (!payload.password) delete payload.password;

      const res = await fetch(`/api/admin/coaches/${coachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update coach');

      setIsEditOpen(false);
      await fetchCoachDetails();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error updating coach');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitToggleStatus = async () => {
    if (!coach) return;
    try {
      setSubmitting(true);
      setActionError(null);

      const nextStatus = coach.isActive === false ? true : false;
      const res = await fetch(`/api/admin/coaches/${coachId}/disable`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      setIsDisableOpen(false);
      await fetchCoachDetails();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title={t('coachDetails')} subtitle={t('coachProfileSubtitle')} />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error || !coach) {
    return (
      <DashboardLayout>
        <PageHeader
          title={t('coachNotFound')}
          subtitle={t('coachNotFoundSubtitle')}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/coaches">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> {t('backToCoaches')}
              </Link>
            </Button>
          }
        />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error || 'Unable to locate coach record.'}
        </div>
      </DashboardLayout>
    );
  }

  const isCoachActive = coach.isActive !== false;

  return (
    <DashboardLayout>
      {/* Page Header */}
      <PageHeader
        title={`${coach.name} ${coach.lastName}`}
        subtitle={`${coach.specialty || t('headCoach')} • Brooklyn Basketball Academy`}
        badge={
          <StatusBadge
            status={isCoachActive ? 'active' : 'disabled'}
            label={isCoachActive ? t('active') : t('inactive')}
            variant={isCoachActive ? 'success' : 'destructive'}
          />
        }
        icon={ShieldCheck}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="shadow-xs">
              <Link href="/dashboard/admin/coaches">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> {t('backToCoaches')}
              </Link>
            </Button>

            <Button
              onClick={handleOpenEdit}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs"
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" /> {t('editCoach')}
            </Button>

            <Button
              onClick={handleOpenToggleStatus}
              variant="outline"
              size="sm"
              className={`shadow-xs ${
                isCoachActive
                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
              }`}
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              {isCoachActive ? t('disableCoach') : t('enableCoach')}
            </Button>
          </div>
        }
      />

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('assignedSquads')}
          value={assignedTeams.length}
          icon={Shield}
          description={t.has('coachSquadsDesc') ? t('coachSquadsDesc') : (t.has('assignedSquads') ? t('assignedSquads') : 'Competitive academy divisions under guidance')}
          trend={`${assignedTeams.filter((t) => t.isHeadCoach).length} Head Coach`}
          trendType="positive"
          accent="blue"
        />

        <StatCard
          title={t('athletesCoached')}
          value={totalAthletesCount}
          icon={Users}
          description="Active athletes in squads"
          trend="Under development"
          trendType="neutral"
          accent="gold"
        />

        <StatCard
          title={t('scheduledSessions')}
          value={recentEvents.length}
          icon={Calendar}
          description="Recent & upcoming events"
          trend="Practices & Games"
          trendType="positive"
          accent="emerald"
        />

        <StatCard
          title={t('status')}
          value={isCoachActive ? t('active') : t('inactive')}
          icon={ShieldCheck}
          description="Academy Portal Access"
          trend={isCoachActive ? 'Login Authorized' : 'Deactivated'}
          trendType={isCoachActive ? 'positive' : 'negative'}
          accent={isCoachActive ? 'emerald' : 'rose'}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left 1 Col: Coach Profile Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 text-center">
            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-2xl border-4 border-amber-500/20 shadow-lg">
              {coach.image ? (
                <Image
                  src={coach.image}
                  alt={`${coach.name} ${coach.lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <User className="h-14 w-14" />
                </div>
              )}
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
              {coach.name} {coach.lastName}
            </h2>
            <Badge
              variant="outline"
              className="mt-1 px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              {coach.specialty || t('headCoach')}
            </Badge>

            {coach.experience && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{coach.experience}</span>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-left space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">{coach.email}</span>
              </div>

              {coach.phone && (
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{coach.phone}</span>
                </div>
              )}

              {coach.createdAt && (
                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    Joined: {new Date(coach.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {coach.bio && (
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t('bio')}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {coach.bio}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Assigned Squads & Rosters + Recent Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Squads & Rosters */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('assignedSquads')} ({assignedTeams.length})
                </h3>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {assignedTeams.length > 0 ? (
                assignedTeams.map((team) => (
                  <div
                    key={team._id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {team.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              team.isHeadCoach
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {team.isHeadCoach ? t('headCoach') : t('trainer')}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {team.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {team.rosterCount} {t('athletesCoached')} ({team.startersCount} Starters)
                        </span>
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold">
                          <Link href={`/dashboard/admin/teams/${team._id}`}>
                            Roster & Court Lineup <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Preview Roster Grid */}
                    {team.players.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Active Squad Roster:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {team.players.map((p) => (
                            <Link
                              key={p._id}
                              href={`/dashboard/admin/players/${p._id}`}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs hover:border-amber-500/40 transition-colors"
                            >
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                #{p.jerseyNum}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {p.name} {p.lastname}
                              </span>
                              {p.isFirstTeam && (
                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-500">
                  {t('noAssignedSquads')}
                </p>
              )}
            </div>
          </div>

          {/* Recent & Upcoming Sessions */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('recentSessions')} ({recentEvents.length})
                </h3>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Link href="/dashboard/admin/calendar">
                  Open Master Calendar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {recentEvents.length > 0 ? (
                recentEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={ev.eventType === 'game' ? 'scheduled' : 'active'}
                          label={
                            ev.eventType === 'game'
                              ? 'Match Fixture'
                              : ev.eventType === 'practice'
                              ? 'Practice Session'
                              : 'Skill Workout'
                          }
                          variant={ev.eventType === 'game' ? 'gold' : 'info'}
                        />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {ev.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ev.venue?.name || 'BBA Main Arena'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {new Date(ev.startTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(ev.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-500">
                  {t('noSessions')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
                <Label htmlFor="det-edit-name" className="text-xs font-semibold">
                  {t('firstName')} *
                </Label>
                <Input
                  id="det-edit-name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="det-edit-lastName" className="text-xs font-semibold">
                  {t('lastName')} *
                </Label>
                <Input
                  id="det-edit-lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="det-edit-email" className="text-xs font-semibold">
                  {t('email')} *
                </Label>
                <Input
                  id="det-edit-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="det-edit-password" className="text-xs font-semibold">
                  {t('password')} (Optional)
                </Label>
                <Input
                  id="det-edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep unchanged"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="det-edit-phone" className="text-xs font-semibold">
                  {t('phone')}
                </Label>
                <Input
                  id="det-edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="det-edit-specialty" className="text-xs font-semibold">
                  {t('specialty')}
                </Label>
                <Input
                  id="det-edit-specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="det-edit-experience" className="text-xs font-semibold">
                {t('experience')}
              </Label>
              <Input
                id="det-edit-experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="det-edit-image" className="text-xs font-semibold">
                {t('avatarUrl')}
              </Label>
              <div className="flex items-center gap-3">
                {formData.image && (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <Image src={formData.image} alt="" fill className="object-cover" />
                  </div>
                )}
                <Input
                  id="det-edit-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingImage}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="det-edit-bio" className="text-xs font-semibold">
                {t('bio')}
              </Label>
              <textarea
                id="det-edit-bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="det-edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded-md border-slate-300 text-amber-500 focus:ring-amber-500/40"
              />
              <Label htmlFor="det-edit-isActive" className="text-xs font-medium cursor-pointer">
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
                disabled={submitting || uploadingImage}
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
              {isCoachActive ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              <DialogTitle className="text-base font-bold">
                {isCoachActive ? t('confirmDisable') : t('confirmEnable')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              {isCoachActive
                ? t('confirmDisableDesc', { name: `${coach.name} ${coach.lastName}` })
                : t('confirmEnableDesc', { name: `${coach.name} ${coach.lastName}` })}
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
                isCoachActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {submitting
                ? t('saving')
                : isCoachActive
                ? t('disableCoach')
                : t('enableCoach')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
