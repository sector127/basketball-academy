import connectToDatabase from "@/lib/mongoose";
import {NextResponse} from "next/server";
import Game from "@/models/Game";
import Team from "@/models/Team";

export async function GET(req) {
    try {
        await connectToDatabase();
        const games = await Game.find({}).populate('team team.name');

        return NextResponse.json(games, {status: 200});
    } catch (error) {
        console.error('Error fetching games:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}

export async function POST(req) {
    try {
        const game = await req.json()
        await connectToDatabase();

        const newGame = await Game.create({
            ...game,
            team: game.team,
            opponent: game.opponent,
            location: game.location,
            venue: game.venue,
            date: game.date,
            startTime: game.startTime,
            score: game.score,
            players: game.players,
            notes: game.notes,
        });

        return NextResponse.json(newGame, {status: 201});
    } catch (error) {
        console.error('Error creating game:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}

