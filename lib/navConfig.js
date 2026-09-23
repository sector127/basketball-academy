import {
    RiShieldLine,
    RiShieldFill,
    RiTeamLine,
    RiTeamFill,
    RiClipboardLine,
    RiClipboardFill,
    RiUserLine,
    RiUserFill,
} from 'react-icons/ri';
import {PiCourtBasketballThin, PiCourtBasketballFill} from 'react-icons/pi';
import {BsCalendarDate, BsCalendarDateFill} from 'react-icons/bs';
import {MdOutlineStadium, MdStadium} from 'react-icons/md';

export const navConfig = {
    admin: [
        {href: '/dashboard/admin/teams', labelKey: 'teams', LineIcon: RiShieldLine, FillIcon: RiShieldFill},
        {href: '/dashboard/admin/players', labelKey: 'players', LineIcon: RiTeamLine, FillIcon: RiTeamFill},
        {
            href: '/dashboard/admin/games',
            labelKey: 'games',
            LineIcon: PiCourtBasketballThin,
            FillIcon: PiCourtBasketballFill
        },
        {href: '/dashboard/admin/coaches', labelKey: 'coaches', LineIcon: RiClipboardLine, FillIcon: RiClipboardFill},
        {
            href: '/dashboard/admin/calendar',
            labelKey: 'calendar',
            LineIcon: BsCalendarDate,
            FillIcon: BsCalendarDateFill
        },
        {href: '/dashboard/admin/venues', labelKey: 'venues', LineIcon: MdOutlineStadium, FillIcon: MdStadium},
    ],
    player: [
        {href: '/dashboard/profile', labelKey: 'profile', LineIcon: RiUserLine, FillIcon: RiUserFill},
        {href: '/dashboard/team', labelKey: 'team', LineIcon: RiTeamLine, FillIcon: RiTeamFill},
        {href: '/dashboard/schedule', labelKey: 'schedule', LineIcon: BsCalendarDate, FillIcon: BsCalendarDateFill},
        {href: '/dashboard/stats', labelKey: 'stats', LineIcon: RiClipboardLine, FillIcon: RiClipboardFill},
    ],
    coach: [
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
        {href: '/dashboard/players', labelKey: 'players', LineIcon: RiTeamLine, FillIcon: RiTeamFill},
        {href: '/dashboard/schedule', labelKey: 'schedule', LineIcon: BsCalendarDate, FillIcon: BsCalendarDateFill},
        {
            href: '/dashboard/notifications',
            labelKey: 'notifications',
            LineIcon: RiClipboardLine,
            FillIcon: RiClipboardFill
        },
    ],
};