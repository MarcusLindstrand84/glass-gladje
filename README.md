# Glassglädje

**Glädje du kan smaka**

Premium svensk online-glassbutik med e-handel, smakrådgivare (röstkonsultation via ElevenLabs) och Min Bokföring.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | ASP.NET Core 10 Web API (clean architecture) |
| Database | **SQL Server** (t.ex. `localhost\SQLEXPRESS`) |
| Auth | ASP.NET Identity + JWT + refresh tokens |
| Payments | Stripe (dev-mock without keys) |
| Voice | ElevenLabs TTS + Web Speech STT |

## Quick start

### Prerequisites

- .NET 10 SDK
- Node.js 20+
- SQL Server Express: t.ex. `localhost\SQLEXPRESS` (Windows Authentication)
- VS Code (valfritt, men rekommenderas)

### Bygga (utan att hoppa mellan mappar)

Från mappen `glass-gladje`:

```powershell
.\build.ps1              # dotnet build backend
.\build.ps1 -Test        # build + unit tests
.\build.ps1 -Frontend    # backend + frontend production build
.\build.ps1 -All         # allt ovan
```

**VS Code:** `Ctrl+Shift+B` → **Build Backend** (default).  
Eller `Terminal` → `Run Task…` → **Build All** / **Build + Test Backend**.

### Enklast: starta allt på en gång

**PowerShell** (från mappen `glass-gladje`):

```powershell
.\start.ps1
```

Öppnar två fönster: API på **:5080** och Vite på **:5173**.

**VS Code:**

1. Öppna mappen `glass-gladje` i VS Code  
2. `Terminal` → `Run Task…` → **Start Full Stack**  
3. Vänta tills båda terminalpanelerna visar att de lyssnar  

Debug: `Run and Debug` → **Full Stack (tasks)** (kräver C# extension för API-breakpoints).

### Manuellt (två terminaler)

```powershell
# Terminal 1 – Backend
cd backend
dotnet run --project src/Glassgladje.Api

# Terminal 2 – Frontend
cd frontend
npm install   # första gången
npm run dev
```

| Tjänst | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5080 |
| Health | http://localhost:5080/api/health |
| OpenAPI | http://localhost:5080/openapi/v1.json |

### Seeded admin

| Field | Value |
|-------|--------|
| Email | `admin@glassgladje.se` |
| Password | `ChangeMe!Admin1` |
| 2FA | Aktiveras under Admin → Tvåfaktorsautentisering |

**Byt lösenord i produktion.**

## SQL Server & secrets

Sätt anslutningssträng och JWT via miljövariabler eller `appsettings.Development.json` (committad lokal mall). Maskinspecifika overrides läggs i `appsettings.Development.local.json` (gitignorerad).

| Källa | Exempel |
|-------|---------|
| Env | `ConnectionStrings__Default`, `Jwt__Key` (≥32 tecken) |
| Dev JSON | `backend/src/Glassgladje.Api/appsettings.Development.json` |
| Lokal override | `appsettings.Development.local.json` |

Exempel (lokal SQL Express):

```
Server=localhost\SQLEXPRESS;Database=Glassgladje;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true
```

`appsettings.json` har tomma `ConnectionStrings:Default` och `Jwt:Key` så att hemligheter inte committas.

## MVP features (alla faser)

| Fas | Innehåll | Status |
|-----|----------|--------|
| 1 | Auth, produkter, seed 12 smaker, svensk UI | ✅ |
| 2 | Korg, kassa, ordrar, lager, Stripe-ready, dev-mock betalning | ✅ |
| 3 | ElevenAgent text + röst, rekommendationer, rate limit | ✅ |
| 4 | Min Bokföring, P&L, moms, CSV-export, admin-polish | ✅ |
| 5 | Tester, security headers, integritetssida, deploy/GDPR-docs | ✅ |

### Viktiga routes (SPA)

| Path | Beskrivning |
|------|-------------|
| `/` | Startsida |
| `/butik` | Katalog |
| `/korg` · `/kassa` | Varukorg & checkout |
| `/conversational-ai` | Smakrådgivare (chatt + röst) |
| `/admin` | Admin |
| `/admin/bokforing` | Min Bokföring (admin) |
| `/integritet` | Integritetspolicy |
| `/konto` | Orderhistorik |

### API-översikt

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login\|register\|refresh`, `GET /me` |
| Products | `GET /api/products`, CRUD admin |
| Orders | `POST /api/orders`, dev-confirm, mine, admin list |
| Stripe webhook | `POST /api/webhooks/stripe` |
| ElevenAgent | `POST /api/elevenagent/chat`, `GET …/status` |
| Accounting | `GET /api/accounting/dashboard\|summary\|transactions\|export`, `POST …/transactions` |
| Health | `GET /api/health` |

## Environment variables

| Key | Description |
|-----|-------------|
| `ConnectionStrings__Default` | SQL Server |
| `Database__Provider` | `SqlServer` (default) |
| `Jwt__Key` | ≥32 chars |
| `Frontend__BaseUrl` | CORS origin |
| `Stripe__*` | Optional; empty → dev-mock payment |
| `ElevenLabs__ApiKey` / `VoiceId` | Optional TTS |
| `VITE_API_URL` | Frontend API base |

## Docs

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/GDPR.md](docs/GDPR.md)
- [docs/SECURITY.md](docs/SECURITY.md)

## Tests

```bash
cd backend
dotnet test
```

## Brand

- Peach `#FFB399`
- Warm cream-orange `#FFD6A6`
- Creamy beige `#FFF0BE`
- Tagline: *Glädje du kan smaka*

## License

Proprietary – Glassglädje.
