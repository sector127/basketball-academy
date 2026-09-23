'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation'; // Import useRouter for navigation
import DashboardLayout from "@/components/DashboardLayout";
import {DataTable} from "@/components/DataTable";
import {columns} from "@/app/dashboard/coach/players/columns";
import Loader from "@/components/Loader";
import BasketballCourt from "@/components/BasketballCourt";
import useSWR, {mutate} from "swr";

export default function TeamPlayersPage({params}) {
    const [players, setPlayers] = useState([]);
    const {teamId} = React.use(params);
    const [context, setContext] = useState("team");
    const router = useRouter(); // Add router for navigation

    const fetcher = async (url) => {
        const res = await fetch(url, {credentials: 'include'}); // Include cookies for auth
        if (!res.ok) {
            const data = await res.json();
            if (res.status === 401) {
                router.push('/login'); // Redirect to login
                throw new Error('Unauthorized - Please log in');
            }
            if (res.status === 403) {
                router.push('/unauthorized'); // Redirect to unauthorized
                throw new Error('Unauthorized - Not a team coach');
            }
            throw new Error(data.error || 'Failed to fetch players');
        }
        return res.json();
    };

    const {data, error, isLoading} = useSWR(
        `/api/coach/teams/${teamId}`, // Ensure this matches your route path
        fetcher
    );

    const handleDataChange = async () => {
        await mutate(`/api/coach/teams/${teamId}`);
    };

    useEffect(() => {
        if (data?.data) {
            setPlayers(data.data);
        }
    }, [data]);

    const starters = players?.filter(player => player.isFirstTeam);

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
                <p className="text-red-500">Error: {error.message}</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className='border border-1 dark:border-slate-700 w-[602px] rounded-md'>
                <BasketballCourt firstTeamPlayers={starters}/>
            </div>
            <h1 className="text-3xl font-bold mt-4 pl-4 border-l-8 border-yellow-500">
                {players.length > 0 && players[0].team ? `${players[0].team.name} Full roster` : 'Team Players'}
            </h1>
            <DataTable
                columns={columns(setPlayers, context)}
                data={players}
                onDataChange={handleDataChange}
            />
        </DashboardLayout>
    );
}