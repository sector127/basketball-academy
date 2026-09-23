'use client';
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {columns} from '@/app/dashboard/coach/players/columns';
import {DataTable} from "@/components/DataTable";
import Loader from "@/components/Loader";
import useSWR, {mutate} from "swr";

export default function PlayersPage() {
    const [context, setContext] = React.useState("players");
    const {data: players, error, isLoading} = useSWR(
        `/api/coach/players`,
        fetcher
    );

    const handleDataChange = async () => {
        // Revalidate the players data
        await mutate('/api/coach/players');
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <h1 className="text-3xl font-bold mb-8">All Our Players</h1>
                <Loader/>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <h1 className="text-3xl font-bold mb-8">All Our Players</h1>
                <p className="text-red-500">Error: {error}</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-4">Players</h1>
            <h3 className="text-gray-400 mb-4">List of all current basketball players in academy</h3>
            <DataTable
                columns={columns(players, context)}
                data={players?.data}
                onDataChange={handleDataChange}
            />
        </DashboardLayout>
    );
}

const fetcher = (url) => fetch(url).then((res) => res.json());