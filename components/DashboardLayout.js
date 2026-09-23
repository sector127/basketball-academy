'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

import { Separator } from '@/components/ui/separator';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

// Icons
import {
  LuBadgeCheck,
  LuBell,
  LuChevronsDown,
  LuLogOut,
  LuSettings,
  LuMenu,
  LuSearch,
} from 'react-icons/lu';
import { FiSidebar } from 'react-icons/fi';

// Custom components
import SignOutButton from '@/components/SignOutButton';
import ThemeToggle from '@/components/DarkModeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import Breadcrumbs from '@/components/Breadcrumbs';
import { navConfig } from '@/lib/navConfig';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const { data: session } = useSession();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [user, setUser] = useState(null);

  // Initialize client-side state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('isSidebarOpen');
      if (stored !== null) {
        setIsSidebarOpen(JSON.parse(stored));
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  // Update user state when session changes
  useEffect(() => {
    setUser(session?.user);
  }, [session]);

  // Compute navItems based on user role
  const navItems = useMemo(() => {
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
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('isSidebarOpen', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
        {/* Header */}
        <Header user={user} t={t} toggleSidebar={toggleSidebar} navItems={navItems} pathname={pathname} />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              'relative hidden shrink-0 flex-col border-r border-slate-200/70 bg-white/70 backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/60 lg:flex',
              isSidebarOpen ? 'w-64' : 'w-20'
            )}
          >
            {/* Collapse toggle row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 transition-opacity',
                  !isSidebarOpen && 'opacity-0'
                )}
              >
                Navigation
              </span>
              <button
                onClick={toggleSidebar}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <FiSidebar className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3" role="navigation">
              <SidebarNavItems
                navItems={navItems}
                pathname={pathname}
                hoveredIcon={hoveredIcon}
                setHoveredIcon={setHoveredIcon}
                isSidebarOpen={isSidebarOpen}
              />
            </nav>
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

// Header Component
function Header({ user, t, navItems, pathname }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        {/* Mobile menu sheet */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <LuMenu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-slate-900">
              <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-200/80 dark:border-slate-800">
                <Image
                  src="/assets/images/logo.png"
                  alt="BBA-logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Brooklyn Academy
                </span>
              </div>
              <div className="p-4" onClick={() => setMobileOpen(false)}>
                <SidebarNavItems navItems={navItems} pathname={pathname} isSidebarOpen={true} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand Link */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
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
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="w-56 pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 rounded-lg"
            placeholder={t('search') || 'Search...'}
            aria-label="Search"
          />
        </div>

        <UserMenu user={user} t={t} />
      </div>
    </header>
  );
}

// UserMenu Component
function UserMenu({ user, t }) {
  const role = user?.role || 'staff';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-full p-1 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div className="hidden text-right sm:block">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 uppercase font-bold tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              >
                {role}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
              {user?.email}
            </p>
          </div>

          <Avatar className="h-8 w-8 ring-2 ring-amber-500/20">
            <AvatarImage src={user?.image} alt="User avatar" />
            <AvatarFallback className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || 'UN'}
            </AvatarFallback>
          </Avatar>

          <LuChevronsDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-72 p-2 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {user?.name} {user?.lastName || ''}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {user?.email}
          </p>
        </div>

        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem className="cursor-pointer rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <LuBadgeCheck className="mr-2.5 h-4 w-4 text-amber-500" />
            <div>
              <div className="font-semibold">{t('account') || 'Account'}</div>
              <div className="text-[10px] text-slate-400">Profile & preferences</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <LuBell className="mr-2.5 h-4 w-4 text-blue-500" />
            <div>
              <div className="font-semibold">{t('notifications') || 'Notifications'}</div>
              <div className="text-[10px] text-slate-400">Recent academy alerts</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5 dark:bg-slate-800" />

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <LuSettings className="h-3.5 w-3.5 text-slate-400" />
            <span>Preferences</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('theme') || 'Theme'}
              </span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('language') || 'Language'}
              </span>
              <LanguageSelector />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1.5 dark:bg-slate-800" />

        <DropdownMenuItem className="cursor-pointer rounded-lg p-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
          <LuLogOut className="mr-2.5 h-4 w-4" />
          <SignOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// SidebarNavItems Component
function SidebarNavItems({ navItems, pathname, hoveredIcon, setHoveredIcon, isSidebarOpen }) {
  return (
    <ul className="space-y-1.5">
      {navItems.map(({ href, label, LineIcon, FillIcon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <li key={href}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    'group relative flex h-10 items-center rounded-xl px-3 font-medium transition-all duration-200',
                    isActive
                      ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                    isSidebarOpen ? 'justify-start gap-3' : 'justify-center'
                  )}
                  onMouseEnter={() => setHoveredIcon?.(href)}
                  onMouseLeave={() => setHoveredIcon?.(null)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active highlight bar on left */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-amber-500" />
                  )}

                  <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                    {isActive || hoveredIcon === href ? (
                      <FillIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <LineIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
                    )}
                  </span>

                  {isSidebarOpen && <span className="text-sm truncate">{label}</span>}
                </Link>
              </TooltipTrigger>
              {!isSidebarOpen && (
                <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
