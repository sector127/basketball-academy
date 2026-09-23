'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Loader from '@/components/Loader';
import DashboardLayout from '@/components/DashboardLayout';

export default function UniversalPlayerDetailPage({ params }) {
  const { playerId } = React.use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const role = session?.user?.role;
    if (role === 'coach') {
      router.replace(`/dashboard/coach/players/${playerId}`);
    } else {
      router.replace(`/dashboard/admin/players/${playerId}`);
    }
  }, [playerId, session, status, router]);

  return (
    <DashboardLayout>
      <div className="flex h-64 items-center justify-center">
        <Loader />
      </div>
    </DashboardLayout>
  );
}
