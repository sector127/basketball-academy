'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import Image from 'next/image';
import TeamAddEditForm from '@/components/TeamAddEditForm';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import Loader from '@/components/Loader';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { register, handleSubmit, setValue, reset } = useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const onSubmit = async (data) => {
    try {
      const url = isEditing ? `/api/admin/teams/${currentTeamId}` : '/api/admin/teams';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} team`);
      }

      toast({
        title: isEditing ? 'Team updated' : 'Team created',
        description: `Successfully ${isEditing ? 'updated' : 'created'} team.`,
        variant: 'default',
      });

      setIsDialogOpen(false);
      reset();
      fetchTeams();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (team) => {
    setIsEditing(true);
    setCurrentTeamId(team._id);
    setValue('name', team.name);
    setValue('description', team.description);
    setValue('coach', team.coach?._id || team.coach || '');
    setValue('assistantCoach', team.assistantCoach?._id || team.assistantCoach || '');
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setIsEditing(false);
    setCurrentTeamId(null);
    reset();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Teams Management" subtitle="Manage academy rosters and competitive divisions" />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Teams Management" subtitle="Manage academy rosters and competitive divisions" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Teams Management"
        subtitle="Manage academy squads, assign coaches, and view rosters"
        badge={`${teams.length} Teams`}
        icon={Shield}
        actions={
          <Button onClick={handleCreateClick} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> Create Team
          </Button>
        }
      />

      {/* Add / Edit Team Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Team Details' : 'Create New Team'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update team title, description, or assigned coaching staff.'
                : 'Configure a new squad division in the academy.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <TeamAddEditForm
              register={register}
              setValue={setValue}
              initialValues={isEditing ? teams.find((t) => t._id === currentTeamId) : null}
            />

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                {isEditing ? 'Save Changes' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                      Roster
                    </span>
                  </div>

                  <div className="my-4 flex h-32 w-full items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                    <Image
                      src="/assets/images/logo.png"
                      alt="BBA logo"
                      width={90}
                      height={90}
                      className="object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(team)}
                    className="text-xs"
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>

                  <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-sm">
                    <Link href={`/dashboard/admin/teams/${team._id}`}>
                      View Roster <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title="No teams configured"
            description="Create your first basketball academy squad to start managing rosters."
            actionText="Create Team"
            onAction={handleCreateClick}
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
