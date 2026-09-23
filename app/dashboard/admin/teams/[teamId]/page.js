'use client'

import React, {useEffect, useState} from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import {DataTable} from "@/components/DataTable";
import {columns} from "@/app/dashboard/admin/players/columns";
import Loader from "@/components/Loader";
import BasketballCourt from "@/components/BasketballCourt";
import useSWR, {mutate} from "swr";

export default function TeamPlayersPage({params}) {
    const [players, setPlayers] = useState([]);
    const {teamId} = React.use(params)
    const [context, setContext] = useState("team")


    const {data, error, isLoading} = useSWR(
        `/api/admin/teams/${teamId}`,
        fetcher
    );

    const handleDataChange = async () => {
        // Revalidate the players data
        await mutate(`/api/admin/teams/${teamId}/players`);
    }

    useEffect(() => {
        if (data?.data) {
            setPlayers(data.data);
        }
    }, [data]);

    const starters = players?.filter(player => player.isFirstTeam)

    if (isLoading) {
        return (
            <DashboardLayout>
                <h1 className="text-3xl font-bold mb-8">Team Players</h1>
                <Loader/>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <h1 className="text-3xl font-bold mb-8">Team Players</h1>
                <p className="text-red-500">Error: {error}</p>
            </DashboardLayout>
        );
    }


    return (
        <DashboardLayout>
            <div className='border border-1 dark:border-slate-700 w-[602px] rounded-md'>
                <BasketballCourt firstTeamPlayers={starters}/>
            </div>
            <h1 className="text-3xl font-bold mt-4 pl-4 border-l-8 border-yellow-500">{players.length > 0 && players[0].team ? `${players[0].team.name} Full roster` : 'Team Players'}</h1>
            <DataTable columns={columns(setPlayers, context)} data={players} onDataChange={handleDataChange}
            />
        </DashboardLayout>
    );
}

const fetcher = (url) => fetch(url).then((res) => res.json());