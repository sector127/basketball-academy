'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import BasketballPlaysVisualizer, {
  type VisualizerPlay,
} from '@/components/BasketballPlaysVisualizer';
import AdvancedPlayCreatorDialog from '@/components/AdvancedPlayCreatorDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  Plus,
  PlayCircle,
  Filter,
  Layers,
} from 'lucide-react';
import Loader from '@/components/Loader';

export interface ExtendedPlay extends VisualizerPlay {
  _id?: string;
}

interface PlaysApiResponse {
  plays?: ExtendedPlay[];
}

interface TeamOption {
  _id: string;
  name: string;
}

const fetcher = async (url: string): Promise<PlaysApiResponse> => {
  const res = await fetch(url);
  return res.ok ? res.json() : { plays: [] };
};

const teamsFetcher = async (url: string): Promise<TeamOption[]> => {
  const res = await fetch(url);
  return res.ok ? res.json() : [];
};

const CATEGORIES = [
  'All',
  'Set Play',
  'Motion Offense',
  'Pick & Roll',
  'Inbound',
  'Zone Defense',
  'Custom',
] as const;

type CategoryType = (typeof CATEGORIES)[number];

export default function CombinationsPage() {
  const t = useTranslations('Combinations');
  const { toast } = useToast();
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toLowerCase();
  // This page is shared read-only with players; only coaches and admins create plays
  const canCreatePlays = userRole === 'admin' || userRole === 'coach';
  const { data, isLoading } = useSWR<PlaysApiResponse>('/api/coach/plays', fetcher);
  const { data: teamsData } = useSWR<TeamOption[]>(
    canCreatePlays ? '/api/coach/teams' : null,
    teamsFetcher
  );
  const plays: ExtendedPlay[] = Array.isArray(data?.plays) ? data.plays : [];
  const teams: TeamOption[] = Array.isArray(teamsData) ? teamsData : [];

  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');
  const [selectedPlay, setSelectedPlay] = useState<ExtendedPlay | null>(null);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredPlays = plays.filter((p) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Custom') return p.isCustom;
    return p.category === activeCategory;
  });

  const handleOpenPlay = (play: ExtendedPlay) => {
    setSelectedPlay(play);
    setIsVisualizerOpen(true);
  };

  const handlePlayCreated = () => {
    mutate('/api/coach/plays');
    toast({
      title: 'Tactical Play Created',
      description: 'Combination saved to academy playbook.',
      variant: 'default',
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        badge={`${plays.length} Playbook Sets`}
        icon={BookOpen}
        actions={
          canCreatePlays && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md rounded-xl text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> {t('createPlay')}
            </Button>
          )
        }
      />

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
          <Filter className="h-3.5 w-3.5" /> Filter Sets:
        </span>
        {CATEGORIES.map((cat) => {
          const catKeyMap: Record<CategoryType, string> = {
            'All': 'all',
            'Set Play': 'setPlay',
            'Motion Offense': 'motionOffense',
            'Pick & Roll': 'pickAndRoll',
            'Inbound': 'inbound',
            'Zone Defense': 'zoneDefense',
            'Custom': 'custom',
          };
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-500/30'
              }`}
            >
              {t(`categories.${catKeyMap[cat]}`) || cat}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader />
        </div>
      ) : filteredPlays.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <Layers className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Plays in this Category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Design a custom chalkboard set play to enhance your team&apos;s offensive execution.
          </p>
          {canCreatePlays && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              size="sm"
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Design Play Now
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlays.map((play, index) => (
            <div
              key={play._id || index}
              onClick={() => handleOpenPlay(play)}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90 cursor-pointer"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-950 dark:border-slate-800 mb-4 flex items-center justify-center">
                  {/* Authentic Wood Floor Background */}
                  <div
                    className="absolute inset-0 opacity-25 bg-repeat"
                    style={{ backgroundImage: 'url("/assets/images/floor.png")', backgroundSize: '160px' }}
                  />

                  {/* Tactical Court Chalkboard Diagram */}
                  <svg
                    viewBox="0 0 300 180"
                    className="absolute inset-0 w-full h-full opacity-65 group-hover:scale-105 group-hover:opacity-95 transition-all duration-300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="10" y="10" width="280" height="160" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
                    <path d="M100 10 C100 115, 200 115, 200 10" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.5" />
                    <rect x="120" y="10" width="60" height="70" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" fill="#f59e0b" fillOpacity="0.08" />
                    <circle cx="150" cy="80" r="20" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
                    <circle cx="150" cy="24" r="5" stroke="#f97316" strokeWidth="2" />
                    {/* Player Tokens & Tactical Pass/Cut Scheme */}
                    <circle cx="150" cy="120" r="7" fill="#f59e0b" />
                    <text x="150" y="123" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">1</text>
                    <circle cx="75" cy="85" r="7" fill="#f59e0b" />
                    <text x="75" y="88" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">2</text>
                    <circle cx="225" cy="85" r="7" fill="#f59e0b" />
                    <text x="225" y="88" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">3</text>
                    <circle cx="105" cy="45" r="7" fill="#f59e0b" />
                    <text x="105" y="48" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">4</text>
                    <circle cx="195" cy="45" r="7" fill="#f59e0b" />
                    <text x="195" y="48" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">5</text>
                    {/* Tactical Passing/Movement Line */}
                    <path d="M150 110 Q170 80, 190 55" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
                    <polygon points="190,55 186,63 193,61" fill="#fbbf24" />
                  </svg>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-400 border-amber-500/30"
                    >
                      {play.category || 'Offense'}
                    </Badge>
                    {play.isCustom && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Coach Custom
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {play.name}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {play.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-[11px]">
                  {play.steps?.length || 3} animation steps
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPlay(play);
                  }}
                  className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:text-amber-500 transition-colors"
                >
                  <PlayCircle className="h-4 w-4" /> Watch Play
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visualizer Modal */}
      <Dialog open={isVisualizerOpen} onOpenChange={setIsVisualizerOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl">
          <DialogTitle className="sr-only">
            {selectedPlay?.name || 'Tactical Play Visualizer'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Interactive court walkthrough. Use playback controls or step buttons to analyze tactical movements.
          </DialogDescription>
          {selectedPlay && <BasketballPlaysVisualizer combination={selectedPlay} />}
        </DialogContent>
      </Dialog>

      {/* Advanced Custom Play Creator Studio Dialog */}
      <AdvancedPlayCreatorDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        teams={teams}
        onPlayCreated={handlePlayCreated}
      />
    </DashboardLayout>
  );
}
