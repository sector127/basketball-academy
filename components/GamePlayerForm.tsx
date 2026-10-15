'use client';

import React, { useState } from 'react';

export interface PlayerStatItem {
  playerId?: string;
  minutesPlayed?: number;
  points?: number;
  assists?: number;
  rebounds?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
}

export interface GamePlayerFormProps {
  players: PlayerStatItem[];
  onPlayerStatsChange: (stats: PlayerStatItem[]) => void;
}

export default function GamePlayerForm({ players, onPlayerStatsChange }: GamePlayerFormProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStatItem[]>(
    players.map((player) => ({
      playerId: player.playerId,
      minutesPlayed: player.minutesPlayed || 0,
      points: player.points || 0,
      assists: player.assists || 0,
      rebounds: player.rebounds || 0,
      steals: player.steals || 0,
      blocks: player.blocks || 0,
      turnovers: player.turnovers || 0,
      fouls: player.fouls || 0,
    }))
  );

  const handleChange = (index: number, field: keyof PlayerStatItem, value: number) => {
    const updatedStats = [...playerStats];
    updatedStats[index] = {
      ...updatedStats[index],
      [field]: isNaN(value) ? 0 : value,
    };
    setPlayerStats(updatedStats);
    onPlayerStatsChange(updatedStats);
  };

  return (
    <div className="space-y-4">
      {playerStats.map((stats, index) => (
        <div key={index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <h3 className="font-bold text-sm">Player {index + 1}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-slate-500">Minutes:</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={stats.minutesPlayed}
                onChange={(e) => handleChange(index, 'minutesPlayed', parseInt(e.target.value, 10))}
              />
            </div>
            <div>
              <label className="block text-slate-500">Points:</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={stats.points}
                onChange={(e) => handleChange(index, 'points', parseInt(e.target.value, 10))}
              />
            </div>
            <div>
              <label className="block text-slate-500">Assists:</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={stats.assists}
                onChange={(e) => handleChange(index, 'assists', parseInt(e.target.value, 10))}
              />
            </div>
            <div>
              <label className="block text-slate-500">Rebounds:</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={stats.rebounds}
                onChange={(e) => handleChange(index, 'rebounds', parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
