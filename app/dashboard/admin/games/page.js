'use client';
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import GameList from "@/components/GameList";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";

export default function GamesPage() {
    const router = useRouter();
    const handleCreateGame = () => {
        router.push('/dashboard/games/create');
    }

    return (
        <DashboardLayout>
            <div className='flex justify-between'>
                <h1 className="text-3xl font-bold"></h1>
                <Button onClick={handleCreateGame}>
                    Add a game
                </Button>
            </div>
            <GameList/>
        </DashboardLayout>
    );
}