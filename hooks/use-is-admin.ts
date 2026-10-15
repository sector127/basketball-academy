import { useSession } from 'next-auth/react';

// Staff can view the admin pages but only admins can change data,
// so admin-page write controls are hidden unless this returns true.
export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  return session?.user?.role?.toLowerCase() === 'admin';
}
