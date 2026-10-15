'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import PlayerForm from '@/components/PlayerForm';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AddPlayerPage() {
  const t = useTranslations('Players');
  return (
    <DashboardLayout>
      <PageHeader
        title={t('registerPlayer')}
        subtitle={t('registerSubtitle')}
        badge={t('playerIntake')}
        icon={UserPlus}
      />
      <div className="max-w-4xl mx-auto py-2">
        <PlayerForm isEditing={false} />
      </div>
    </DashboardLayout>
  );
}
