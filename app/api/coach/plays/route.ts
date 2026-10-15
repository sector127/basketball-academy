import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Play from '@/models/Play';
import { combinations as presetCombinations } from '@/lib/combinationsCheatSheet';
import { requireAuth } from '@/lib/authGuard';

interface PlayerPositionInput {
  id: string;
  position: string;
  x: number;
  y: number;
  hasBall?: boolean;
  action?: string;
}

interface PlayStepInput {
  step: number;
  description: string;
  players: PlayerPositionInput[];
  ball: {
    x: number;
    y: number;
    holder: string;
  };
}

interface CreatePlayInput {
  name?: string;
  description?: string;
  category?: string;
  team?: string;
  steps?: PlayStepInput[];
}

export async function GET(): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const customPlays = await Play.find({})
      .populate('team', 'name')
      .populate('createdBy', 'name lastName')
      .sort({ createdAt: -1 });

    const presetsFormatted = presetCombinations.map((p, idx) => ({
      ...p,
      _id: `preset-${idx}`,
      isCustom: false,
      category: 'Set Play',
    }));

    return NextResponse.json(
      {
        success: true,
        plays: [...customPlays, ...presetsFormatted],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching plays:', error);
    return NextResponse.json({ error: 'Failed to fetch playbook' }, { status: 500 });
  }
}

export async function POST(request: NextRequest | Request): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const data = (await request.json()) as CreatePlayInput;

    const { name, description, category, team, steps } = data;

    if (!name || !description) {
      return NextResponse.json({ error: 'Play name and description are required' }, { status: 400 });
    }

    const defaultInitialPlayers: PlayerPositionInput[] = [
      { id: '1', position: 'PG', x: 250, y: 350, hasBall: true, action: 'Initiate play' },
      { id: '2', position: 'SG', x: 100, y: 280, hasBall: false, action: 'Wing spacing' },
      { id: '3', position: 'SF', x: 400, y: 280, hasBall: false, action: 'Weakside wing' },
      { id: '4', position: 'PF', x: 180, y: 180, hasBall: false, action: 'High post entry' },
      { id: '5', position: 'C', x: 320, y: 120, hasBall: false, action: 'Low block position' },
    ];

    const finalizedSteps: PlayStepInput[] =
      Array.isArray(steps) && steps.length > 0
        ? steps
        : [
            {
              step: 0,
              description: `${name} - Initial Setup: Base offensive alignment`,
              players: defaultInitialPlayers,
              ball: { x: 250, y: 350, holder: '1' },
            },
            {
              step: 1,
              description: `${name} - Action Phase: Screen and cut execution`,
              players: [
                { id: '1', position: 'PG', x: 220, y: 280, hasBall: true, action: 'Dribble drive off screen' },
                { id: '2', position: 'SG', x: 80, y: 200, hasBall: false, action: 'Corner cut' },
                { id: '3', position: 'SF', x: 420, y: 240, hasBall: false, action: 'V-cut for pass' },
                { id: '4', position: 'PF', x: 230, y: 300, hasBall: false, action: 'Set ball screen' },
                { id: '5', position: 'C', x: 280, y: 100, hasBall: false, action: 'Seal defender' },
              ],
              ball: { x: 220, y: 280, holder: '1' },
            },
            {
              step: 2,
              description: `${name} - Finish Phase: Kickout or direct scoring opportunity`,
              players: [
                { id: '1', position: 'PG', x: 220, y: 200, hasBall: false, action: 'Pass to open shooter' },
                { id: '2', position: 'SG', x: 80, y: 150, hasBall: false, action: 'Spot up 3-pointer' },
                { id: '3', position: 'SF', x: 380, y: 180, hasBall: true, action: 'Catch and shoot jump shot' },
                { id: '4', position: 'PF', x: 200, y: 120, hasBall: false, action: 'Roll to rim for rebound' },
                { id: '5', position: 'C', x: 290, y: 80, hasBall: false, action: 'Offensive glass' },
              ],
              ball: { x: 380, y: 180, holder: '3' },
            },
          ];

    const newPlay = await Play.create({
      name,
      description,
      category: category || 'Set Play',
      team: team || undefined,
      createdBy: session.user.id,
      isCustom: true,
      steps: finalizedSteps,
    });

    return NextResponse.json({ success: true, play: newPlay }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating custom play:', error);
    return NextResponse.json({ error: 'Failed to create play' }, { status: 500 });
  }
}
