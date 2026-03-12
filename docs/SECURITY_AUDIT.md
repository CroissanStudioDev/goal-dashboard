# Security Audit Report

**Project:** Goal Dashboard
**Date:** 11 March 2026
**Auditor:** Claude Code (Exa + Context7)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 3 |
| MEDIUM | 4 |
| LOW | 2 |

**Overall Risk Level: HIGH** - Critical vulnerabilities in dependencies require immediate action.

---

## CRITICAL Vulnerabilities

### 1. CVE-2025-61928: Better Auth API Key Creation Bypass

**Severity:** CRITICAL (CVSS 10.0)
**Affected:** `better-auth` < 1.3.26
**Your Version:** `^1.2.0` - VULNERABLE

**Description:**
Unauthenticated attackers can create API keys for any user by passing `userId` in the request body to `/api/auth/api-key/create`. This allows complete account takeover without authentication.

**Impact:**
- Full account takeover
- Unauthorized access to all user data
- Bank tokens exposure

**Fix:**
```bash
pnpm update better-auth@^1.3.26
```

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2025-61928
- https://zeropath.com/blog/breaking-authentication-unauthenticated-api-key-creation-in-better-auth-cve-2025-61928

---

### 2. CVE-2025-29927: Next.js Middleware Authentication Bypass

**Severity:** CRITICAL
**Affected:** Next.js middleware authentication patterns
**Your Version:** `^14.2.0`

**Description:**
Authentication bypass vulnerability in Next.js middleware. Attackers can bypass middleware checks under certain conditions.

**Your Code Issue (`src/middleware.ts:23`):**
```typescript
// VULNERABLE: pathname.includes('.') bypasses auth for paths like /api/sync.json
if (
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon') ||
  pathname.includes('.')  // <-- This is too permissive
) {
  return NextResponse.next()
}
```

**Fix:**
```typescript
// Use explicit static file extensions
const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff2?)$/
if (
  pathname.startsWith('/_next') ||
  STATIC_EXTENSIONS.test(pathname)
) {
  return NextResponse.next()
}
```

**References:**
- https://censys.com/advisory/cve-2025-29927/

---

## HIGH Vulnerabilities

### 3. Rate Limiting Bypass via Header Spoofing

**Severity:** HIGH
**Location:** `src/lib/rate-limit.ts:81-96`

**Description:**
The `getClientId()` function trusts `X-Forwarded-For` and `X-Real-IP` headers without validation. Attackers can spoof these headers to bypass rate limiting.

**Your Code:**
```typescript
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()  // Trusts client-supplied header
  }
  // ...
}
```

**Impact:**
- Rate limit bypass
- API abuse
- Potential DoS on bank APIs

**Fix:**
1. Configure trusted proxy count in production
2. Validate IP format
3. Consider using user ID as primary rate limit key (already partially done)

---

### 4. In-Memory Rate Limiting Not Production-Ready

**Severity:** HIGH
**Location:** `src/lib/rate-limit.ts`

**Description:**
Rate limits are stored in-memory (`Map`). This fails in:
- Multi-instance deployments (each instance has separate state)
- Serverless environments (cold starts reset state)
- After deployments/restarts

**Better Auth Recommendation:**
```typescript
// Use database or Redis storage
rateLimit: {
  storage: "database",  // or "secondary-storage" for Redis
  modelName: "rateLimit"
}
```

**Fix:**
Implement Redis-based rate limiting or use Better Auth's built-in rate limiting with database storage.

---

### 5. Missing CSRF Protection on API Routes

**Severity:** HIGH
**Location:** All `/api/*` routes

**Description:**
API routes rely only on session cookies without CSRF tokens. While `SameSite=Lax` provides some protection, it doesn't cover all attack vectors (e.g., GET requests from cross-origin).

**Missing in `src/lib/auth.ts`:**
```typescript
// Better Auth has CSRF protection - ensure it's enabled
advanced: {
  disableCSRFCheck: false  // This should NOT be set to true
}
```

**Fix:**
1. Verify Better Auth CSRF protection is enabled (default)
2. Add `allowedOrigins` in `next.config.js`:
```javascript
experimental: {
  serverActions: {
    allowedOrigins: ['your-domain.com'],
  },
}
```

---

## MEDIUM Vulnerabilities

### 6. AES-256-GCM IV Length Issue

**Severity:** MEDIUM
**Location:** `src/lib/crypto.ts:9`

**Description:**
Using 16-byte IV for AES-GCM. NIST recommends 12 bytes (96 bits) for GCM mode for optimal security and performance.

**Your Code:**
```typescript
const IV_LENGTH = 16  // Should be 12 for GCM
```

**Impact:**
- Slightly reduced security margin
- No immediate vulnerability, but non-standard

**Fix:**
```typescript
const IV_LENGTH = 12  // NIST recommended for GCM
```

---

### 7. Missing Auth Tag Length Validation

**Severity:** MEDIUM
**Location:** `src/lib/crypto.ts`

**Description:**
The decryption function doesn't validate the authentication tag length. Truncated tags (< 128 bits) reduce security.

**Fix:**
```typescript
export function decryptToken(ciphertext: string): string {
  // ... existing code ...
  const tag = Buffer.from(tagB64, 'base64')

  // Add validation
  if (tag.length !== 16) {
    throw new Error('Invalid authentication tag length')
  }
  // ...
}
```

---

### 8. Error Message Information Disclosure

**Severity:** MEDIUM
**Location:** `src/app/api/sync/route.ts:200`

**Description:**
Error messages are returned directly to clients, potentially exposing internal details.

**Your Code:**
```typescript
results.push({
  // ...
  error: error instanceof Error ? error.message : 'Unknown error',
})
```

**Fix:**
Log detailed errors server-side, return generic messages to client:
```typescript
console.error('Sync error for account:', account.id, error)
results.push({
  // ...
  error: 'Sync failed',  // Generic message
})
```

---

### 9. Missing Security Headers

**Severity:** MEDIUM
**Location:** `next.config.js`

**Description:**
No security headers configured. Missing headers:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

**Fix:**
Add to `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
}
```

---

## LOW Vulnerabilities

### 10. Fallback for Unencrypted Tokens

**Severity:** LOW
**Location:** `src/lib/crypto.ts:92-94`

**Description:**
`safeDecryptToken` returns unencrypted values as-is for "migration support". This could mask encryption failures.

```typescript
if (!isEncrypted(ciphertext)) {
  return ciphertext  // Returns plaintext tokens
}
```

**Recommendation:**
Add logging when plaintext tokens are detected, set deadline to remove migration support.

---

### 11. Console.error in Production

**Severity:** LOW
**Location:** `src/app/api/sync/route.ts:217`

**Description:**
Using `console.error` instead of structured logging. In production, this should use a proper logging service.

**Fix:**
Implement structured logging (e.g., Pino, Winston) with log levels and external aggregation.

---

## Positive Findings

The following security measures are correctly implemented:

1. **Token Encryption** - AES-256-GCM with random salt and IV per encryption
2. **Key Derivation** - Using scrypt for key derivation from password
3. **Session Management** - Better Auth with secure cookie defaults (`SameSite=Lax`, `httpOnly`)
4. **SQL Injection Prevention** - Drizzle ORM parameterizes all queries automatically
5. **Auth on API Routes** - Consistent use of `requireUserId()` pattern
6. **Cascade Deletes** - Proper foreign key constraints with `onDelete: 'cascade'`
7. **Unique Constraints** - Transaction deduplication via `(bankAccountId, externalId)`
8. **Retry Logic** - Exponential backoff on bank API failures
9. **Sync Cooldown** - 5-minute cooldown prevents excessive bank API calls

---

## Recommended Actions (Priority Order)

### Immediate (This Week)

1. **Update better-auth to >=1.3.26** - Fixes CVE-2025-61928
   ```bash
   pnpm update better-auth@^1.3.26
   ```

2. **Fix middleware static file check** - Prevents auth bypass

3. **Add security headers** to `next.config.js`

### Short-term (This Month)

4. **Implement Redis rate limiting** for production
5. **Fix IV length** to 12 bytes for GCM
6. **Add auth tag length validation**
7. **Sanitize error messages** returned to clients

### Long-term (This Quarter)

8. **Add CSP headers** with proper directives
9. **Implement structured logging**
10. **Remove plaintext token migration support**
11. **Add security monitoring/alerting**

---

## Dependencies Audit

| Package | Version | Status |
|---------|---------|--------|
| better-auth | ^1.2.0 | VULNERABLE - Update to >=1.3.26 |
| next | ^14.2.0 | Review for CVE-2025-29927 patches |
| drizzle-orm | ^0.30.0 | OK |
| axios | ^1.7.0 | OK |
| zod | ^3.23.0 | OK |

Run `pnpm audit` regularly to check for new vulnerabilities.

---

*Report generated using Exa web search and Context7 documentation lookup.*
