import React from 'react';
import {useRouter} from "next/navigation";
import {Tooltip} from "@mui/material";
import {Pacifico} from 'next/font/google';

const pacifico = Pacifico({
    subsets: ['latin'],
    weight: '400',
});

const BasketballCourt = ({firstTeamPlayers}) => {

    const router = useRouter();
    // Define positions for each player on the court
    const positions = {
        PG: {x: 150, y: 250},  // Point Guard
        SG: {x: 450, y: 250}, // Shooting Guard
        PF: {x: 450, y: 100}, // Small Forward
        SF: {x: 150, y: 100}, // Power Forward
        C: {x: 300, y: 50},  // Center
    };

    const firstLetters = (str) => {
        const words = str.split(' ');
        const firstLetters = words.map(word => word.charAt(0)).filter(letter => letter !== '');
        return firstLetters.join('');
    }

    const handleCourtPlayerClick = (goTo) => {
        router.push('/dashboard/players/' + goTo);
    }


    return (
        <svg width="600" height="400" viewBox="0 0 600 400" fill="none"
             xmlns="http://www.w3.org/2000/svg">
            {/* Court Outline with Wooden Texture */}
            <defs>
                <pattern id="wood-texture" x="0" y="0" width="1" height="1">
                    <image
                        x="0"
                        y="0"
                        width="600"
                        height="400"
                        href="/assets/images/floor.png" // Path to the wooden texture image
                        preserveAspectRatio="none"
                    />
                </pattern>
            </defs>
            <rect x="10" y="10" width="580" height="380" stroke="black" strokeWidth="2" fill="#b5b2c4"/>

            {/* Center Circle */}
            <path d="M350 390 a1 1 0 00-100 0" stroke="black" strokeWidth="2" fill="#8685ef"/>

            {/* Starters Text */}
            <text
                x="500" // Center the text horizontally
                y="370" // Position the text vertically
                textAnchor="middle" // Center the text
                fill="#333" // White text color
                fontSize="24" // Font size
                className={pacifico.className} // Apply Pacifico font locally
                style={{
                    stroke: 'white', // Black outline
                    strokeWidth: '3px', // Outline thickness
                    paintOrder: 'stroke', // Ensure the outline is behind the text
                }}
            >
                STARTERS
            </text>

            {/* Three-Point Line */}
            <path d="M40,10 C200,370 400,370 560,10" stroke="black" strokeWidth="2" fill="none"/>
            {/* Key */}
            <rect x="200" y="10" width="200" height="150" stroke="black" strokeWidth="2" fill="#8685ef"/>
            {/* Hoop */}
            <circle cx="300" cy="160" r="10" fill="black"/>
            {/* Free Throw Line */}
            <line x1="200" y1="160" x2="400" y2="160" stroke="black" strokeWidth="2"/>

            {/* Dynamically place players on the court */}
            {firstTeamPlayers.map((player) => {
                const position = positions[firstLetters(player.position)];
                if (!position) return null;

                return (
                    <Tooltip
                        key={player._id}
                        title={
                            <div>
                                <strong>{player.name + " " + player.lastname}</strong>
                                <div>Position: {player.position}</div>
                                <div>Jersey: {player.jerseyNum}</div>
                                <div>Team: {player.team?.name || 'No Team'}</div>
                            </div>
                        }
                        arrow
                    >
                        <g key={player._id} transform={`translate(${position.x}, ${position.y})`}
                           onClick={() => handleCourtPlayerClick(player._id)}
                           style={{cursor: 'pointer'}}
                        >
                            <circle
                                cx="0"
                                cy="0"
                                r="20"
                                fill="#FFD700"
                                style={{transition: 'fill 0.5s'}}
                                onMouseEnter={(e) => e.target.setAttribute('fill', '#ffcc00')}
                                onMouseLeave={(e) => e.target.setAttribute('fill', '#FFD700')}
                            />
                            <text x="0" y="5" textAnchor="middle" fill="#000" fontSize="12">
                                {firstLetters(player.position)}
                            </text>
                            <text x="0" y="40" textAnchor="middle" fill="#000" fontSize="12">
                                {player.name}
                            </text>
                        </g>
                    </Tooltip>
                );
            })}
        </svg>
    );
};

export default BasketballCourt;