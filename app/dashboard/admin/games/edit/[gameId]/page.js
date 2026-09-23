'use client'; // Add this directive to make it a client component

import React from "react";
import GameForm from '@/components/GameForm';
import DashboardLayout from "@/components/DashboardLayout";
import useSWR from "swr";
import Loader from "@/components/Loader";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function EditGamePage({params}) {
    const {gameId} = React.use(params);

    // Add loading state handling
    const {data: game, error, isLoading} = useSWR(
        gameId ? `/api/games/${gameId}` : null,
        fetcher
    );

    if (isLoading)
        return (
            <DashboardLayout>
                <Loader/>
            </DashboardLayout>
        )

    if (error) return <div>Error loading game</div>;

    return (
        <div>
            <DashboardLayout>
                <h1 className="text-3xl font-bold text-center my-6">Edit Game</h1>
                {/* Pass the fetched game data instead of just ID */}
                <GameForm game={game}/>
            </DashboardLayout>
        </div>
    );
}