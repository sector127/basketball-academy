import {
    RiDashboardLine,
    RiDashboardFill,
    RiShieldLine,
    RiShieldFill,
    RiTeamLine,
    RiTeamFill,
    RiClipboardLine,
    RiClipboardFill,
    RiUserLine,
    RiUserFill,
    PiCourtBasketballThin,
    PiCourtBasketballFill,
    BsCalendarDate,
    BsCalendarDateFill,
    MdOutlineStadium,
    MdStadium,
} from '@/components/icons/navIcons';

export const navConfig = {
    admin: [
        {href: '/dashboard', labelKey: 'dashboard', LineIcon: RiDashboardLine, FillIcon: RiDashboardFill},
        {href: '/dashboard/admin/teams', labelKey: 'teams', LineIcon: RiShieldLine, FillIcon: RiShieldFill},
        {href: '/dashboard/admin/players', labelKey: 'players', LineIcon: RiTeamLine, FillIcon: RiTeamFill},
        {
            href: '/dashboard/admin/games',
            labelKey: 'games',
            LineIcon: PiCourtBasketballThin,
            FillIcon: PiCourtBasketballFill
        },
        {href: '/dashboard/admin/coaches', labelKey: 'coaches', LineIcon: RiClipboardLine, FillIcon: RiClipboardFill},
        {href: '/dashboard/admin/accounts', labelKey: 'accounts', LineIcon: RiUserLine, FillIcon: RiUserFill},
        {
            href: '/dashboard/admin/calendar',
            labelKey: 'calendar',
            LineIcon: BsCalendarDate,
            FillIcon: BsCalendarDateFill
        },
        {href: '/dashboard/admin/venues', labelKey: 'venues', LineIcon: MdOutlineStadium, FillIcon: MdStadium},
    ],
    staff: [
        {href: '/dashboard', labelKey: 'dashboard', LineIcon: RiDashboardLine, FillIcon: RiDashboardFill},
        {href: '/dashboard/admin/teams', labelKey: 'teams', LineIcon: RiShieldLine, FillIcon: RiShieldFill},
        {href: '/dashboard/admin/games', labelKey: 'games', LineIcon: PiCourtBasketballThin, FillIcon: PiCourtBasketballFill},
        {href: '/dashboard/admin/calendar', labelKey: 'calendar', LineIcon: BsCalendarDate, FillIcon: BsCalendarDateFill},
        {href: '/dashboard/admin/venues', labelKey: 'venues', LineIcon: MdOutlineStadium, FillIcon: MdStadium},
    ],
    player: [
        {href: '/dashboard/player', labelKey: 'profile', LineIcon: RiUserLine, FillIcon: RiUserFill},
        {href: '/dashboard/player/calendar', labelKey: 'calendar', LineIcon: BsCalendarDate, FillIcon: BsCalendarDateFill},
        {href: '/dashboard/player/combinations', labelKey: 'combinations', LineIcon: RiClipboardLine, FillIcon: RiClipboardFill},
    ],
    coach: [
        {href: '/dashboard/coach', labelKey: 'dashboard', LineIcon: RiDashboardLine, FillIcon: RiDashboardFill},
        {href: '/dashboard/coach/teams', labelKey: 'teams', LineIcon: RiTeamLine, FillIcon: RiTeamFill},
        {href: '/dashboard/coach/players', labelKey: 'players', LineIcon: RiTeamLine, FillIcon: RiTeamFill},
        {
            href: '/dashboard/coach/games',
            labelKey: 'games',
            LineIcon: PiCourtBasketballThin,
            FillIcon: PiCourtBasketballFill
        },
        {
            href: '/dashboard/coach/calendar',
            labelKey: 'calendar',
            LineIcon: BsCalendarDate,
            FillIcon: BsCalendarDateFill
        },
        {
            href: '/dashboard/coach/combinations',
            labelKey: 'combinations',
            LineIcon: RiClipboardLine,
            FillIcon: RiClipboardFill
        }
    ],
    guardian: [
        {href: '/dashboard/guardian', labelKey: 'profile', LineIcon: RiUserLine, FillIcon: RiUserFill},
        {href: '/dashboard/guardian/calendar', labelKey: 'calendar', LineIcon: BsCalendarDate, FillIcon: BsCalendarDateFill},
    ],
};