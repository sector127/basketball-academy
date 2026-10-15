'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';

import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

// Icons
import {
  BadgeCheck as LuBadgeCheck,
  Bell as LuBell,
  ChevronsUpDown,
  ChevronsDown as LuChevronsDown,
  LogOut as LuLogOut,
  Menu as LuMenu,
  Search as LuSearch,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

// Custom components
import ThemeToggle from '@/components/DarkModeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import Breadcrumbs from '@/components/Breadcrumbs';
import { navConfig, type NavItem } from '@/lib/navConfig';
import { cn } from '@/lib/utils';
import type { Session } from 'next-auth';

export interface NavItemWithLabel extends NavItem {
  label: string;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export type SessionUser = NonNullable<Session['user']>;

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const { data: session } = useSession();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  // Initialize client-side state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('isSidebarOpen');
      if (stored !== null) {
        setIsSidebarOpen(JSON.parse(stored) as boolean);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  // Update user state when session changes
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);

  // Compute navItems based on user role
  const navItems = useMemo<NavItemWithLabel[]>(() => {
    const role = user?.role?.toLowerCase();
    if (role && navConfig[role]) {
      return navConfig[role].map((item) => ({
        ...item,
        label: t(item.labelKey),
      }));
    }
    return [];
  }, [user?.role, t]);

  // Toggle sidebar and persist state
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('isSidebarOpen', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950 font-sans">
        {/* Header */}
        <Header
          user={user}
          t={t}
          toggleSidebar={toggleSidebar}
          navItems={navItems}
          pathname={pathname}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              'relative hidden shrink-0 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-md transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/80 lg:flex h-full',
              isSidebarOpen ? 'w-64' : 'w-20'
            )}
          >
            {/* Collapse toggle row - fixed height prevents vertical layout shifts */}
            <div
              className={cn(
                'flex h-14 items-center border-b border-slate-200/70 dark:border-slate-800/80 transition-all',
                isSidebarOpen ? 'justify-between px-4' : 'justify-center px-2'
              )}
            >
              {isSidebarOpen ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                    {t('navigation') || 'Navigation'}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleSidebar}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                        aria-label={t('collapseSidebar') || 'Collapse sidebar'}
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">
                      {t('collapseSidebar') || 'Collapse sidebar'} (Ctrl+B)
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleSidebar}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                      aria-label={t('expandSidebar') || 'Expand sidebar'}
                    >
                      <PanelLeftOpen className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="text-xs font-semibold">
                    {t('expandSidebar') || 'Expand sidebar'} (Ctrl+B)
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto p-3" role="navigation">
              <SidebarNavItems
                navItems={navItems}
                pathname={pathname}
                hoveredIcon={hoveredIcon}
                setHoveredIcon={setHoveredIcon}
                isSidebarOpen={isSidebarOpen}
              />
            </nav>

            {/* Sidebar User Menu Footer */}
            <div className="mt-auto border-t border-slate-200/70 p-3 dark:border-slate-800/80">
              <SidebarUserMenu user={user} t={t} isSidebarOpen={isSidebarOpen} />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Breadcrumbs />
            </div>
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper to resolve role-specific home route
function getRoleDashboardHref(role?: string | null): string {
  const r = role?.toLowerCase();
  if (r === 'coach') return '/dashboard/coach';
  if (r === 'player') return '/dashboard/player';
  if (r === 'guardian') return '/dashboard/guardian';
  return '/dashboard';
}

interface HeaderProps {
  user: SessionUser | null;
  t: (key: string) => string;
  navItems: NavItemWithLabel[];
  pathname: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

// Header Component
function Header({ user, t, navItems, pathname }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const homeHref = getRoleDashboardHref(user?.role);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        {/* Mobile menu sheet */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                aria-label="Open mobile menu"
              >
                <LuMenu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">
              <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Access academy dashboard sections and user profile</SheetDescription>
              <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-200/80 dark:border-slate-800">
                <Image
                  src="/assets/images/logo.png"
                  alt="BBA-logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <div className="flex flex-col">
                  <span className="font-bold tracking-tight text-slate-900 dark:text-slate-50 text-sm">
                    Brooklyn Academy
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 -mt-0.5">
                    Tbilisi Branch
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <SidebarNavItems
                  navItems={navItems}
                  pathname={pathname}
                  isSidebarOpen={true}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
              <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/80 mt-auto">
                <SidebarUserMenu
                  user={user}
                  t={t}
                  isSidebarOpen={true}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand Link */}
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 rounded-xl"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/assets/images/logo.png"
              alt="BBA-logo"
              width={26}
              height={26}
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Brooklyn Academy
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 -mt-0.5">
              Tbilisi Branch
            </span>
          </div>
        </Link>
      </div>

      {/* Right utility items */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden lg:block">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            className="w-48 xl:w-56 pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 rounded-xl focus-visible:ring-amber-500/40"
            placeholder={t('searchPlaceholder') || t('search') || 'Search...'}
            aria-label="Search"
          />
        </div>

        {/* Global Language Switcher */}
        <LanguageSelector />

        {/* Dark / Light Mode Switcher */}
        <ThemeToggle />

        {/* Compact User Menu in Header */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />
        <HeaderUserMenu user={user} t={t} />
      </div>
    </header>
  );
}

interface HeaderUserMenuProps {
  user: SessionUser | null;
  t: (key: string) => string;
}

// Compact User Menu for the Top Header
function HeaderUserMenu({ user, t }: HeaderUserMenuProps) {
  const role = (user?.role || 'staff').toLowerCase();
  const roleDisplay = t(`roles.${role}`) || role;
  const profileHref = getRoleDashboardHref(user?.role);

  const handleSignOut = async () => {
    await signOut({ redirectTo: '/login' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2.5 rounded-2xl p-1 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          aria-label={t('account') || 'Account menu'}
        >
          <div className="hidden text-right md:block">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 uppercase font-bold tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0"
              >
                {role}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
              {user?.email}
            </p>
          </div>

          <Avatar className="h-8 w-8 ring-2 ring-amber-500/30">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name || 'User avatar'} />
            <AvatarFallback className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || 'BBA'}
            </AvatarFallback>
          </Avatar>

          <LuChevronsDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-64 p-2 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 bg-white z-50"
      >
        {/* User Profile Card */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-amber-500/30 shrink-0">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name || 'User avatar'} />
              <AvatarFallback className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase() || 'BBA'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.email}
              </p>
              <div className="mt-1">
                <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {roleDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem asChild>
            <Link
              href={profileHref}
              className="flex items-center rounded-xl p-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LuBadgeCheck className="mr-2.5 h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <div className="font-semibold">{t('accountProfile') || 'Account Profile'}</div>
                <div className="text-[10px] text-slate-400">{t('accountProfileDesc') || 'Academy role & dashboard'}</div>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/calendar"
              className="flex items-center rounded-xl p-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LuBell className="mr-2.5 h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <div className="font-semibold">{t('scheduleFixtures') || 'Schedule & Fixtures'}</div>
                <div className="text-[10px] text-slate-400">{t('scheduleFixturesDesc') || 'Academy calendar events'}</div>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer rounded-xl p-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 focus:bg-rose-50 dark:focus:bg-rose-950/40 focus:text-rose-600 transition-colors"
        >
          <LuLogOut className="mr-2.5 h-4 w-4 shrink-0" />
          <span>{t('signOut') || 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SidebarUserMenuProps {
  user: SessionUser | null;
  t: (key: string) => string;
  isSidebarOpen: boolean;
  onNavigate?: () => void;
}

// Sidebar User Menu Component for the bottom of the sidebar (Desktop + Mobile)
function SidebarUserMenu({ user, t, isSidebarOpen, onNavigate }: SidebarUserMenuProps) {
  const role = (user?.role || 'staff').toLowerCase();
  const roleDisplay = t(`roles.${role}`) || role;
  const profileHref = getRoleDashboardHref(user?.role);

  const handleSignOut = async () => {
    await signOut({ redirectTo: '/login' });
  };

  return (
    <DropdownMenu>
      {isSidebarOpen ? (
        <DropdownMenuTrigger asChild>
          <button
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 group"
            aria-label={t('account') || 'Account menu'}
          >
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-amber-500/30">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name || 'User avatar'} />
              <AvatarFallback className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase() || 'BBA'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'User'}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 uppercase font-bold tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0"
                >
                  {role}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.email}
              </p>
            </div>

            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>
        </DropdownMenuTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                aria-label={user?.name || 'User profile'}
              >
                <Avatar className="h-9 w-9 ring-2 ring-amber-500/30 transition-transform hover:scale-105">
                  <AvatarImage src={user?.image ?? undefined} alt={user?.name || 'User avatar'} />
                  <AvatarFallback className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    {user?.name?.slice(0, 2).toUpperCase() || 'BBA'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="text-xs font-semibold py-1.5 px-3">
            {user?.name || 'Account'} ({roleDisplay})
          </TooltipContent>
        </Tooltip>
      )}

      <DropdownMenuContent
        side={isSidebarOpen ? 'top' : 'right'}
        align={isSidebarOpen ? 'start' : 'end'}
        sideOffset={12}
        className="w-64 p-2 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 bg-white z-50"
      >
        {/* User Profile Card Header */}
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-amber-500/30 shrink-0">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name || 'User avatar'} />
              <AvatarFallback className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase() || 'BBA'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.email}
              </p>
              <div className="mt-1">
                <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {roleDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem asChild>
            <Link
              href={profileHref}
              onClick={onNavigate}
              className="flex items-center rounded-xl p-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LuBadgeCheck className="mr-2.5 h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <div className="font-semibold">{t('accountProfile') || 'Account Profile'}</div>
                <div className="text-[10px] text-slate-400">{t('accountProfileDesc') || 'Academy role & dashboard'}</div>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/calendar"
              onClick={onNavigate}
              className="flex items-center rounded-xl p-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LuBell className="mr-2.5 h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <div className="font-semibold">{t('scheduleFixtures') || 'Schedule & Fixtures'}</div>
                <div className="text-[10px] text-slate-400">{t('scheduleFixturesDesc') || 'Academy calendar events'}</div>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer rounded-xl p-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 focus:bg-rose-50 dark:focus:bg-rose-950/40 focus:text-rose-600 transition-colors"
        >
          <LuLogOut className="mr-2.5 h-4 w-4 shrink-0" />
          <span>{t('signOut') || 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SidebarNavItemsProps {
  navItems: NavItemWithLabel[];
  pathname: string;
  hoveredIcon?: string | null;
  setHoveredIcon?: (href: string | null) => void;
  isSidebarOpen: boolean;
  onNavigate?: () => void;
}

// SidebarNavItems Component
function SidebarNavItems({
  navItems,
  pathname,
  hoveredIcon,
  setHoveredIcon,
  isSidebarOpen,
  onNavigate,
}: SidebarNavItemsProps) {
  return (
    <ul className="space-y-1.5">
      {navItems.map(({ href, label, LineIcon, FillIcon }) => {
        const isRootDashboard =
          href === '/dashboard' ||
          href === '/dashboard/coach' ||
          href === '/dashboard/player' ||
          href === '/dashboard/guardian';
        const isActive = pathname === href || (!isRootDashboard && pathname.startsWith(href));
        const linkContent = (
          <Link
            href={href}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center font-medium transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
              isSidebarOpen
                ? 'h-10 w-full rounded-xl px-3 justify-start gap-3'
                : 'h-10 w-10 mx-auto justify-center rounded-xl p-0',
              isActive
                ? isSidebarOpen
                  ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-semibold shadow-xs'
                  : 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-500/30'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            )}
            onMouseEnter={() => setHoveredIcon?.(href)}
            onMouseLeave={() => setHoveredIcon?.(null)}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active highlight indicator bar on left when sidebar is open */}
            {isActive && isSidebarOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-amber-500" />
            )}

            <span className="shrink-0 transition-transform duration-200 group-hover:scale-110 flex items-center justify-center">
              {isActive || hoveredIcon === href ? (
                <FillIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <LineIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
              )}
            </span>

            {isSidebarOpen && <span className="text-sm truncate font-medium">{label}</span>}
          </Link>
        );

        if (!isSidebarOpen) {
          return (
            <li key={href}>
              <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs py-1.5 px-3">
                  {label}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        }

        return <li key={href}>{linkContent}</li>;
      })}
    </ul>
  );
}
