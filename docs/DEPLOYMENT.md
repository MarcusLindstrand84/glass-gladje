# Glassglädje – Deployment guide

## Architecture

- **Frontend:** static SPA (Vite build → CDN / static host)
- **API:** ASP.NET Core 10 on Windows/Linux
- **Database:** SQL Server (t.ex. `localhost\SQLEXPRESS` i dev; managed SQL i prod)

## Production checklist

1. **SQL Server**
   - Create database `Glassgladje`
   - Set `ConnectionStrings__Default`
   - Set `Database__Provider=SqlServer`
   - Run app once (migrations + seed) or `dotnet ef database update`

2. **Secrets (never commit)**
   - `ConnectionStrings__Default` (eller `appsettings.Development.json` lokalt)
   - `Jwt__Key` (≥ 32 random chars; krävs vid start)
   - Maskinspecifika overrides: `appsettings.Development.local.json` (gitignorerad)
   - `Stripe__SecretKey`, `Stripe__PublishableKey`, `Stripe__WebhookSecret`
   - `ElevenLabs__ApiKey`, `ElevenLabs__VoiceId`
   - Change seed admin password immediately (`admin@glassgladje.se`)

3. **CORS / Frontend**
   - `Frontend__BaseUrl=https://your-domain.se`
   - Build frontend: `cd frontend && npm ci && npm run build`
   - Set `VITE_API_URL=https://api.your-domain.se/api`

4. **HTTPS**
   - Terminate TLS at reverse proxy or host
   - HSTS enabled outside Development

5. **Stripe webhooks**
   - Endpoint: `POST https://api…/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`

6. **Health**
   - Probe: `GET /api/health`

7. **Backups**
   - Nightly full + hourly log backups for SQL Server
   - Test restore quarterly

## Environment matrix

| Variable | Dev | Prod |
|----------|-----|------|
| `ASPNETCORE_ENVIRONMENT` | Development | Production |
| `Database__Provider` | SqlServer | SqlServer |
| Stripe keys | test or empty (dev-mock) | live |
| ElevenLabs | optional | optional |
| JWT key | appsettings dev key | secret store |

## Smoke test after deploy

1. `GET /api/health` → healthy  
2. `GET /api/products` → ≥ 1 product  
3. Login admin  
4. Create order (Stripe test or verify webhook)  
5. `GET /api/accounting/dashboard` as admin  
6. `POST /api/elevenagent/chat` with a simple message  

## Rollback

1. Redeploy previous API artifact  
2. If migration was applied, restore DB backup (do not auto-rollback schema)  
