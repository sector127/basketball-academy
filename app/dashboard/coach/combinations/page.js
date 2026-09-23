'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import BasketballPlaysVisualizer from '@/components/BasketballPlaysVisualizer';
import { combinations } from '@/lib/combinationsCheatSheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { BookOpen, Eye, PlayCircle } from 'lucide-react';

export default function CombinationsPage() {
  const [combination, setCombination] = useState(combinations[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCombinationSelection = (comb) => {
    setCombination(comb);
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Tactical Playbook"
        subtitle="Set plays, motion offense, inbound strategies, and animated court walkthroughs"
        badge={`${combinations.length} Installed Sets`}
        icon={BookOpen}
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {combinations.length > 0 ? (
            combinations.map((comb, index) => (
              <div
                key={index}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Play #{index + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">BBA Tactical</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {comb.name}
                  </h3>

                  <div className="my-4 flex h-32 w-full items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                    <Image
                      src="/assets/images/logo.png"
                      alt="BBA play"
                      width={80}
                      height={80}
                      className="object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Court diagram</span>
                  <Button
                    size="sm"
                    onClick={() => handleCombinationSelection(comb)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-sm"
                  >
                    <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Visualize
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No combinations found.</p>
          )}
        </div>

        {/* Visualizer Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl h-[90vh] overflow-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-amber-500" />
                {combination?.name} &bull; Tactical Breakdown
              </DialogTitle>
            </DialogHeader>
            <div className="p-2">
              <BasketballPlaysVisualizer combination={combination} />
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
