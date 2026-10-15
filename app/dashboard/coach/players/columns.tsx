'use client';

import React, { useState } from 'react';
import { createColumnHelper, type ColumnDef, type HeaderContext } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown as LuArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GoStar, GoStarFill } from '@/components/icons/navIcons';
import { ToastAction } from '@/components/ui/toast';
import { mutate } from 'swr';
import { useTranslations } from 'next-intl';

export interface CoachPlayerRowData {
  _id: string;
  name: string;
  lastname: string;
  position?: string;
  age?: number;
  height?: number;
  isFirstTeam?: boolean;
  team?: {
    _id: string;
    name: string;
  };
  guardian?: string;
  guardianTel?: string;
}

export type CoachPlayerColumnsCallbacks =
  | {
      onToggleFirstTeam?: (playerId: string, teamId: string, isFirstTeam: boolean) => Promise<void> | void;
      [key: string]: unknown;
    }
  | ((...args: unknown[]) => Promise<void> | void)
  | unknown[]
  | null;

const columnHelper = createColumnHelper<CoachPlayerRowData>();

const NameHeader = () => {
  const t = useTranslations('Players');
  return <span>{t('fullName')}</span>;
};

const AgeHeader = ({ column }: HeaderContext<CoachPlayerRowData, unknown>) => {
  const t = useTranslations('Players');
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="-ml-5"
    >
      {t('dateOfBirth')}
      <LuArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const HeightHeader = ({ column }: HeaderContext<CoachPlayerRowData, unknown>) => {
  const t = useTranslations('Players');
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="-ml-8"
    >
      {t('height')}
      <LuArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const TeamHeader = () => {
  const t = useTranslations('Players');
  return <span>{t('teams')}</span>;
};

const GuardianHeader = () => {
  const t = useTranslations('Players');
  return <span>{t('guardianName')}</span>;
};

export const columns = (callbacks?: CoachPlayerColumnsCallbacks, context?: string): ColumnDef<CoachPlayerRowData, unknown>[] => {
  const FullNameCell = ({ row }: { row: { original: CoachPlayerRowData } }) => {
    const { toast } = useToast();
    const player = row.original;
    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    const handleToggleFirstTeam = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsAnimating(true);

      if (!player.team?._id) return;

      try {
        const response = await fetch(`/api/coach/teams/${player.team._id}/firstTeam`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playerId: player._id, isFirstTeam: !player.isFirstTeam }),
        });

        if (!response.ok) {
          const data: { error?: string } = await response.json();
          const errorMsg = data.error || 'Failed to update starter status';
          toast({
            title: 'Failed to update first team status',
            description: errorMsg,
            variant: 'destructive',
            action: errorMsg.startsWith('A player with the position') ? (
              <ToastAction
                altText="Edit Player"
                onClick={() => router.push(`/dashboard/coach/players/edit/${player._id}`)}
              >
                Edit
              </ToastAction>
            ) : undefined,
          });
          setIsAnimating(false);
          return;
        }

        const data: { message?: string } = await response.json();
        player.isFirstTeam = !player.isFirstTeam;

        toast({
          title: 'First team status updated',
          description: data.message,
          variant: 'info',
        });
        await mutate(`/api/coach/teams/${player.team._id}`);

        if (callbacks && typeof callbacks === 'object' && 'onToggleFirstTeam' in callbacks && typeof callbacks.onToggleFirstTeam === 'function') {
          await callbacks.onToggleFirstTeam(player._id, player.team._id, player.isFirstTeam);
        }

        setTimeout(() => setIsAnimating(false), 300);
      } catch (error: unknown) {
        console.error('Error updating first team status:', error);
        setIsAnimating(false);
        player.isFirstTeam = !player.isFirstTeam;
      }
    };

    const position = row.original.position;
    return (
      <div className="flex justify-between">
        <div>
          <div>{`${row.original.name} ${row.original.lastname}`}</div>
          {position && <div className="text-xs text-gray-500">{position}</div>}
        </div>
        {context === 'team' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="m-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1 transition-colors"
                  onClick={handleToggleFirstTeam}
                  onMouseDown={() => setIsAnimating(true)}
                  aria-label="Toggle Starter Status"
                >
                  {player.isFirstTeam ? (
                    <GoStarFill
                      color="#FFD700"
                      size={16}
                      className={isAnimating ? 'animate-starScale' : ''}
                    />
                  ) : (
                    <GoStar
                      size={16}
                      className={isAnimating ? 'animate-starScale' : 'text-slate-400'}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>First Team Starter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  const coreColumns: ColumnDef<CoachPlayerRowData, unknown>[] = [
    columnHelper.accessor((row) => `${row.name} ${row.lastname}`, {
      id: 'fullName',
      header: NameHeader,
      cell: ({ row }) => <FullNameCell row={row} />,
    }) as ColumnDef<CoachPlayerRowData, unknown>,
    columnHelper.accessor('age', {
      header: AgeHeader,
      enableSorting: true,
    }) as ColumnDef<CoachPlayerRowData, unknown>,
    columnHelper.accessor('height', {
      header: HeightHeader,
      enableSorting: true,
    }) as ColumnDef<CoachPlayerRowData, unknown>,
    columnHelper.accessor('team.name', {
      id: 'team',
      header: TeamHeader,
      cell: ({ row }) => {
        const teamName = row.original.team?.name || '-';
        return <span>{teamName}</span>;
      },
    }) as ColumnDef<CoachPlayerRowData, unknown>,
  ];

  const guardianColumn = columnHelper.accessor('guardian', {
    header: GuardianHeader,
    cell: ({ row }) => {
      const guardian = row.original.guardian;
      const guardianTel = row.original.guardianTel;
      return (
        <div>
          <div>{guardian}</div>
          <div className="text-xs text-gray-500">{guardianTel}</div>
        </div>
      );
    },
  }) as ColumnDef<CoachPlayerRowData, unknown>;

  const cols = [...coreColumns];

  if (context === 'players') {
    const teamColumnIndex = cols.findIndex((col) => col.id === 'team');
    cols.splice(teamColumnIndex + 1, 0, guardianColumn);
  }

  return cols;
};
