'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Loader from '@/components/Loader';
import DashboardLayout from '@/components/DashboardLayout';

export default function UniversalGamesCreateRedirect() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    router.replace('/dashboard/admin/games/create');
  }, [status, router]);

  return (
    <DashboardLayout>
      <div className="flex h-64 items-center justify-center">
        <Loader />
      </div>
    </DashboardLayout>
  );
}
