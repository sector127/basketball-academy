'use client';
import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import useSWR from 'swr';

const PlayerForm = ({players, onPlayerStatsChange}) => {
    const [playerStats, setPlayerStats] = useState(
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

    const handleChange = (index, field, value) => {
        const updatedStats = [...playerStats];
        updatedStats[index][field] = value;
        setPlayerStats(updatedStats);
        onPlayerStatsChange(updatedStats);
    };

    return (
        <div>
            {playerStats.map((stats, index) => (
                <div key={index} style={{marginBottom: '20px'}}>
                    <h3>Player {index + 1}</h3>
                    <label>Minutes Played:</label>
                    <input
                        type="number"
                        value={stats.minutesPlayed}
                        onChange={(e) => handleChange(index, 'minutesPlayed', parseInt(e.target.value))}
                    />
                    <label>Points:</label>
                    <input
                        type="number"
                        value={stats.points}
                        onChange={(e) => handleChange(index, 'points', parseInt(e.target.value))}
                    />
                    <label>Assists:</label>
                    <input
                        type="number"
                        value={stats.assists}
                        onChange={(e) => handleChange(index, 'assists', parseInt(e.target.value))}
                    />
                    <label>Rebounds:</label>
                    <input
                        type="number"
                        value={stats.rebounds}
                        onChange={(e) => handleChange(index, 'rebounds', parseInt(e.target.value))}
                    />
                    <label>Steals:</label>
                    <input
                        type="number"
                        value={stats.steals}
                        onChange={(e) => handleChange(index, 'steals', parseInt(e.target.value))}
                    />
                    <label>Blocks:</label>
                    <input
                        type="number"
                        value={stats.blocks}
                        onChange={(e) => handleChange(index, 'blocks', parseInt(e.target.value))}
                    />
                    <label>Turnovers:</label>
                    <input
                        type="number"
                        value={stats.turnovers}
                        onChange={(e) => handleChange(index, 'turnovers', parseInt(e.target.value))}
                    />
                    <label>Fouls:</label>
                    <input
                        type="number"
                        value={stats.fouls}
                        onChange={(e) => handleChange(index, 'fouls', parseInt(e.target.value))}
                    />
                </div>
            ))}
        </div>
    );
};
