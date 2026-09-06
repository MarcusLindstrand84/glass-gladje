# Security notes (Phase 5)

## OWASP Top 10 awareness

| Risk | Mitigation in Glassglädje |
|------|---------------------------|
| Injection | EF Core parameterized queries |
| Broken auth | Identity + JWT, password policy, lockout, TOTP 2FA |
| Sensitive data | No card data stored; secrets in config/env |
| XXE / SSRF | No XML user input; server-side API keys only |
| Access control | `[Authorize(Roles=Admin)]` on accounting/admin product writes; order GET requires admin, owner, or HMAC `accessToken` |
| Misconfig | Security headers middleware; CORS allowlist |
| XSS | React escapes by default; avoid `dangerouslySetInnerHTML` |
| Insecure deserial. | System.Text.Json on DTOs only |
| Logging | Serilog; avoid logging passwords/tokens |
| Rate limits | Agent + auth fixed-window limiters |

## Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (microphone self for voice)
- `HSTS` in non-Development

## Secrets

- Production: set `Jwt__Key` and `ConnectionStrings__Default` via environment / secret store — never commit real keys in `appsettings.json`.
- Development: committed `appsettings.Development.json` holds a **local-only** JWT and the desktop SQL Express instance; override with `*.local.json` if needed.
- Missing/short JWT key fails startup (no hardcoded production fallback).

## GDPR

See `docs/GDPR.md` and `/integritet` in the SPA.

## Two-factor authentication (TOTP)

- Setup: `POST /api/auth/2fa/setup` → QR URI + manual key  
- Enable: `POST /api/auth/2fa/enable` with app code → recovery codes (shown once)  
- Disable: `POST /api/auth/2fa/disable` with app or recovery code  
- Login: if 2FA on, `POST /api/auth/login` returns challenge; complete with `POST /api/auth/login/2fa`  
- Admin UI: setup panel on `/admin`  
- Apps: Google Authenticator, Authy, 1Password, etc.  
- Pending login tokens expire in ~15 minutes  

## Orders / PII

- Order create returns an HMAC `accessToken` (signed with `Jwt:Key`).
- Guest confirmation uses `GET /api/orders/{id}?accessToken=…` (SPA passes the query param from checkout).
- Anonymous GET without a valid token (and without owner/admin auth) returns **404**.
- Do not log `accessToken` values.

## Stripe / ElevenLabs

- Keys only on API host  
- Webhook signature validation  
- TTS character cap in `ElevenLabsTtsService`  
