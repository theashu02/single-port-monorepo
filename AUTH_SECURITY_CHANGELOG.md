# Authentication Security Changelog

This document records the security review and code changes applied across all authentication flows:

- Google OAuth
- MetaMask wallet login
- Email/password login
- Guest login

## Scope

### Reviewed areas

- Next.js auth integration (`next-auth`)
- Elysia API endpoints running under Bun and exposed through Next.js route handlers
- Cookie/session handling
- Middleware authorization checks
- Client-side session restore behavior

### Main objective

Close practical loopholes (especially token exposure and weak session handling), while keeping current auth architecture intact.

---

## Findings Summary

### Google login

- Core flow is structurally sound through `next-auth` provider handling.
- Existing blocked-user and provider-mismatch checks were already present.

### Email/password login

- Works correctly for registration and login.
- Security gaps remain:
  - No brute-force protection/rate limiting on credential attempts.
  - Password policy is minimal (length check only).

### MetaMask login

- Signature + nonce validation exists.
- Gap found: nonce endpoint accepted unvalidated wallet address format.

### Guest login

- Highest-risk issues were found:
  - Guest `session_token` returned in JSON response and stored in `localStorage`.
  - Cookies lacked recommended hardening options (`secure`, `sameSite`).
  - Refresh/logout endpoints lacked explicit origin validation.
  - Middleware guest shortcut was too permissive (single-cookie check).

---

## Implemented Changes

## 1) Guest auth API hardening

**File:** `app/api/auth/guest/route.ts`

### Added secure cookie defaults

- Introduced shared cookie options:
  - `httpOnly: true`
  - `sameSite: "lax"`
  - `secure: process.env.NODE_ENV === "production"`
  - `path: "/"`
  - fixed `maxAge`

### Added origin validation

- Added origin/host matching guard for mutating routes:
  - `POST /api/auth/guest`
  - `PUT /api/auth/guest`
  - `DELETE /api/auth/guest`

### Added payload validation

- Server-side validation and normalization for guest creation payload:
  - nickname constraints
  - avatar constraints
  - enforced `age_confirmed` and `terms_accepted`
  - capped/sanitized interests

### Removed token exposure in API responses

- `session_token` is no longer returned in `POST` and `PUT` response bodies.
- Session token is now cookie-delivered only.

### Added session-token rotation on refresh

- On successful `PUT`, guest `session_token` is rotated.
- Reduces replay window for leaked/old tokens.

### Added cookie-backed session fetch endpoint

- Added `GET /api/auth/guest` to resolve current guest session from cookie context.
- Returns guest profile/session metadata without exposing session token.

---

## 2) Guest client API changes

**File:** `core/apis/Guest_API.ts`

- Added `credentials: "include"` to guest auth requests.
- Updated refresh helper to support cookie-based refresh flow.
- Added `fetchGuestSession()` helper using `GET /api/auth/guest`.

---

## 3) Removed localStorage dependency for guest auth

### Guest onboarding page

**File:** `app/auth/guest/page.tsx`

- Removed reliance on localStorage token restore.
- Auto-login now uses cookie-backed refresh instead.
- Session creation no longer stores auth token in local storage.

### Dashboard guest identity resolution

**File:** `app/app/page.tsx`

- Removed localStorage-derived guest user hydration.
- Added guest session fetch via cookie-backed endpoint.
- Kept logout behavior while removing client token storage assumptions.

---

## 4) Middleware tightening

**File:** `middleware.ts`

- Updated optimistic guest authorization check:
  - Before: required only `guest_session_token` cookie
  - After: requires both `guest_session_token` and `guest_id`

Note: this remains an optimistic check. Secure enforcement continues at server/session validation layer.

---

## 5) MetaMask nonce endpoint input validation

**File:** `server/routes/auth.ts`

- Added strict Ethereum address format validation (`0x` + 40 hex chars) before nonce issuance.

---

## 6) MetaMask client error handling improvement

**File:** `components/auth/MetaMaskButton.tsx`

- Added explicit error checks for nonce fetch failures and missing nonce.

---

## 7) Guest session type alignment

**File:** `core/constants/guest_constant.ts`

- Updated `GuestSessionData` to remove required `session_token`.
- Added optional fields aligned with new safe guest response structure.

---

## Validation Performed

- Ran linter diagnostics on all edited files.
- Result: no linter errors introduced.

---

## Current Security Posture After Patch

### Improved

- Guest session token is no longer exposed to browser JS as part of normal app flow.
- Guest cookies now follow safer defaults.
- Refresh path rotates tokens and is less replay-prone.
- Guest mutating endpoints include same-origin guard.
- MetaMask nonce issuance rejects malformed addresses.

### Still recommended (not implemented in this patch)

- Add rate limiting / attempt throttling for:
  - email/password sign-in and registration
  - MetaMask auth attempts
  - nonce issuance and guest session endpoints
- Add stronger password policy (complexity + breach checks optional).
- Consider SIWE (EIP-4361) for standardized wallet sign-in messages.

