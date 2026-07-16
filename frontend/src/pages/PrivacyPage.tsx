export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-sm">
      <h1 className="font-display text-3xl">Integritetspolicy</h1>
      <p className="text-charcoal/70 mt-2">Glassglädje · Senast uppdaterad 2026-07-15</p>

      <section className="mt-8 space-y-4 text-charcoal/90 leading-relaxed">
        <p>
          Vi värnar din integritet. Denna policy beskriver hur Glassglädje behandlar personuppgifter
          i enlighet med GDPR (EU 2016/679).
        </p>

        <h2 className="font-display text-xl mt-6">Personuppgiftsansvarig</h2>
        <p>Glassglädje · hej@glassgladje.se (placeholder för produktionsuppgifter).</p>

        <h2 className="font-display text-xl mt-6">Vilka uppgifter vi samlar in</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Konto: namn, e-post, telefon (valfritt), lösenord (hashat)</li>
          <li>Order: leveransadress, orderhistorik, betalningsreferens (via Stripe – vi lagrar inte kortnummer)</li>
          <li>Samtycke till marknadsföring (om du kryssat i)</li>
          <li>Tekniska loggar i begränsad omfattning för säkerhet</li>
        </ul>

        <h2 className="font-display text-xl mt-6">Ändamål och laglig grund</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fullgöra köpeavtal och leverans (avtal)</li>
          <li>Kundservice och orderhantering (avtal / berättigat intresse)</li>
          <li>Bokföring och rättsliga skyldigheter (rättslig förpliktelse)</li>
          <li>Marknadsföring endast med samtycke</li>
        </ul>

        <h2 className="font-display text-xl mt-6">Mottagare</h2>
        <p>
          Betalning: Stripe. Röstfunktion (valfritt): ElevenLabs. E-postleverantör för orderbekräftelse.
          Hosting-leverantör. Vi säljer inte dina uppgifter.
        </p>

        <h2 className="font-display text-xl mt-6">Lagringstid</h2>
        <p>
          Kontouppgifter tills du raderar kontot. Orderdata sparas enligt bokföringskrav.
          Marknadsföringssamtycke tills det återkallas.
        </p>

        <h2 className="font-display text-xl mt-6">Dina rättigheter</h2>
        <p>
          Du har rätt till tillgång, rättelse, radering, begränsning, dataportabilitet och att
          invända. Kontakta privacy@glassgladje.se. Du kan också klaga till Integritetsskyddsmyndigheten (IMY).
        </p>

        <h2 className="font-display text-xl mt-6">Säkerhet</h2>
        <p>
          Vi använder HTTPS i produktion, lösenordshashning, rollbaserad åtkomst och minimerar
          personuppgifter i loggar.
        </p>
      </section>
    </div>
  )
}
