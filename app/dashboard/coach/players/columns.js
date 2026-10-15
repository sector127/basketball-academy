'use client'

import {createColumnHelper} from '@tanstack/react-table'
import {Button} from "@/components/ui/button"
import {ArrowUpDown as LuArrowUpDown} from "lucide-react";
import {useRouter} from "next/navigation";
import {useToast} from "@/hooks/use-toast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {useState} from 'react';
import {GoStar, GoStarFill} from "@/components/icons/navIcons";
import {ToastAction} from "@/components/ui/toast";
import {mutate} from "swr";
import {useTranslations} from "next-intl";

const columnHelper = createColumnHelper()

const NameHeader = () => {
  const t = useTranslations("Players");
  return <span>{t("fullName")}</span>;
};

const AgeHeader = ({ column }) => {
  const t = useTranslations("Players");
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-5"
    >
      {t("dateOfBirth")}
      <LuArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const HeightHeader = ({ column }) => {
  const t = useTranslations("Players");
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-8"
    >
      {t("height")}
      <LuArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const TeamHeader = () => {
  const t = useTranslations("Players");
  return <span>{t("teams")}</span>;
};

const GuardianHeader = () => {
  const t = useTranslations("Players");
  return <span>{t("guardianName")}</span>;
};
export const columns = (callbacks, context) => {
    const FullNameCell = ({row}) => {
        const {toast} = useToast()
        const player = row.original
        const [isAnimating, setIsAnimating] = useState(false)
        const router = useRouter()

        const handleToggleFirstTeam = async (e) => {
            e.stopPropagation();
            setIsAnimating(true);

            try {
                const response = await fetch(`/api/coach/teams/${player.team._id}/firstTeam`, {
                    method: "PATCH",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({playerId: player._id, isFirstTeam: !player.isFirstTeam}),
                });

                if (!response.ok) {
                    const data = await response.json();
                    toast({
                        title: "Failed to update first team status",
                        description: data.error,
                        variant: "destructive",
                        action: data.error.startsWith('A player with the position') ?
                            <ToastAction altText={'Edit Player'}
                                         onClick={() => router.push(`/dashboard/coach/players/edit/${player._id}`)}>Edit</ToastAction> : null
                    });
                    setIsAnimating(false);
                    return;
                }

                if (response.ok) {
                    const data = await response.json();

                    // Optimistically update the UI
                    player.isFirstTeam = !player.isFirstTeam;  // Update the local row data

                    toast({
                        title: "First team status updated",
                        description: data.message,
                        variant: "info",
                    });
                    await mutate(`/api/coach/teams/${player.team._id}`);

                    // Call the callback to update the server data
                    if (callbacks?.onToggleFirstTeam) {
                        await callbacks.onToggleFirstTeam(player._id, player.team._id, player.isFirstTeam);
                    }

                    setTimeout(() => setIsAnimating(false), 300);
                }
            } catch (error) {
                console.error("Error updating first team status:", error);
                setIsAnimating(false);

                // Revert the optimistic update in case of error
                player.isFirstTeam = !player.isFirstTeam;
            }
        };

        const position = row.original.position
        return (
            <div className='flex justify-between'>
                <div>
                    <div>{`${row.original.name} ${row.original.lastname}`}</div>
                    {position && <div className="text-xs text-gray-500">{position}</div>}
                </div>
                {context === 'team' && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className='m-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-1 transition-colors'
                                    onClick={handleToggleFirstTeam}
                                    onMouseDown={() => setIsAnimating(true)}
                                    aria-label="Toggle Starter Status"
                                >
                                    {player.isFirstTeam ? (
                                        <GoStarFill
                                            color='#FFD700'
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
        )
    };

    const coreColumns = [
        columnHelper.accessor(row => `${row.name} ${row.lastname}`, {
            id: 'fullName',
            header: NameHeader,
            cell: FullNameCell,
        }),
        columnHelper.accessor('age', {
            header: AgeHeader,
            enableSorting: true,
        }),
        columnHelper.accessor('height', {
            header: HeightHeader,
            enableSorting: true,
        }),
        columnHelper.accessor('team.name', {
            id: 'team',
            header: TeamHeader,
            cell: ({row}) => {
                const teamName = row.original.team?.name || '-'
                return <span>{teamName}</span>
            }
        })
    ]

    // Guardian column definition
    const guardianColumn = columnHelper.accessor('guardian', {
        header: GuardianHeader,
        cell: ({row}) => {
            const guardian = row.original.guardian
            const guardianTel = row.original.guardianTel
            return <div>
                <div>{guardian}</div>
                <div className="text-xs text-gray-500">{guardianTel}</div>
            </div>
        }
    })

    let columns = [...coreColumns]

    if (context === 'players') {
        const teamColumnIndex = columns.findIndex(col => col.id === 'team')
        columns.splice(teamColumnIndex + 1, 0, guardianColumn)
    }

    return columns
}