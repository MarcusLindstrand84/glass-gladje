# GDPR-översikt

Glassglädje hanterar personuppgifter i enlighet med GDPR (EU 2016/679).

## Personuppgifter

| Data | Syfte | Laglig grund |
|------|--------|--------------|
| E-post, namn, telefon | Konto & order | Avtal |
| Leveransadress | Leverans | Avtal |
| Marknadsföringsconsent | Nyhetsbrev | Samtycke |
| Orderhistorik | Kundservice & bokföring | Avtal / rättslig förpliktelse |
| Loggar (kort tid) | Säkerhet | Berättigat intresse |

## Underbiträden

- Stripe (betalning)
- ElevenLabs (röst, valfritt)
- E-postleverantör
- Hosting / SQL Server-drift

## Rättigheter

Tillgång, rättelse, radering, begränsning, portabilitet, invändning.  
Kontakt: privacy@glassgladje.se (placeholder).  
Tillsynsmyndighet: IMY.

## Tekniska åtgärder

- Lösenord hashade (ASP.NET Identity)
- JWT med begränsad livstid + refresh revocation
- Soft delete-flagga på användare (`IsDeleted`)
- Minimering av PII i loggar
- Rollbaserad åtkomst till bokföring

## UI

Publik policy: `/integritet`
