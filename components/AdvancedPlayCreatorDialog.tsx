'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Play,
  Pause,
  Plus,
  Trash2,
  Move,
  Layers,
  Shield,
  Zap,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface PlayerNode {
  id: string; // '1', '2', '3', '4', '5'
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  x: number; // percentage 8 to 92
  y: number; // percentage 8 to 92
  hasBall: boolean;
  action: string;
}

export interface PlayStep {
  step: number;
  description: string;
  players: PlayerNode[];
  ball: {
    x: number;
    y: number;
    holder: string;
  };
}

interface TeamOption {
  _id: string;
  name: string;
}

interface AdvancedPlayCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayCreated?: () => void;
  teams?: TeamOption[];
}

// Player color map
const PLAYER_CONFIG: Record<
  string,
  { label: string; name: string; bg: string; border: string; text: string }
> = {
  '1': { label: 'PG', name: 'Point Guard', bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-slate-950' },
  '2': { label: 'SG', name: 'Shooting Guard', bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-white' },
  '3': { label: 'SF', name: 'Small Forward', bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-white' },
  '4': { label: 'PF', name: 'Power Forward', bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-white' },
  '5': { label: 'C',  name: 'Center', bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-white' },
};

// Tactical Court Alignment Presets
const PRESET_ALIGNMENTS: Record<
  string,
  { name: string; description: string; players: Omit<PlayerNode, 'hasBall' | 'action'>[] }
> = {
  horns: {
    name: 'Horns Set',
    description: 'Two bigs set at high elbows, wings deep in corners, PG at top',
    players: [
      { id: '1', position: 'PG', x: 50, y: 76 },
      { id: '2', position: 'SG', x: 12, y: 28 },
      { id: '3', position: 'SF', x: 88, y: 28 },
      { id: '4', position: 'PF', x: 38, y: 46 },
      { id: '5', position: 'C',  x: 62, y: 46 },
    ],
  },
  fiveOut: {
    name: '5-Out Motion',
    description: 'Maximum perimeter spacing along 3-point line arc',
    players: [
      { id: '1', position: 'PG', x: 50, y: 78 },
      { id: '2', position: 'SG', x: 82, y: 55 },
      { id: '3', position: 'SF', x: 18, y: 55 },
      { id: '4', position: 'PF', x: 88, y: 24 },
      { id: '5', position: 'C',  x: 12, y: 24 },
    ],
  },
  highPnR: {
    name: 'High Pick & Roll',
    description: 'Spread floor with Center setting ball screen at top of key',
    players: [
      { id: '1', position: 'PG', x: 50, y: 75 },
      { id: '2', position: 'SG', x: 82, y: 52 },
      { id: '3', position: 'SF', x: 18, y: 52 },
      { id: '4', position: 'PF', x: 75, y: 25 },
      { id: '5', position: 'C',  x: 52, y: 64 },
    ],
  },
  oneFourHigh: {
    name: '1-4 High',
    description: 'Flat line across free-throw extended creating backdoor space',
    players: [
      { id: '1', position: 'PG', x: 50, y: 78 },
      { id: '2', position: 'SG', x: 84, y: 48 },
      { id: '3', position: 'SF', x: 16, y: 48 },
      { id: '4', position: 'PF', x: 36, y: 46 },
      { id: '5', position: 'C',  x: 64, y: 46 },
    ],
  },
  boxInbound: {
    name: 'Box Inbound (BLOB)',
    description: 'Baseline stack for quick screens and weakside corner shot',
    players: [
      { id: '1', position: 'PG', x: 36, y: 38 },
      { id: '2', position: 'SG', x: 64, y: 38 },
      { id: '3', position: 'SF', x: 50, y: 8 }, // Inbounder out of bounds at baseline
      { id: '4', position: 'PF', x: 36, y: 22 },
      { id: '5', position: 'C',  x: 64, y: 22 },
    ],
  },
  spainPnR: {
    name: 'Spain PnR (Stack)',
    description: 'Ball screen followed by backscreen on the dropping big defender',
    players: [
      { id: '1', position: 'PG', x: 50, y: 75 },
      { id: '2', position: 'SG', x: 50, y: 42 }, // Backscreener
      { id: '3', position: 'SF', x: 18, y: 52 },
      { id: '4', position: 'PF', x: 86, y: 25 },
      { id: '5', position: 'C',  x: 52, y: 62 }, // On-ball screener
    ],
  },
};

// Preset Court Zones for Quick Positioning
const COURT_ZONES: Record<string, { x: number; y: number }> = {
  topOfKey: { x: 50, y: 75 },
  leftWing: { x: 20, y: 55 },
  rightWing: { x: 80, y: 55 },
  leftCorner: { x: 12, y: 22 },
  rightCorner: { x: 88, y: 22 },
  highPost: { x: 40, y: 45 },
  lowBlock: { x: 34, y: 22 },
  rimFinish: { x: 50, y: 16 },
};

// Default Initial Play Builder Setup
function createDefaultSteps(name = 'Tactical Combination'): PlayStep[] {
  const horns = PRESET_ALIGNMENTS.horns.players;
  return [
    {
      step: 0,
      description: `${name} - Phase 1: Horns offensive alignment & entry pass read`,
      players: horns.map((p) => ({
        ...p,
        hasBall: p.id === '1',
        action: p.id === '1' ? 'Initiate offense' : 'Floor spacing & position',
      })),
      ball: { x: 50, y: 76, holder: '1' },
    },
    {
      step: 1,
      description: `${name} - Phase 2: Double elbow screen & downhill paint attack`,
      players: [
        { id: '1', position: 'PG', x: 42, y: 52, hasBall: true, action: 'Dribble drive off screen' },
        { id: '2', position: 'SG', x: 14, y: 22, hasBall: false, action: 'Corner drift' },
        { id: '3', position: 'SF', x: 88, y: 35, hasBall: false, action: 'Wing shake' },
        { id: '4', position: 'PF', x: 58, y: 58, hasBall: false, action: 'Pop to perimeter 3pt' },
        { id: '5', position: 'C',  x: 48, y: 32, hasBall: false, action: 'Roll hard to basket' },
      ],
      ball: { x: 42, y: 52, holder: '1' },
    },
    {
      step: 2,
      description: `${name} - Phase 3: Lob finish to rolling center or kickout 3pt`,
      players: [
        { id: '1', position: 'PG', x: 38, y: 42, hasBall: false, action: 'Alley-oop delivery pass' },
        { id: '2', position: 'SG', x: 12, y: 22, hasBall: false, action: 'Weakside corner option' },
        { id: '3', position: 'SF', x: 85, y: 42, hasBall: false, action: 'Safety outlet' },
        { id: '4', position: 'PF', x: 65, y: 65, hasBall: false, action: 'Pick and pop 3-pointer' },
        { id: '5', position: 'C',  x: 50, y: 15, hasBall: true,  action: 'Slam dunk / rim finish' },
      ],
      ball: { x: 50, y: 15, holder: '5' },
    },
  ];
}

export default function AdvancedPlayCreatorDialog({
  open,
  onOpenChange,
  onPlayCreated,
  teams = [],
}: AdvancedPlayCreatorDialogProps) {
  const t = useTranslations('Combinations');

  // Form Metadata
  const [playName, setPlayName] = useState<string>('Tbilisi Horns Motion');
  const [category, setCategory] = useState<string>('Set Play');
  const [targetTeam, setTargetTeam] = useState<string>('all');
  const [scoringOption, setScoringOption] = useState<string>('Roll to Rim or Corner 3-pointer');
  const [description, setDescription] = useState<string>(
    'High horns double ball-screen that forces defensive drop coverage, opening an alley-oop finish or kickout.'
  );

  // Steps Sequencer
  const [steps, setSteps] = useState<PlayStep[]>(() => createDefaultSteps(playName));
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('1');

  // Motion Animation Preview State
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Court Canvas Ref for mouse drag positioning
  const courtCanvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const draggedPlayerIdRef = useRef<string | null>(null);

  const currentStep = steps[currentStepIdx] || steps[0];
  const selectedPlayer = currentStep.players.find((p) => p.id === selectedPlayerId) || currentStep.players[0];

  // Stop animation if open state changes
  useEffect(() => {
    if (!open) {
      setIsPreviewing(false);
    }
  }, [open]);

  // Animation Preview Loop
  useEffect(() => {
    if (!isPreviewing) return;

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % steps.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isPreviewing, steps.length]);

  // Update specific player in current step
  const updatePlayerInCurrentStep = useCallback(
    (playerId: string, updates: Partial<PlayerNode>) => {
      setSteps((prev) => {
        const next = [...prev];
        const step = { ...next[currentStepIdx] };
        step.players = step.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p));

        // If updating hasBall or position, also sync ball position
        if (updates.hasBall) {
          step.players = step.players.map((p) => ({
            ...p,
            hasBall: p.id === playerId,
          }));
          const ballCarrier = step.players.find((p) => p.id === playerId);
          if (ballCarrier) {
            step.ball = { x: ballCarrier.x, y: ballCarrier.y, holder: playerId };
          }
        } else if (step.ball.holder === playerId && (updates.x !== undefined || updates.y !== undefined)) {
          step.ball = {
            ...step.ball,
            x: updates.x ?? step.ball.x,
            y: updates.y ?? step.ball.y,
          };
        }

        next[currentStepIdx] = step;
        return next;
      });
    },
    [currentStepIdx]
  );

  // Apply a Preset Alignment to Current Step
  const applyPresetAlignment = (presetKey: string) => {
    const preset = PRESET_ALIGNMENTS[presetKey];
    if (!preset) return;

    setSteps((prev) => {
      const next = [...prev];
      const step = { ...next[currentStepIdx] };
      const ballHolderId = step.ball.holder || '1';

      step.players = preset.players.map((presetP) => {
        const existing = step.players.find((p) => p.id === presetP.id);
        const hasBall = presetP.id === ballHolderId;
        return {
          id: presetP.id,
          position: presetP.position,
          x: presetP.x,
          y: presetP.y,
          hasBall,
          action: existing?.action || (hasBall ? 'Ball handler initiate' : 'Floor spacing'),
        };
      });

      const carrier = step.players.find((p) => p.id === ballHolderId) || step.players[0];
      step.ball = { x: carrier.x, y: carrier.y, holder: carrier.id };

      next[currentStepIdx] = step;
      return next;
    });
  };

  // Add a new tactical phase/step
  const handleAddPhase = () => {
    if (steps.length >= 5) return;

    setSteps((prev) => {
      const lastStep = prev[prev.length - 1];
      const newStepNum = prev.length;
      const newStep: PlayStep = {
        step: newStepNum,
        description: `${playName} - Phase ${newStepNum + 1}: Follow-up rotation and finish`,
        players: lastStep.players.map((p) => ({ ...p })),
        ball: { ...lastStep.ball },
      };
      return [...prev, newStep];
    });
    setCurrentStepIdx(steps.length);
  };

  // Remove current phase/step
  const handleRemovePhase = (indexToRemove: number) => {
    if (steps.length <= 1) return;

    setSteps((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove).map((step, idx) => ({
        ...step,
        step: idx,
      }));
      return next;
    });
    setCurrentStepIdx((prev) => Math.max(0, Math.min(prev, steps.length - 2)));
  };

  // Handle Court Drag / Click Interactions
  const handlePointerDown = (playerId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedPlayerId(playerId);
    isDraggingRef.current = true;
    draggedPlayerIdRef.current = playerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !draggedPlayerIdRef.current || !courtCanvasRef.current) return;

    const rect = courtCanvasRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.round(Math.max(8, Math.min(92, rawX)));
    const clampedY = Math.round(Math.max(8, Math.min(92, rawY)));

    updatePlayerInCurrentStep(draggedPlayerIdRef.current, {
      x: clampedX,
      y: clampedY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    draggedPlayerIdRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Click on empty court space to teleport selected player
  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current || !courtCanvasRef.current || !selectedPlayerId) return;

    const rect = courtCanvasRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.round(Math.max(8, Math.min(92, rawX)));
    const clampedY = Math.round(Math.max(8, Math.min(92, rawY)));

    updatePlayerInCurrentStep(selectedPlayerId, {
      x: clampedX,
      y: clampedY,
    });
  };

  // Save Play to Backend
  const handleSavePlay = async () => {
    if (!playName.trim() || !description.trim()) {
      setErrorMsg('Please specify both combination name and tactical instructions.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload = {
        name: playName,
        category,
        team: targetTeam === 'all' ? undefined : targetTeam,
        description: `${description}${scoringOption ? ` • Primary Option: ${scoringOption}` : ''}`,
        steps: steps.map((s, idx) => ({
          step: idx,
          description: s.description || `${playName} - Phase ${idx + 1}`,
          players: s.players.map((p) => ({
            id: p.id,
            position: p.position,
            x: p.x,
            y: p.y,
            hasBall: p.hasBall,
            action: p.action || '',
          })),
          ball: {
            x: s.ball.x,
            y: s.ball.y,
            holder: s.ball.holder || '1',
          },
        })),
      };

      const res = await fetch('/api/coach/plays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save tactical play');
      }

      onPlayCreated?.();
      onOpenChange(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving play');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[94vh] p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t('studioTitle')}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold tracking-wider"
                >
                  Interactive Chalkboard
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('studioSubtitle')}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewing(!isPreviewing)}
              className={`h-8 text-xs font-semibold ${
                isPreviewing
                  ? 'bg-amber-500/15 text-amber-600 border-amber-500/40'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {isPreviewing ? (
                <>
                  <Pause className="mr-1.5 h-3.5 w-3.5 fill-current" /> {t('stopPreview')}
                </>
              ) : (
                <>
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current text-amber-500" /> {t('previewAnimation')}
                </>
              )}
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Modal Body: 2-Column Studio Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Play Configuration & Sequencer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Play Metadata Fields */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-850/40 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="studio-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('playName')} *
                </Label>
                <Input
                  id="studio-name"
                  value={playName}
                  onChange={(e) => setPlayName(e.target.value)}
                  placeholder="e.g. Tbilisi Hammer Screen"
                  className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="studio-category" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('category')}
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="studio-category" className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Set Play">Set Play</SelectItem>
                      <SelectItem value="Motion Offense">Motion Offense</SelectItem>
                      <SelectItem value="Pick & Roll">Pick & Roll</SelectItem>
                      <SelectItem value="Inbound">Inbound</SelectItem>
                      <SelectItem value="Zone Defense">Zone Defense</SelectItem>
                      <SelectItem value="Fastbreak">Fastbreak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="studio-team" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('targetSquad')}
                  </Label>
                  <Select value={targetTeam} onValueChange={setTargetTeam}>
                    <SelectTrigger id="studio-team" className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{t('allSquads')}</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="studio-scoring" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('scoringOption')}
                </Label>
                <Input
                  id="studio-scoring"
                  value={scoringOption}
                  onChange={(e) => setScoringOption(e.target.value)}
                  placeholder={t('scoringOptionPlaceholder')}
                  className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="studio-desc" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('description')} *
                </Label>
                <Textarea
                  id="studio-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Coaching reads, defensive counters, and execution rules..."
                  className="text-xs rounded-xl bg-white dark:bg-slate-900 resize-none"
                />
              </div>
            </div>

            {/* Quick Alignment Presets Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  {t('alignmentTemplates')}
                </Label>
                <span className="text-[10px] text-slate-400">1-click chalkboard layout</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(PRESET_ALIGNMENTS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPresetAlignment(key)}
                    className="p-2 rounded-xl text-left border border-slate-200/80 bg-white hover:border-amber-500/40 hover:bg-amber-500/5 dark:border-slate-800 dark:bg-slate-900 transition-all text-xs group"
                  >
                    <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 group-hover:text-amber-600 truncate">
                      {p.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Phase / Step Sequencer Tabs */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-850/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Phase Sequence ({steps.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePhase(currentStepIdx)}
                      className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title={t('removePhase')}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}

                  {steps.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPhase}
                      className="h-7 px-2.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> {t('addPhase')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Phase Switcher Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
                {steps.map((step, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentStepIdx(idx);
                      setIsPreviewing(false);
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      currentStepIdx === idx
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {t('phase')} {idx + 1}
                  </button>
                ))}
              </div>

              {/* Current Step Description Input */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('phase')} {currentStepIdx + 1} Instructions
                </Label>
                <Input
                  value={currentStep.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSteps((prev) => {
                      const next = [...prev];
                      next[currentStepIdx] = { ...next[currentStepIdx], description: val };
                      return next;
                    });
                  }}
                  placeholder="e.g. Point guard initiates pick-and-roll at the top"
                  className="h-8 text-xs rounded-xl bg-white dark:bg-slate-900"
                />
              </div>

              {/* Ball Carrier Selector */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('ballHandler')}:
                </Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {currentStep.players.map((p) => {
                    const cfg = PLAYER_CONFIG[p.id];
                    const isHolder = currentStep.ball.holder === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => updatePlayerInCurrentStep(p.id, { hasBall: true })}
                        className={`p-1.5 rounded-xl border text-center transition-all ${
                          isHolder
                            ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30'
                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 font-mono text-[11px] font-bold">
                          <span>{p.position}</span>
                          {isHolder && <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player Tactical Action Input */}
              {selectedPlayer && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">
                      Selected: <strong className="text-amber-600 dark:text-amber-400">{selectedPlayer.position} #{selectedPlayer.id}</strong>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      X: {selectedPlayer.x}%, Y: {selectedPlayer.y}%
                    </span>
                  </div>

                  <Input
                    value={selectedPlayer.action}
                    onChange={(e) => updatePlayerInCurrentStep(selectedPlayer.id, { action: e.target.value })}
                    placeholder={t('playerActionPlaceholder')}
                    className="h-8 text-xs rounded-xl bg-white dark:bg-slate-900"
                  />

                  {/* Preset Action Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      'On-Ball Screen',
                      'Roll to Rim',
                      'Pop to 3PT',
                      'Backdoor Cut',
                      'Dribble Drive',
                      'Spot Up 3pt',
                      'Pass',
                    ].map((act) => (
                      <button
                        key={act}
                        type="button"
                        onClick={() => updatePlayerInCurrentStep(selectedPlayer.id, { action: act })}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500/20 hover:text-amber-700 transition-colors"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Interactive Half-Court Chalkboard (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Move className="h-3.5 w-3.5 text-amber-500" />
                Interactive Tactical Chalkboard
              </span>
              <span className="text-[11px] text-slate-400">
                {t('chalkboardInstructions')}
              </span>
            </div>

            {/* Tactical Canvas Container */}
            <div
              ref={courtCanvasRef}
              onClick={handleCourtClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full aspect-[4/3] max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl select-none cursor-crosshair"
            >
              {/* Floor Wood Texture */}
              <div
                className="absolute inset-0 opacity-15 bg-repeat pointer-events-none"
                style={{ backgroundImage: 'url("/assets/images/floor.png")', backgroundSize: '240px' }}
              />

              {/* Court Boundary Lines & Markings (Standard Half-Court Orientation) */}
              <div className="absolute inset-3 pointer-events-none">
                {/* Baseline (Top - Basket at top) */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/30" />
                <div className="absolute left-0 top-0 h-full w-0.5 bg-amber-500/30" />
                <div className="absolute right-0 top-0 h-full w-0.5 bg-amber-500/30" />
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500/40" />

                {/* Center Circle Arc at half court */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-14 border-t-2 border-l-2 border-r-2 rounded-t-full border-amber-500/30" />

                {/* Paint / Key */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-44 border-b-2 border-l-2 border-r-2 border-amber-500/40 bg-amber-500/5" />

                {/* Free Throw Circle */}
                <div className="absolute top-44 left-1/2 -translate-x-1/2 w-28 h-28 border-2 border-dashed rounded-full border-amber-500/30 -translate-y-1/2" />
                <div className="absolute top-44 left-1/2 -translate-x-1/2 w-44 h-0.5 bg-amber-500/40" />

                {/* Three-Point Arc */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[210px] border-b-2 border-l-2 border-r-2 rounded-b-full border-slate-500/50" />

                {/* Backboard & Rim */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-white rounded-full shadow" />
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-orange-500 shadow-sm" />

                {/* Watermark */}
                <div className="absolute bottom-3 left-3 text-[10px] font-mono font-bold tracking-widest text-slate-700 uppercase">
                  BBA Chalkboard Studio • Phase {currentStepIdx + 1}/{steps.length}
                </div>
              </div>

              {/* Interactive Player Tokens */}
              <AnimatePresence>
                {currentStep.players.map((p) => {
                  const cfg = PLAYER_CONFIG[p.id] || PLAYER_CONFIG['1'];
                  const isSelected = selectedPlayerId === p.id;
                  const isBallCarrier = currentStep.ball.holder === p.id;

                  return (
                    <motion.div
                      key={p.id}
                      onPointerDown={(e) => handlePointerDown(p.id, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlayerId(p.id);
                      }}
                      initial={false}
                      animate={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        x: '-50%',
                        y: '-50%',
                        scale: isSelected ? 1.15 : 1,
                      }}
                      transition={{
                        type: 'spring',
                        damping: 24,
                        stiffness: 140,
                        duration: 0.6,
                      }}
                      className={`absolute flex items-center justify-center w-11 h-11 rounded-full cursor-grab active:cursor-grabbing font-mono font-bold text-xs select-none shadow-xl z-20 border-2 ${
                        isSelected
                          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 border-white'
                          : 'border-white/80 dark:border-slate-900'
                      } ${cfg.bg} ${cfg.text}`}
                      style={{ touchAction: 'none' }}
                      title={`${cfg.name} (${p.position}) - Drag or click to reposition`}
                    >
                      <span className="pointer-events-none">{p.position}</span>

                      {/* Ball Carrier Indicator */}
                      {isBallCarrier && (
                        <motion.div
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                          className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-md flex items-center justify-center"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </motion.div>
                      )}

                      {/* Action Callout Tooltip */}
                      {p.action && (
                        <div className="absolute top-full mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] whitespace-nowrap border border-slate-700 pointer-events-none z-30">
                          {p.action}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Quick Court Zone Teleport Controls */}
            {selectedPlayer && (
              <div className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Quick Zone Placement for <strong className="text-amber-600 dark:text-amber-400">{selectedPlayer.position}</strong>:
                  </span>
                  <span className="text-[10px] text-slate-400">Instantly snap to standard court spots</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(COURT_ZONES).map(([zoneKey, coord]) => (
                    <button
                      key={zoneKey}
                      type="button"
                      onClick={() => updatePlayerInCurrentStep(selectedPlayer.id, { x: coord.x, y: coord.y })}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500/40 hover:text-amber-600 transition-colors shadow-2xs"
                    >
                      {t(zoneKey) || zoneKey}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Configured <strong>{steps.length} tactical phases</strong> • Ready for playback walkthrough
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-xs rounded-xl"
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSavePlay}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-[1.02]"
            >
              {saving ? 'Saving...' : t('savePlay')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
