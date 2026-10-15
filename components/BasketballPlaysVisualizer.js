'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Info, BookOpen, Layers } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';

const BasketballPlaysVisualizer = ({ combination }) => {
  const t = useTranslations('Combinations');
  const [currentPlay, setCurrentPlay] = useState(combination || {});
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(2);
  const courtRef = useRef(null);
  const playIntervalRef = useRef(null);

  useEffect(() => {
    setCurrentPlay(combination || {});
    setCurrentStep(0);
    setIsPlaying(false);
  }, [combination]);

  const steps = currentPlay?.steps || [];

  // Start automatic playback
  const startPlayback = () => {
    if (steps.length === 0) return;
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }

    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(playIntervalRef.current);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 3000 / animationSpeed);
  };

  // Pause playback
  const pausePlayback = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    setIsPlaying(false);
  };

  // Step forward
  const stepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Step backward
  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Clean up interval on unmount or combination change
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  // Normalize step data for both preset and custom plays
  const currentStepData = steps[currentStep] || null;
  const prevStepData = currentStep > 0 ? steps[currentStep - 1] : null;

  const ourTeamPlayers = currentStepData?.playerPositions?.ourTeam ||
    (Array.isArray(currentStepData?.players) ? currentStepData.players : []);

  const prevOurTeamPlayers = prevStepData?.playerPositions?.ourTeam ||
    (Array.isArray(prevStepData?.players) ? prevStepData.players : []);

  const opponentPlayers = currentStepData?.playerPositions?.opponents || [];
  const prevOpponentPlayers = prevStepData?.playerPositions?.opponents || [];

  const annotations = Array.isArray(currentStepData?.annotations) && currentStepData.annotations.length > 0
    ? currentStepData.annotations
    : ourTeamPlayers
        .filter((p) => p.action)
        .map((p) => `${p.position || p.id}: ${p.action}`);

  const ensureWithinBounds = (pos) => {
    if (!pos) return { x: 50, y: 50 };
    const x = Math.max(8, Math.min(92, pos.x));
    const y = Math.max(8, Math.min(92, pos.y));
    return { x, y };
  };
  return (
    <Card className="w-full h-full bg-white dark:bg-slate-900 overflow-hidden border-0 rounded-3xl shadow-none">
      {/* Header Bar */}
      <CardHeader className="bg-slate-50/80 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 p-5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {currentPlay.name || 'Tactical Play'}
              </CardTitle>
            </div>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-1 text-xs font-normal max-w-xl leading-relaxed">
              {currentPlay.description || 'Chalkboard play execution walkthrough'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5"
            >
              {currentPlay.category || 'Set Play'}
            </Badge>
            {currentPlay.isCustom && (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5"
              >
                Coach Custom
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Tactical Half-Court Visualization */}
          <div className="flex flex-col w-full lg:w-3/5 p-4 sm:p-6">
            <div
              className="relative w-full h-[380px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl select-none"
              ref={courtRef}
            >
              {/* Floor Wood Texture Overlay */}
              <div
                className="absolute inset-0 opacity-15 bg-repeat"
                style={{ backgroundImage: 'url("/assets/images/floor.png")', backgroundSize: '240px' }}
              />

              {/* Court Boundary Lines & Markings */}
              <div className="absolute inset-3 pointer-events-none">
                {/* Baseline (Top - Basket is at the top) */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/30" />

                {/* Sidelines */}
                <div className="absolute left-0 top-0 h-full w-0.5 bg-amber-500/30" />
                <div className="absolute right-0 top-0 h-full w-0.5 bg-amber-500/30" />

                {/* Half-court Line (Bottom) */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500/40" />

                {/* Half-court Center Circle */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-l-2 border-r-2 rounded-t-full border-amber-500/30" />

                {/* Key / Paint */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-44 border-b-2 border-l-2 border-r-2 border-amber-500/40 bg-amber-500/5" />

                {/* Free Throw Circle */}
                <div className="absolute top-44 left-1/2 -translate-x-1/2 w-28 h-28 border-2 border-dashed rounded-full border-amber-500/30 -translate-y-1/2" />

                {/* Free Throw Line */}
                <div className="absolute top-44 left-1/2 -translate-x-1/2 w-44 h-0.5 bg-amber-500/40" />

                {/* Three-Point Line (Arc around basket) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[210px] border-b-2 border-l-2 border-r-2 rounded-b-full border-slate-500/50" />

                {/* Backboard & Basket Rim */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-white rounded-full shadow" />
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-orange-500 shadow-sm" />

                {/* Watermark Label */}
                <div className="absolute bottom-4 left-4 text-[10px] font-bold tracking-widest text-slate-700 uppercase">
                  BBA Tactical Chalkboard
                </div>
              </div>

              {/* Dynamic Animated Players */}
              <AnimatePresence>
                {currentStepData && (
                  <>
                    {/* Our Team Athletes (Gold / Amber Tokens) */}
                    {ourTeamPlayers.map((player) => {
                      const bounded = ensureWithinBounds(player);
                      const prevP = prevOurTeamPlayers?.find((p) => p.id === player.id);
                      const prevBounded = prevP ? ensureWithinBounds(prevP) : bounded;

                      return (
                        <TooltipProvider key={`our-${player.id}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div
                                className="absolute flex items-center justify-center w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-lg z-20 border-2 border-white dark:border-slate-900 cursor-pointer"
                                initial={{
                                  left: `${prevBounded.x}%`,
                                  top: `${prevBounded.y}%`,
                                  x: '-50%',
                                  y: '-50%',
                                }}
                                animate={{
                                  left: `${bounded.x}%`,
                                  top: `${bounded.y}%`,
                                  x: '-50%',
                                  y: '-50%',
                                }}
                                transition={{
                                  type: 'spring',
                                  damping: 22,
                                  stiffness: 110,
                                  duration: 0.8,
                                }}
                              >
                                <span>{player.position || player.id}</span>
                                {player.hasBall && (
                                  <motion.div
                                    className="absolute -right-1 -top-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-md"
                                    animate={{ scale: [1, 1.25, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  />
                                )}
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 text-white border-slate-800 text-xs">
                              <p className="font-bold">{player.position || `Player ${player.id}`}</p>
                              {player.action && <p className="text-[11px] text-amber-400 mt-0.5">{player.action}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}

                    {/* Opponent Athletes (Rose / Crimson Tokens) */}
                    {opponentPlayers.map((player) => {
                      const bounded = ensureWithinBounds(player);
                      const prevP = prevOpponentPlayers?.find((p) => p.id === player.id);
                      const prevBounded = prevP ? ensureWithinBounds(prevP) : bounded;

                      return (
                        <TooltipProvider key={`opp-${player.id}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div
                                className="absolute flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-md z-10 border-2 border-white/80 dark:border-slate-900 opacity-80"
                                initial={{
                                  left: `${prevBounded.x}%`,
                                  top: `${prevBounded.y}%`,
                                  x: '-50%',
                                  y: '-50%',
                                }}
                                animate={{
                                  left: `${bounded.x}%`,
                                  top: `${bounded.y}%`,
                                  x: '-50%',
                                  y: '-50%',
                                }}
                                transition={{
                                  type: 'spring',
                                  damping: 22,
                                  stiffness: 110,
                                  duration: 0.8,
                                }}
                              >
                                {player.id}
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 text-white border-slate-800 text-xs">
                              <p className="font-semibold">Defender: {player.id}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Step Walkthrough & Tactical Breakdown Panel */}
          <div className="w-full lg:w-2/5 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Phase Breakdown ({steps.length} Steps)
              </h4>
            </div>

            <ScrollArea className="h-[340px] pr-2">
              <div className="space-y-2.5">
                {steps.map((step, idx) => {
                  const isActive = idx === currentStep;
                  return (
                    <div
                      key={step.id || idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-sm text-slate-900 dark:text-slate-100'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <p className={`text-xs font-bold ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {step.description || `Step ${idx + 1}`}
                          </p>
                        </div>
                      </div>

                      {isActive && annotations.length > 0 && (
                        <ul className="mt-2.5 pt-2 border-t border-amber-500/20 pl-7 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                          {annotations.map((ann, aIdx) => (
                            <li key={aIdx} className="list-disc leading-relaxed">
                              {ann}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      {/* Control Footer */}
      <CardFooter className="border-t border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/60">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {t('step', { current: currentStep + 1, total: steps.length })}
            </span>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Speed:</span>
              <Slider
                value={[animationSpeed]}
                min={1}
                max={4}
                step={1}
                onValueChange={(val) => setAnimationSpeed(val[0])}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={stepBackward}
              disabled={currentStep <= 0}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
            >
              <SkipBack size={14} />
            </Button>

            <Button
              onClick={isPlaying ? pausePlayback : startPlayback}
              className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md text-xs gap-1.5"
            >
              {isPlaying ? (
                <>
                  <Pause size={14} /> Pause
                </>
              ) : (
                <>
                  <Play size={14} className="fill-slate-950" /> {t('playAnimation')}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={stepForward}
              disabled={currentStep >= steps.length - 1}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
            >
              <SkipForward size={14} />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BasketballPlaysVisualizer;
