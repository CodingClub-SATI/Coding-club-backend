const recentHits = new Map(); 
const PURGE_THRESHOLD = 5000;

function purgeExpired(now) {
    for (const [key, expiresAt] of recentHits) {
        if (expiresAt <= now) recentHits.delete(key);
    }
}

export function shouldCountHit(key, windowMs) {
    const now = Date.now();
    if (recentHits.size > PURGE_THRESHOLD) purgeExpired(now);

    const expiresAt = recentHits.get(key);
    if (expiresAt && expiresAt > now) return false;

    recentHits.set(key, now + windowMs);
    return true;
}