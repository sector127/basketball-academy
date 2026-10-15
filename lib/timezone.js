// The academy's local time zone. Used when the server has to turn wall-clock
// times ("18:00") into instants, or format instants as wall-clock times, so the
// result does not depend on the server's own time zone (UTC in Docker).
export const ACADEMY_TIME_ZONE = process.env.ACADEMY_TIME_ZONE || 'Asia/Tbilisi';

export function isValidTimeZone(timeZone) {
    if (!timeZone || typeof timeZone !== 'string') return false;
    try {
        new Intl.DateTimeFormat('en-US', {timeZone});
        return true;
    } catch {
        return false;
    }
}

// Offset of `timeZone` from UTC at the given instant, in milliseconds.
function getTimeZoneOffset(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Converts a wall-clock time in `timeZone` to a Date (UTC instant).
 * `month` is 1-based.
 */
export function zonedTimeToUtc(year, month, day, hour, minute, timeZone = ACADEMY_TIME_ZONE) {
    const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    // Re-check the offset at the candidate instant to land correctly around DST changes
    let instant = wallAsUtc - getTimeZoneOffset(new Date(wallAsUtc), timeZone);
    instant = wallAsUtc - getTimeZoneOffset(new Date(instant), timeZone);
    return new Date(instant);
}

/**
 * Formats an instant as HH:mm in the academy time zone.
 */
export function formatAcademyTime(value, timeZone = ACADEMY_TIME_ZONE) {
    return new Date(value).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', timeZone});
}
