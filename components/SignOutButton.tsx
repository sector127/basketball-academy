'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export interface SignOutButtonProps {
  className?: string;
}

const SignOutButton: React.FC<SignOutButtonProps> = ({ className }) => {
  const t = useTranslations('Dashboard');

  const handleSignOut = async () => {
    await signOut({ redirectTo: '/login' });
  };

  return (
    <button
      onClick={handleSignOut}
      className={className || 'cursor-pointer text-black dark:text-slate-50'}
    >
      {t('signOut')}
    </button>
  );
};

export default SignOutButton;
