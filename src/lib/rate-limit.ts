/**
 * Simple in-memory rate limiter
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (entry.resetAt < now) {
        store.delete(key)
      }
    })
  },
  5 * 60 * 1000,
)

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  // If no entry or window expired, create new
  if (!entry || entry.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })

    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get client identifier from request
 * Note: In production behind a trusted proxy, configure TRUSTED_PROXY_HOPS
 * to specify how many proxy hops to trust for X-Forwarded-For
 */
export function getClientId(request: Request): string {
  // Number of trusted proxy hops (0 = don't trust headers, use 1 for single reverse proxy)
  const trustedHops = parseInt(process.env.TRUSTED_PROXY_HOPS || '0', 10)

  if (trustedHops > 0) {
    // Try X-Forwarded-For (behind trusted proxy)
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      const ips = forwarded.split(',').map((ip) => ip.trim())
      // Get the IP that is trustedHops positions from the end
      // This is the client IP as seen by the first trusted proxy
      const clientIpIndex = Math.max(0, ips.length - trustedHops)
      const clientIp = ips[clientIpIndex]
      if (clientIp && isValidIp(clientIp)) {
        return clientIp
      }
    }

    // Try X-Real-IP (set by nginx)
    const realIp = request.headers.get('x-real-ip')
    if (realIp && isValidIp(realIp)) {
      return realIp
    }
  }

  // Fallback - in serverless/edge, this might be available via CF-Connecting-IP etc
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp && isValidIp(cfIp)) {
    return cfIp
  }

  return 'unknown'
}

/**
 * Basic IP validation to prevent header injection
 */
function isValidIp(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip)
}
