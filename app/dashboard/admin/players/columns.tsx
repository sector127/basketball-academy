'use client';

import React, { useState } from 'react';
import { createColumnHelper, type ColumnDef, type HeaderContext } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown as LuArrowUpDown, MoreHorizontal as LuMoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GoStar, GoStarFill, FaUserEdit, FaUserMinus } from '@/components/icons/navIcons';
import { ToastAction } from '@/components/ui/toast';
import { mutate } from 'swr';
import { useTranslations } from 'next-intl';

export interface PlayerRowData {
  _id: string;
  name: string;
  lastname: string;
  position?: string;
  age?: number;
  height?: number;
  jerseyNum?: number;
  isFirstTeam?: boolean;
  team?: {
    _id: string;
    name: string;
  };
  guardian?: string;
  guardianTel?: string;
  select?: boolean;
}

export type PlayerColumnsCallbacks =
  | {
      onPlayerDisable?: (playerId: string) => Promise<void> | void;
      onToggleFirstTeam?: (playerId: string, teamId: string, isFirstTeam: boolean) => Promise<void> | void;
      [key: string]: unknown;
    }
  | ((...args: unknown[]) => Promise<void> | void)
  | unknown[]
  | null;

const columnHelper = createColumnHelper<PlayerRowData>();

const NameHeader = () => {
  const t = useTranslations('Players');
  return <span>{t('fullName')}</span>;
};

const AgeHeader = ({ column }: HeaderContext<PlayerRowData, unknown>) => {
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

const HeightHeader = ({ column }: HeaderContext<PlayerRowData, unknown>) => {
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

export const columns = (callbacks?: PlayerColumnsCallbacks, context?: string): ColumnDef<PlayerRowData, unknown>[] => {
  const selectColumn = columnHelper.accessor('select', {
    header: ({ table }) => {
      return (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
          }}
          aria-label="Select all"
        />
      );
    },
    cell: ({ row }) => {
      return (
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  });

  const ActionsCell = ({ row }: { row: { original: PlayerRowData } }) => {
    const t = useTranslations('Players');
    const player = row.original;
    const router = useRouter();
    const { toast } = useToast();
    const [openDialog, setOpenDialog] = useState(false);

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/dashboard/admin/players/edit/${player._id}`);
    };

    const handleDisablePlayer = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(
          `/api/admin/players/${player._id}/disable/`,
          {
            method: 'PATCH',
          }
        );

        if (!response.ok) {
          toast({
            title: 'Failed to disable player',
            description: 'Player could not be disabled',
            variant: 'destructive',
          });
          throw new Error('Failed to disable player');
        }

        if (callbacks && typeof callbacks === 'object' && 'onPlayerDisable' in callbacks && typeof callbacks.onPlayerDisable === 'function') {
          await callbacks.onPlayerDisable(player._id);
        } else if (typeof callbacks === 'function') {
          await (callbacks as (id: string) => Promise<void> | void)(player._id);
        }

        toast({
          title: 'Player profile disabled',
          description: 'Profile has been disabled successfully',
          variant: 'newSuccess',
        });
        setOpenDialog(false);
      } catch (error: unknown) {
        console.error('Error disabling player:', error);
      }
    };

    const handleOpenDialog = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenDialog(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenDialog(false);
    };

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <LuMoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleEdit}
              className="flex justify-between cursor-pointer"
            >
              {t('edit')} <FaUserEdit />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleOpenDialog}
              className="flex justify-between cursor-pointer"
            >
              {t('disable')} <FaUserMinus />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{t('confirmDisable')}</DialogTitle>
              <DialogDescription>
                {t('confirmDisableDesc', { count: 1 })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button onClick={handleCancel} variant="outline">
                {t('cancel')}
              </Button>
              <Button onClick={handleDisablePlayer} variant="destructive">
                {t('disable')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  const actionsColumn: ColumnDef<PlayerRowData, unknown> = {
    id: 'actions',
    cell: ({ row }) => <ActionsCell row={row} />,
  };

  const FullNameCell = ({ row }: { row: { original: PlayerRowData } }) => {
    const t = useTranslations('Players');
    const { toast } = useToast();
    const player = row.original;
    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    const handleToggleFirstTeam = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsAnimating(true);

      if (!player.team?._id) return;

      try {
        const response = await fetch(
          `/api/admin/teams/${player.team._id}/firstTeam`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              playerId: player._id,
              isFirstTeam: !player.isFirstTeam,
            }),
          }
        );

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
                onClick={() =>
                  router.push(`/dashboard/admin/players/edit/${player._id}`)
                }
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
        await mutate(`/api/admin/teams/${player.team._id}`);

        if (callbacks && typeof callbacks === 'object' && 'onToggleFirstTeam' in callbacks && typeof callbacks.onToggleFirstTeam === 'function') {
          await callbacks.onToggleFirstTeam(
            player._id,
            player.team._id,
            player.isFirstTeam
          );
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
              <TooltipContent>{t('firstTeam')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  const coreColumns: ColumnDef<PlayerRowData, unknown>[] = [
    columnHelper.accessor((row) => `${row.name} ${row.lastname}`, {
      id: 'fullName',
      header: NameHeader,
      cell: ({ row }) => <FullNameCell row={row} />,
    }) as ColumnDef<PlayerRowData, unknown>,
    columnHelper.accessor('age', {
      header: AgeHeader,
      enableSorting: true,
    }) as ColumnDef<PlayerRowData, unknown>,
    columnHelper.accessor('height', {
      header: HeightHeader,
      enableSorting: true,
    }) as ColumnDef<PlayerRowData, unknown>,
    columnHelper.accessor('team.name', {
      id: 'team',
      header: TeamHeader,
      cell: ({ row }) => {
        const teamName = row.original.team?.name || '-';
        return <span>{teamName}</span>;
      },
    }) as ColumnDef<PlayerRowData, unknown>,
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
  }) as ColumnDef<PlayerRowData, unknown>;

  const cols = [...coreColumns];

  if (context === 'players') {
    cols.unshift(selectColumn as ColumnDef<PlayerRowData, unknown>);
    const teamColumnIndex = cols.findIndex((col) => col.id === 'team');
    cols.splice(teamColumnIndex + 1, 0, guardianColumn);
    cols.push(actionsColumn);
  }

  return cols;
};
