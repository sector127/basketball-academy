'use client';
import {useEffect, useState} from 'react';
import {Separator} from '@/components/ui/separator';
import Loader from '@/components/Loader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {LuMoreHorizontal} from "react-icons/lu";
import {useRouter} from "next/navigation";

export default function GameList() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch('/api/games');
                if (!response.ok) {
                    throw new Error('Failed to fetch games');
                }
                const data = await response.json();
                setGames(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    const today = new Date();
    const pastGames = games.filter(game => new Date(game.date) < today);
    const futureGames = games.filter(game => new Date(game.date) >= today);

    const handleEdit = (game) => {
        router.push(`/dashboard/games/edit/${game._id}`);
    }

    const renderGameCard = (game, isFuture) => {
        const isHomeGame = game.location === 'Home';
        const ourTeamScore = game.score.ourTeam;
        const opponentScore = game.score.opponentTeam;
        const isWinner = ourTeamScore > opponentScore;
        const badgeColor = isWinner ? 'bg-green-500' : 'bg-red-500';

        return (
            <div key={game._id}
                 className="flex flex-col min-h-20 dark:bg-slate-950 border dark:border-slate-800 dark:text-slate-50 px-4 py-2  space-y-1 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <span
                            className="flex flex-nowrap justify-between text-sm text-gray-400">{new Date(game.date).toLocaleDateString('ka-GE', {
                            month: 'short', day: 'numeric'
                        })}
                            {' '}&bull;{' '}
                            {game.startTime}
                        </span>
                    </div>
                    <p className="w-1/3 text-sm text-gray-400">{game.venue}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400">
                                <LuMoreHorizontal className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel className='flex justify-center'>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem>
                                <Button onClick={() => handleEdit(game)} variant="ghost"
                                        className='w-full'>Edit</Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className='w-full'>Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogTitle className="dark:text-slate-50">
                                            Are you absolutely sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the game.
                                        </AlertDialogDescription>
                                        <AlertDialogFooter className="flex justify-end space-x-4">
                                            <AlertDialogCancel className="dark:text-slate-50">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => console.log("Delete")}>
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/*<Separator className='dark:bg-slate-800'/>*/}
                <div className="flex justify-evenly items-center">
                    <span className='flex justify-between w-1/3'>
                        <h2 className={`${isHomeGame ? 'font-bold' : ''} dark:text-slate-50`}>{game.team.name}</h2>
                    </span>
                    <div className='w-1/3 flex justify-center'>
                        {!isFuture && <span className={`${badgeColor} px-1 py-0.5 rounded-md`}>
                    <span className='dark:text-slate-50 w-1/3'>{ourTeamScore}-</span>
                         <span className='dark:text-slate-50'>{opponentScore}</span>
                    </span>}
                    </div>
                    <span className='flex w-1/3 justify-end'>
                        <h2 className={`${!isHomeGame ? 'font-bold' : ''} dark:text-slate-50`}>{game.opponent}</h2>
                    </span>
                </div>
            </div>
        );
    };

    if (loading) {
        return <Loader/>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    return (<div className="p-4 max-w-4xl mx-auto flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
        <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">Results</h1>
            <div className="space-y-4">
                {pastGames.length > 0 ? pastGames.map(game => renderGameCard(game, false)) : <p>No past games.</p>}
            </div>
        </div>
        <Separator orientation="vertical" className="h-auto dark:bg-slate-800"/>
        <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">Fixtures</h1>
            <div className="space-y-4">
                {futureGames.length > 0 ? futureGames.map(game => renderGameCard(game, true)) :
                    <p>No upcoming games.</p>}
            </div>
        </div>
    </div>);
}