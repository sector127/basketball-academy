'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const DEFAULT_SLOTS = [
  { x: 150, y: 250, label: 'PG' },
  { x: 450, y: 250, label: 'SG' },
  { x: 140, y: 110, label: 'SF' },
  { x: 460, y: 110, label: 'PF' },
  { x: 300, y: 55, label: 'C' },
];

const POSITION_TO_SLOT_INDEX = {
  'point guard': 0,
  pg: 0,
  'shooting guard': 1,
  sg: 1,
  'small forward': 2,
  sf: 2,
  'power forward': 3,
  pf: 3,
  center: 4,
  c: 4,
};

const getInitials = (str = '') => {
  return str
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('');
};

const BasketballCourt = ({ firstTeamPlayers = [] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  const handleCourtPlayerClick = (goTo) => {
    const basePath = pathname?.includes('/coach')
      ? '/dashboard/coach/players/'
      : '/dashboard/admin/players/';
    router.push(basePath + goTo);
  };

  // Assign players to slots without overlapping
  const occupiedSlots = new Set();
  const positionedPlayers = firstTeamPlayers.map((player, idx) => {
    const posKey = (player.position || '').trim().toLowerCase();
    let slotIdx = POSITION_TO_SLOT_INDEX[posKey];

    if (slotIdx === undefined || occupiedSlots.has(slotIdx)) {
      // Find the first unoccupied slot, or offset dynamically if more than 5 players
      const nextFree = [0, 1, 2, 3, 4].find((i) => !occupiedSlots.has(i));
      slotIdx = nextFree !== undefined ? nextFree : idx % 5;
    }

    occupiedSlots.add(slotIdx);
    const baseCoord = DEFAULT_SLOTS[slotIdx] || { x: 300, y: 200 };
    // Small offset if duplicate exceeds 5 players
    const duplicateCount = Math.floor(idx / 5);
    const coord = {
      x: baseCoord.x + duplicateCount * 20,
      y: baseCoord.y + duplicateCount * 20,
    };

    return {
      player,
      coord,
      displayPos: getInitials(player.position) || `P${idx + 1}`,
    };
  });

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Court Board Container with Floating Tooltip Anchor */}
      <div className="relative w-full max-w-[600px] mx-auto">
        <svg
          width="600"
          height="400"
          viewBox="0 0 600 400"
          fill="none"
          className="w-full max-w-[600px] h-auto mx-auto block select-none drop-shadow-sm rounded-xl overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="courtBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="paintArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Court Base Floor */}
          <rect
            x="10"
            y="10"
            width="580"
            height="380"
            rx="12"
            stroke="#475569"
            strokeWidth="2.5"
            fill="url(#courtBg)"
          />

          {/* Center Half-Court Circle */}
          <path
            d="M360 390 a60 60 0 00-120 0"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Tactical Starters Label */}
          <text
            x="300"
            y="350"
            fill="#f59e0b"
            fillOpacity="0.2"
            fontSize="36"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="0.2em"
          >
            STARTERS
          </text>

          {/* Key Paint */}
          <rect
            x="210"
            y="10"
            width="180"
            height="150"
            stroke="#f59e0b"
            strokeWidth="2"
            fill="url(#paintArea)"
          />

          {/* Three-Point Line */}
          <path
            d="M50,10 C180,360 420,360 550,10"
            stroke="#94a3b8"
            strokeWidth="2"
            fill="none"
          />

          {/* Free Throw Circle */}
          <circle
            cx="300"
            cy="160"
            r="45"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="5 5"
            fill="none"
          />

          {/* Free Throw Line */}
          <line x1="210" y1="160" x2="390" y2="160" stroke="#f59e0b" strokeWidth="2.5" />

          {/* Backboard & Rim */}
          <line x1="265" y1="28" x2="335" y2="28" stroke="#ffffff" strokeWidth="4" />
          <circle cx="300" cy="40" r="10" stroke="#f97316" strokeWidth="3" fill="none" />

          {/* Dynamically place non-overlapping players on the court */}
          {positionedPlayers.map(({ player, coord, displayPos }) => {
            const isHovered = hoveredPlayer?._id === player._id;
            return (
              <g
                key={player._id}
                transform={`translate(${coord.x}, ${coord.y})`}
                onClick={() => handleCourtPlayerClick(player._id)}
                onMouseEnter={() => setHoveredPlayer({ ...player, coord, displayPos })}
                onMouseLeave={() => setHoveredPlayer(null)}
                className="cursor-pointer transition-transform duration-200"
                style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
              >
                <title>
                  {`${player.name} ${player.lastname} (#${player.jerseyNum}) - ${player.position}`}
                </title>

                {/* Pulse Ring when Hovered */}
                {isHovered && (
                  <circle
                    cx="0"
                    cy="0"
                    r="26"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    className="animate-ping"
                    opacity="0.6"
                  />
                )}

                {/* Player Token Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="19"
                  fill={isHovered ? '#fbbf24' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-colors duration-200 shadow-md"
                />

                {/* Position Code */}
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {displayPos}
                </text>

                {/* Player First Name Label */}
                <text
                  x="0"
                  y="32"
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight="700"
                  stroke="#0f172a"
                  strokeWidth="3"
                  paintOrder="stroke fill"
                >
                  {player.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip directly above hovered starter token */}
        {hoveredPlayer && hoveredPlayer.coord && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 ease-out animate-in fade-in zoom-in-95"
            style={{
              left: `${(hoveredPlayer.coord.x / 600) * 100}%`,
              top: `${(hoveredPlayer.coord.y / 400) * 100}%`,
              transform:
                hoveredPlayer.coord.y < 85
                  ? 'translate(-50%, 0%) translateY(24px)'
                  : 'translate(-50%, -100%) translateY(-24px)',
            }}
          >
            <div className="relative flex flex-col items-center">
              {hoveredPlayer.coord.y < 85 && (
                <div className="w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-amber-500 -mb-[1px]" />
              )}
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-amber-500/50 px-3 py-1.5 text-xs text-white shadow-2xl backdrop-blur-md whitespace-nowrap">
                <span className="font-mono font-bold text-amber-400">
                  #{hoveredPlayer.jerseyNum}
                </span>
                <span className="font-bold text-slate-100">
                  {hoveredPlayer.name} {hoveredPlayer.lastname}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300 font-semibold text-[11px]">
                  {hoveredPlayer.position}
                </span>
                {hoveredPlayer.height && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {hoveredPlayer.height} cm
                    </span>
                  </>
                )}
              </div>
              {hoveredPlayer.coord.y >= 85 && (
                <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-amber-500 -mt-[1px]" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Info Footer Slot - Fixed height (h-10) to completely eliminate layout shift */}
      <div className="w-full max-w-[600px] mt-2.5 h-10 px-4 flex items-center justify-between rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-xs transition-colors duration-200">
        {hoveredPlayer ? (
          <div className="w-full flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                #{hoveredPlayer.jerseyNum}
              </span>
              <span className="font-bold text-white truncate">
                {hoveredPlayer.name} {hoveredPlayer.lastname}
              </span>
              <span className="text-slate-500 shrink-0">•</span>
              <span className="text-amber-300 font-medium shrink-0">
                {hoveredPlayer.position}
              </span>
              {hoveredPlayer.height && (
                <>
                  <span className="text-slate-500 shrink-0">•</span>
                  <span className="font-mono text-slate-400 shrink-0">
                    {hoveredPlayer.height} cm
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => handleCourtPlayerClick(hoveredPlayer._id)}
              className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] shrink-0 ml-3 flex items-center gap-1 cursor-pointer transition-colors"
            >
              Athlete Profile &rarr;
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 text-slate-400 text-[11px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Hover over court tokens to inspect player details • Click to view athlete profile</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketballCourt;
