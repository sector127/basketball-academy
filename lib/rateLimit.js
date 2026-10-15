// Small in-memory fixed-window limiter for public endpoints (per server instance).
const buckets = new Map();

export function isRateLimited(key, {limit, windowMs}) {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        if (buckets.size > 10000) buckets.clear();
        buckets.set(key, {count: 1, resetAt: now + windowMs});
        return false;
    }
    bucket.count += 1;
    return bucket.count > limit;
}

export function getClientIp(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
}
