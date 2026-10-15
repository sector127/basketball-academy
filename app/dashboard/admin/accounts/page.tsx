'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Loader from '@/components/Loader';
import { useToast } from '@/hooks/use-toast';
import { Check, KeyRound, Link2, Plus, Power, Search, Trash2, UserCog, Users, X } from 'lucide-react';

type Role = 'staff' | 'player' | 'guardian';

interface LinkedPlayer {
  _id: string;
  name: string;
  lastname: string;
  jerseyNum?: number;
  isActive?: boolean;
  team?: { _id: string; name: string } | null;
}

interface Account {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  pendingApproval?: boolean;
  registrationNote?: string;
  passwordResetRequestedAt?: string | null;
  players?: LinkedPlayer[];
  createdAt?: string;
}

interface AccountForm {
  name: string;
  lastName: string;
  email: string;
  role: Role;
  password: string;
  players: string[];
}

type Filter = 'all' | 'pending' | 'reset';

const EMPTY_FORM: AccountForm = { name: '', lastName: '', email: '', role: 'guardian', password: '', players: [] };

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

export default function AccountsPage() {
  const t = useTranslations('Accounts');
  const { toast } = useToast();
  const { data: accounts, error, isLoading, mutate } = useSWR<Account[]>('/api/admin/users', fetcher);
  const { data: allPlayers } = useSWR<LinkedPlayer[]>('/api/admin/players?all=true', fetcher);

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Account | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [playerSearch, setPlayerSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Account | null>(null);

  const list = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts]);
  const pendingCount = list.filter((a) => a.pendingApproval).length;
  const resetCount = list.filter((a) => a.passwordResetRequestedAt).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((a) => {
      if (filter === 'pending' && !a.pendingApproval) return false;
      if (filter === 'reset' && !a.passwordResetRequestedAt) return false;
      if (!q) return true;
      return `${a.name} ${a.lastName} ${a.email}`.toLowerCase().includes(q);
    });
  }, [list, filter, search]);

  const playerOptions = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    return (Array.isArray(allPlayers) ? allPlayers : [])
      .filter((p) => !q || `${p.name} ${p.lastname} ${p.team?.name || ''}`.toLowerCase().includes(q))
      .sort((a, b) => `${a.name} ${a.lastname}`.localeCompare(`${b.name} ${b.lastname}`));
  }, [allPlayers, playerSearch]);

  useEffect(() => {
    if (!editing && !isCreateOpen) {
      setFormError(null);
      setPlayerSearch('');
    }
  }, [editing, isCreateOpen]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsCreateOpen(true);
  };

  const openEdit = (account: Account) => {
    setForm({
      name: account.name,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
      password: '',
      players: (account.players || []).map((p) => p._id),
    });
    setEditing(account);
  };

  const request = useCallback(
    async (url: string, method: string, body?: unknown) => {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('actionFailed'));
      await mutate();
      return data;
    },
    [mutate, t]
  );

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast({ title: successMessage, variant: 'newSuccess' });
    } catch (err) {
      toast({ title: t('actionFailed'), description: err instanceof Error ? err.message : '', variant: 'destructive' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          lastName: form.lastName,
          role: form.role,
          players: form.players,
        };
        if (form.password) payload.password = form.password;
        await request(`/api/admin/users/${editing._id}`, 'PATCH', payload);
        setEditing(null);
        toast({ title: t('accountUpdated'), variant: 'newSuccess' });
      } else {
        await request('/api/admin/users', 'POST', form);
        setIsCreateOpen(false);
        toast({ title: t('accountCreated'), variant: 'newSuccess' });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlayer = (playerId: string) => {
    setForm((prev) => ({
      ...prev,
      players: prev.players.includes(playerId)
        ? prev.players.filter((id) => id !== playerId)
        : [...prev.players, playerId],
    }));
  };

  const roleLabel = (role: Role) => t(`roles.${role}`);

  const renderStatus = (account: Account) => {
    if (account.pendingApproval) return <StatusBadge status="pending" label={t('statusPending')} variant="warning" />;
    if (account.isActive === false) return <StatusBadge status="disabled" label={t('statusDisabled')} variant="destructive" />;
    return <StatusBadge status="active" label={t('statusActive')} variant="success" />;
  };

  const isDialogOpen = isCreateOpen || Boolean(editing);
  const canLinkPlayers = form.role === 'player' || form.role === 'guardian';

  return (
    <DashboardLayout>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        badge={pendingCount > 0 ? t('pendingBadge', { count: pendingCount }) : t('countBadge', { count: list.length })}
        icon={UserCog}
        actions={
          <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> {t('addAccount')}
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', t('filterAll'), list.length],
              ['pending', t('filterPending'), pendingCount],
              ['reset', t('filterReset'), resetCount],
            ] as [Filter, string, number][]
          ).map(([value, label, count]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? 'default' : 'outline'}
              onClick={() => setFilter(value)}
              className="rounded-xl text-xs"
            >
              {label} <span className="ml-1.5 opacity-70">{count}</span>
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {t('loadFailed')}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Users} title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((account) => (
            <div
              key={account._id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                    {account.name} {account.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{account.email}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <StatusBadge status={account.role} label={roleLabel(account.role)} variant="neutral" dot={false} />
                  {renderStatus(account)}
                </div>
              </div>

              {account.passwordResetRequestedAt && (
                <p className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  <KeyRound className="h-3.5 w-3.5" />
                  {t('resetRequested', { date: new Date(account.passwordResetRequestedAt).toLocaleDateString() })}
                </p>
              )}

              {account.registrationNote && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs italic text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  “{account.registrationNote}”
                </p>
              )}

              {(account.role === 'player' || account.role === 'guardian') && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Link2 className="h-3.5 w-3.5 text-slate-400" />
                  {account.players && account.players.length > 0 ? (
                    account.players.map((p) => (
                      <span
                        key={p._id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {p.name} {p.lastname}
                        {p.team?.name ? ` · ${p.team.name}` : ''}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">{t('noLinkedPlayers')}</span>
                  )}
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {account.pendingApproval ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        runAction(() => request(`/api/admin/users/${account._id}`, 'PATCH', { approve: true }), t('approved'))
                      }
                      className="bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> {t('approve')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setToDelete(account)} className="text-xs text-rose-600">
                      <X className="mr-1 h-3.5 w-3.5" /> {t('reject')}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runAction(
                        () => request(`/api/admin/users/${account._id}`, 'PATCH', { isActive: account.isActive === false }),
                        account.isActive === false ? t('enabled') : t('disabled')
                      )
                    }
                    className="text-xs"
                  >
                    <Power className="mr-1 h-3.5 w-3.5" /> {account.isActive === false ? t('enable') : t('disable')}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(account)} className="text-xs">
                  <UserCog className="mr-1 h-3.5 w-3.5" /> {t('edit')}
                </Button>
                {!account.pendingApproval && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setToDelete(account)}
                    className="ml-auto text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    aria-label={t('delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setIsCreateOpen(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('editTitle') : t('createTitle')}</DialogTitle>
            <DialogDescription>{editing ? editing.email : t('createDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="acc-name" className="text-xs font-semibold">{t('firstName')}</Label>
                <Input id="acc-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="acc-last" className="text-xs font-semibold">{t('lastName')}</Label>
                <Input id="acc-last" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="h-9 text-xs" />
              </div>
            </div>

            {!editing && (
              <div className="space-y-1">
                <Label htmlFor="acc-email" className="text-xs font-semibold">{t('email')}</Label>
                <Input id="acc-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-xs" />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="acc-role" className="text-xs font-semibold">{t('role')}</Label>
                <select
                  id="acc-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                >
                  <option value="guardian">{roleLabel('guardian')}</option>
                  <option value="player">{roleLabel('player')}</option>
                  <option value="staff">{roleLabel('staff')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="acc-password" className="text-xs font-semibold">
                  {editing ? t('newPassword') : t('password')}
                </Label>
                <Input
                  id="acc-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required={!editing}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? t('newPasswordPlaceholder') : t('passwordPlaceholder')}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {canLinkPlayers && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {form.role === 'guardian' ? t('linkedChildren') : t('linkedPlayer')}{' '}
                  <span className="font-normal text-slate-400">({form.players.length})</span>
                </Label>
                <Input
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder={t('searchPlayers')}
                  className="h-8 text-xs"
                />
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-800">
                  {playerOptions.length === 0 ? (
                    <p className="py-2 text-center text-xs text-slate-400">{t('noPlayersFound')}</p>
                  ) : (
                    playerOptions.map((p) => (
                      <label
                        key={p._id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <input
                          type="checkbox"
                          checked={form.players.includes(p._id)}
                          onChange={() => togglePlayer(p._id)}
                          className="h-3.5 w-3.5 accent-amber-500"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {p.name} {p.lastname}
                        </span>
                        <span className="text-slate-400">
                          {p.jerseyNum !== undefined ? `#${p.jerseyNum}` : ''} {p.team?.name || ''}
                          {p.isActive === false ? ` · ${t('inactivePlayer')}` : ''}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {formError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{formError}</p>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setIsCreateOpen(false);
                }}
                className="text-xs"
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-500 text-xs font-semibold text-slate-950 hover:bg-amber-600">
                {submitting ? t('saving') : editing ? t('save') : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject / delete confirmation */}
      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{toDelete?.pendingApproval ? t('rejectTitle') : t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDescription', { name: `${toDelete?.name ?? ''} ${toDelete?.lastName ?? ''}`.trim() })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} className="rounded-xl text-xs">
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                const account = toDelete;
                setToDelete(null);
                if (account) {
                  runAction(
                    () => request(`/api/admin/users/${account._id}`, 'DELETE'),
                    account.pendingApproval ? t('rejected') : t('deleted')
                  );
                }
              }}
              className="rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
            >
              {toDelete?.pendingApproval ? t('reject') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
