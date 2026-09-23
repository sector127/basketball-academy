'use client';

import React, {useEffect, useState, useMemo} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useSession} from 'next-auth/react';

import {Separator} from '@/components/ui/separator';
import {Input} from '@/components/ui/input';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet';

// Icons
import {LuBadgeCheck, LuBell, LuChevronsDown, LuLogOut, LuSettings, LuMenu} from 'react-icons/lu';
import {FiSidebar} from 'react-icons/fi';

// Custom components
import SignOutButton from '@/components/SignOutButton';
import ThemeToggle from '@/components/DarkModeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import Breadcrumbs from '@/components/Breadcrumbs';
import {navConfig} from '@/lib/navConfig';

export default function DashboardLayout({children}) {
    const pathname = usePathname();
    const t = useTranslations('Dashboard');
    const {data: session} = useSession();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [hoveredIcon, setHoveredIcon] = useState(null);
    const [user, setUser] = useState(null);

    // Initialize client-side state
    useEffect(() => {
        setIsClient(true);
        const storedSidebarState = localStorage.getItem('isSidebarOpen');
        if (storedSidebarState !== null) {
            setIsSidebarOpen(JSON.parse(storedSidebarState));
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
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem('isSidebarOpen', JSON.stringify(newState));
    };

    return (
        <TooltipProvider>
            <div className="flex min-h-screen flex-col">
                {/* Header */}
                <Header user={user} t={t}/>

                <Separator className="dark:bg-slate-700"/>

                <div className="flex flex-1 overflow-hidden dark:bg-slate-900 dark:text-slate-50">
                    {/* Sidebar */}
                    {isClient && (
                        <Sidebar
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                            navItems={navItems}
                            pathname={pathname}
                            hoveredIcon={hoveredIcon}
                            setHoveredIcon={setHoveredIcon}
                            t={t}
                        />
                    )}

                    {isClient && <Separator orientation="vertical" className="h-auto dark:bg-slate-700"/>}

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto p-4 space-y-4">
                        <div className='flex pl-8'>
                            <Separator orientation="vertical" className="h-auto dark:bg-slate-700 mr-2"/>
                            <Breadcrumbs/>

                        </div>
                        {children}
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}

// Header Component
function Header({user, t}) {
    return (
        <header className="flex items-center justify-between bg-gray-50 px-4 py-2 dark:bg-slate-950">
            <Link href="/dashboard" className="flex items-center space-x-2 text-lg">
                <Image
                    src="/assets/images/logo.png"
                    alt="BBA-logo"
                    width={40}
                    height={40}
                    className="object-contain transition-all duration-700"
                    priority
                />
                <h2 className="text-xl font-semibold dark:text-slate-50">{t('dashboard')}</h2>
            </Link>

            <div className="flex items-center space-x-2">
                <Input className="w-48" placeholder={t('search')} aria-label="Search"/>
                <UserMenu user={user} t={t}/>
            </div>
        </header>
    );
}

// UserMenu Component (Nested in Header)
function UserMenu({user, t}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
                    <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                        <AvatarImage
                            src={user?.image}
                            alt="User avatar"
                            className="grayscale transition-all duration-300 hover:grayscale-0"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user?.name?.slice(0, 2).toUpperCase() || 'UN'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-start max-w-[160px]">
            <span
                className="text-sm font-medium truncate dark:text-slate-100 group-hover:text-primary transition-colors">
              {t('hi')} {user?.name}
            </span>
                        <span className="text-xs text-muted-foreground truncate dark:text-slate-300">
              {user?.email}
            </span>
                    </div>

                    <LuChevronsDown
                        className="ml-2 size-4 text-muted-foreground dark:text-slate-300 transition-transform"/>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                side="bottom"
                sideOffset={12}
                className="w-[320px] p-2 rounded-xl shadow-lg dark:border-slate-700"
            >
                <DropdownMenuGroup>
                    <DropdownMenuItem className="group cursor-pointer rounded-lg p-3">
                        <LuBadgeCheck className="mr-3 size-5 text-primary opacity-80 group-hover:opacity-100"/>
                        <div>
                            <div className="font-medium">{t('account')}</div>
                            <div className="text-xs text-muted-foreground">Manage your account settings</div>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="group cursor-pointer rounded-lg p-3">
                        <LuBell className="mr-3 size-5 text-primary opacity-80 group-hover:opacity-100"/>
                        <div>
                            <div className="font-medium">{t('notifications')}</div>
                            <div className="text-xs text-muted-foreground">View notifications</div>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="dark:bg-slate-700 my-2"/>

                <div className="p-3 space-y-4 bg-accent/30 rounded-lg dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <LuSettings className="size-4 text-muted-foreground"/>
                            <span className="text-sm font-medium">{t('settings')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col space-y-2">
                            <label className="text-xs text-muted-foreground">{t('theme')}</label>
                            <span>
                            <ThemeToggle/>
                            </span>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="text-xs text-muted-foreground">{t('language')}</label>
                            <LanguageSelector/>
                        </div>
                    </div>
                </div>

                <DropdownMenuSeparator className="dark:bg-slate-700 my-2"/>

                <DropdownMenuItem
                    className="cursor-pointer rounded-lg p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LuLogOut className="mr-3 size-5"/>
                    <SignOutButton/>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Sidebar Component
function Sidebar({isSidebarOpen, toggleSidebar, navItems, pathname, hoveredIcon, setHoveredIcon, t}) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    return (
        <>
            {/* Mobile Sidebar (Sheet) */}
            <div className="lg:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <button className="p-2 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white">
                            <LuMenu className="size-5"/>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 bg-slate-50 p-0 dark:bg-slate-950">
                        <div className="p-4">
                            <Link href="/dashboard" className="mb-6 flex items-center space-x-2">
                                <Image
                                    src="/assets/images/logo.png"
                                    alt="BBA-logo"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                                <h3 className="text-lg font-semibold dark:text-white">{t('dashboard')}</h3>
                            </Link>
                            <nav>
                                <SidebarNavItems
                                    navItems={navItems}
                                    pathname={pathname}
                                    hoveredIcon={hoveredIcon}
                                    setHoveredIcon={setHoveredIcon}
                                    isSidebarOpen={true} // Always expanded in mobile
                                />
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <aside
                className={`relative hidden min-h-[calc(100vh-81px)] flex-col bg-slate-50 transition-all duration-300 dark:bg-slate-950 lg:flex ${
                    isSidebarOpen ? 'w-64' : 'w-16'
                }`}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={toggleSidebar}
                            className="absolute -right-10 top-4 self-end rounded-sm p-1 transition-opacity duration-300 hover:text-black dark:hover:bg-slate-600 dark:hover:text-gray-50"
                            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            <FiSidebar/>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        {isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    </TooltipContent>
                </Tooltip>

                <nav className="mx-4 my-8 flex-1" role="navigation">
                    <SidebarNavItems
                        navItems={navItems}
                        pathname={pathname}
                        hoveredIcon={hoveredIcon}
                        setHoveredIcon={setHoveredIcon}
                        isSidebarOpen={isSidebarOpen}
                    />
                </nav>
            </aside>
        </>
    );
}

// SidebarNavItems Component (Nested in Sidebar)
function SidebarNavItems({navItems, pathname, hoveredIcon, setHoveredIcon, isSidebarOpen}) {
    return (
        <ul>
            {navItems.map(({href, label, LineIcon, FillIcon}) => {
                const isActive = pathname === href;
                return (
                    <li key={href} className="mb-1.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={href}
                                    className={`flex h-10 min-w-10 items-center transition-all duration-200 ${
                                        isActive
                                            ? 'rounded-md bg-gradient-to-r from-amber-400 to-orange-500 p-2 font-semibold'
                                            : 'rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-black dark:text-slate-50 dark:hover:bg-slate-600'
                                    } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                                    onMouseEnter={() => setHoveredIcon(href)}
                                    onMouseLeave={() => setHoveredIcon(null)}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {isSidebarOpen ? (
                                        <span className="flex flex-row items-center space-x-2">
                      {isActive ? <FillIcon aria-hidden="true"/> : <LineIcon aria-hidden="true"/>}
                                            <span className="text-sm">{label}</span>
                    </span>
                                    ) : (
                                        <span
                                            className={`border border-transparent transition-transform duration-200 ${
                                                hoveredIcon === href ? 'scale-110' : ''
                                            }`}
                                        >
                      {isActive || hoveredIcon === href ? (
                          <FillIcon aria-hidden="true"/>
                      ) : (
                          <LineIcon aria-hidden="true"/>
                      )}
                    </span>
                                    )}
                                </Link>
                            </TooltipTrigger>
                            {!isSidebarOpen && (
                                <TooltipContent side="right" sideOffset={10}>
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