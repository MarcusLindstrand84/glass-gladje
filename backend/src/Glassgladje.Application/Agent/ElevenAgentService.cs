using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Entities;
using Glassgladje.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Glassgladje.Application.Agent;

/// <summary>
/// Glassglädje smakexpert – katalogmedveten konsultation med varm svensk persona.
/// Fungera offline (utan LLM) via intent/scoring mot sortimentet; TTS via ITextToSpeechService.
/// </summary>
public class ElevenAgentService(IApplicationDbContext db, ITextToSpeechService tts) : IElevenAgentService
{
    public const string PersonaName = "Smakrådgivare";

    public async Task<AgentChatResponse> ChatAsync(AgentChatRequest request, CancellationToken ct = default)
    {
        var message = (request.Message ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new InvalidOperationException("Skriv eller säg något så hjälper jag dig gärna.");
        }

        if (message.Length > 2000)
        {
            throw new InvalidOperationException("Meddelandet är för långt. Försök korta ner det lite.");
        }

        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Include(p => p.DietaryTags)
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(ct);

        var intent = ParseIntent(message, request.History);
        var scored = ScoreProducts(products, intent)
            .Where(s => s.Score > 0)
            .OrderByDescending(s => s.Score)
            .Take(3)
            .ToList();

        // Always offer something useful if nothing scored
        if (scored.Count == 0)
        {
            scored = products
                .Select(p => new ScoredProduct(p, 1, "En omtyckt klassiker i vårt sortiment."))
                .Take(3)
                .ToList();
        }

        var recommendations = scored.Select(s =>
        {
            var variant = s.Product.Variants
                .Where(v => v.IsActive && v.StockQty > 0)
                .OrderBy(v => v.PriceSekInclVat)
                .FirstOrDefault()
                ?? s.Product.Variants.OrderBy(v => v.PriceSekInclVat).FirstOrDefault();

            return new AgentProductRecommendation(
                s.Product.Id,
                s.Product.Slug,
                s.Product.NameSv,
                s.Product.ShortDescriptionSv,
                s.Reason,
                variant?.PriceSekInclVat ?? 0,
                s.Product.DietaryTags.Select(t => t.Tag.ToString()).ToList(),
                variant?.Id,
                variant is null ? null : $"{variant.Size} · {variant.Format}");
        }).ToList();

        var reply = BuildReply(message, intent, recommendations, products);

        string? audioB64 = null;
        string? contentType = null;
        var speechAvailable = false;

        if (request.IncludeSpeech && tts.IsConfigured)
        {
            // Keep TTS cost down: speak a concise version
            var speakText = TruncateForSpeech(reply, 500);
            var audio = await tts.SynthesizeAsync(speakText, ct);
            if (audio is { } a)
            {
                speechAvailable = true;
                audioB64 = Convert.ToBase64String(a.Audio);
                contentType = a.ContentType;
            }
        }

        return new AgentChatResponse(
            reply,
            recommendations,
            speechAvailable,
            audioB64,
            contentType,
            PersonaName);
    }

    private static AgentIntent ParseIntent(string message, IReadOnlyList<AgentChatMessage>? history)
    {
        var text = message.ToLowerInvariant();
        if (history is { Count: > 0 })
        {
            var prior = string.Join(' ', history.TakeLast(4).Select(h => h.Content));
            text = prior.ToLowerInvariant() + " " + text;
        }

        var intent = new AgentIntent();

        // Allergies / exclusions
        if (ContainsAny(text, "nöt", "notter", "nötter", "pistageallerg", "jordnöt"))
            intent.ExcludeNuts = true;
        if (ContainsAny(text, "laktos", "mjölkfri", "mjolkfri", "mejerifri", "mejerifritt"))
            intent.PreferLactoseFree = true;
        if (ContainsAny(text, "vegan", "växtbaserad", "växtbaserat", "inget mejeri", "utan mejeri"))
            intent.PreferVegan = true;
        if (ContainsAny(text, "gluten", "glutenfri", "celiaki"))
            intent.PreferGlutenFree = true;
        if (ContainsAny(text, "ägg", "aggallerg"))
            intent.ExcludeEgg = true;

        // Occasions
        if (ContainsAny(text, "fest", "kalas", "party", "middag", "gäster", "gaster"))
            intent.Occasion = "fest";
        else if (ContainsAny(text, "fika", "lördag", "lordag", "mys", "kväll", "kvall"))
            intent.Occasion = "fika";
        else if (ContainsAny(text, "sommar", "picknick", "strand", "båt", "bat", "ute"))
            intent.Occasion = "sommar";
        else if (ContainsAny(text, "barn", "kids", "familj"))
            intent.Occasion = "familj";
        else if (ContainsAny(text, "romantisk", "date", "tvåsamt", "tvasamt"))
            intent.Occasion = "romantisk";
        else if (ContainsAny(text, "present", "gåva", "gava", "presentkort"))
            intent.Occasion = "present";

        // Flavor keywords
        var flavorMap = new Dictionary<string, string[]>
        {
            ["jordgubb"] = ["jordgubb", "strawberry", "bär", "bar"],
            ["vanilj"] = ["vanilj", "vanilla", "klassisk", "klassiker"],
            ["choklad"] = ["choklad", "choklad", "kakao", "mörk", "mork"],
            ["karamell"] = ["karamell", "salt", "havssalt", "havsalt"],
            ["hallon"] = ["hallon", "raspberry"],
            ["pistage"] = ["pistage", "pistachio"],
            ["citron"] = ["citron", "lemon", "syra", "frisk", "syra"],
            ["kanel"] = ["kanel", "bulle", "kanelbulle", "kardemumma"],
            ["blåbär"] = ["blåbär", "blabar", "blueberry"],
            ["kokos"] = ["kokos", "lime", "tropisk", "coconut"],
            ["lakrits"] = ["lakrits", "salmiak", "licorice"],
            ["honung"] = ["honung", "timjan", "ört", "ort"]
        };

        foreach (var (key, words) in flavorMap)
        {
            if (ContainsAny(text, words))
                intent.FlavorHints.Add(key);
        }

        // Preference tones
        if (ContainsAny(text, "söt", "sot", "sött", "dessert"))
            intent.WantSweet = true;
        if (ContainsAny(text, "syra", "syrlig", "frisk", "fräsch", "frasch"))
            intent.WantFresh = true;
        if (ContainsAny(text, "mörk", "mork", "vuxen", "elegant", "premium"))
            intent.WantBold = true;
        if (ContainsAny(text, "mild", "mjuk", "enkel", "barnvänlig", "barnvanlig"))
            intent.WantMild = true;

        return intent;
    }

    private static List<ScoredProduct> ScoreProducts(List<Product> products, AgentIntent intent)
    {
        var results = new List<ScoredProduct>();

        foreach (var p in products)
        {
            var tags = p.DietaryTags.Select(t => t.Tag).ToHashSet();
            var allergens = p.Variants
                .SelectMany(v =>
                {
                    try { return JsonSerializer.Deserialize<List<string>>(v.AllergensJson) ?? []; }
                    catch { return []; }
                })
                .Select(a => a.ToLowerInvariant())
                .ToHashSet();

            // Hard exclusions
            if (intent.ExcludeNuts && (tags.Contains(DietaryTag.Notter) || allergens.Any(a => a.Contains("nöt"))))
                continue;
            if (intent.ExcludeEgg && allergens.Any(a => a.Contains("ägg") || a.Contains("agg")))
                continue;
            if (intent.PreferVegan && !tags.Contains(DietaryTag.Vegan))
                continue;
            if (intent.PreferLactoseFree && !tags.Contains(DietaryTag.Laktosfri) && !tags.Contains(DietaryTag.Vegan))
            {
                // soft skip unless product is lactose free
                // continue only if we have strong lactose demand
                if (intent.PreferLactoseFree)
                    continue;
            }
            if (intent.PreferGlutenFree && allergens.Any(a => a.Contains("gluten")))
                continue;

            var score = 0;
            var reasons = new List<string>();
            var name = p.NameSv.ToLowerInvariant();
            var desc = (p.DescriptionSv + " " + p.ShortDescriptionSv).ToLowerInvariant();

            foreach (var hint in intent.FlavorHints)
            {
                if (name.Contains(hint) || desc.Contains(hint) || p.Slug.Contains(hint))
                {
                    score += 10;
                    reasons.Add($"Matchar din önskan om {hint}.");
                }
            }

            switch (intent.Occasion)
            {
                case "fest":
                    if (ContainsAny(name + desc, "hallon", "pistage", "choklad", "karamell", "fest"))
                    {
                        score += 5;
                        reasons.Add("Lyfter en festmiddag utan ansträngning.");
                    }
                    break;
                case "fika":
                    if (ContainsAny(name + desc, "kanel", "vanilj", "karamell", "fika"))
                    {
                        score += 5;
                        reasons.Add("Perfekt till lördagsfika och mys.");
                    }
                    break;
                case "sommar":
                    if (ContainsAny(name + desc, "jordgubb", "citron", "blåbär", "blabar", "kokos", "lime", "hallon"))
                    {
                        score += 5;
                        reasons.Add("Svalt och somrigt i varje sked.");
                    }
                    break;
                case "familj":
                    if (ContainsAny(name + desc, "vanilj", "jordgubb", "choklad") && !ContainsAny(name, "lakrits", "salt"))
                    {
                        score += 4;
                        reasons.Add("En trygg favorit som brukar falla alla i smaken.");
                    }
                    break;
                case "romantisk":
                    if (ContainsAny(name + desc, "choklad", "hallon", "honung", "pistage"))
                    {
                        score += 5;
                        reasons.Add("Elegant och lite lyxig – fin till tvåsamheten.");
                    }
                    break;
                case "present":
                    score += 2;
                    reasons.Add("Fungerar fint som en omtänksam present.");
                    break;
            }

            if (intent.WantFresh && ContainsAny(name + desc, "citron", "lime", "hallon", "jordgubb", "blåbär", "blabar", "syra"))
            {
                score += 3;
                reasons.Add("Frisk och syrlig karaktär.");
            }
            if (intent.WantSweet && ContainsAny(name + desc, "karamell", "vanilj", "honung", "choklad"))
            {
                score += 3;
                reasons.Add("Mjuk sötma utan att bli barnslig.");
            }
            if (intent.WantBold && ContainsAny(name + desc, "choklad", "lakrits", "pistage", "70"))
            {
                score += 3;
                reasons.Add("Tydlig, vuxen smakprofil.");
            }
            if (intent.WantMild && ContainsAny(name + desc, "vanilj", "jordgubb", "kokos"))
            {
                score += 3;
                reasons.Add("Mild och välkomnande.");
            }

            if (intent.PreferVegan && tags.Contains(DietaryTag.Vegan))
            {
                score += 6;
                reasons.Add("Helt växtbaserad – utan kompromiss i krämigheten.");
            }
            if (intent.PreferLactoseFree && (tags.Contains(DietaryTag.Laktosfri) || tags.Contains(DietaryTag.Vegan)))
            {
                score += 4;
                reasons.Add("Laktosfri så du kan njuta tryggt.");
            }
            if (intent.PreferGlutenFree && tags.Contains(DietaryTag.Glutenfri))
            {
                score += 2;
            }

            // In stock bonus
            if (p.Variants.Any(v => v.IsActive && v.StockQty > 0))
                score += 1;
            else
                score -= 5;

            if (score > 0)
            {
                var reason = reasons.FirstOrDefault()
                    ?? p.ShortDescriptionSv;
                results.Add(new ScoredProduct(p, score, reason));
            }
        }

        return results;
    }

    private static string BuildReply(
        string userMessage,
        AgentIntent intent,
        List<AgentProductRecommendation> recs,
        List<Product> allProducts)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Vilken glädje att du frågar! Jag är din smakrådgivare hos Glassglädje.");
        sb.AppendLine();

        if (intent.ExcludeNuts)
            sb.AppendLine("Jag tar hänsyn till att du vill undvika nötter.");
        if (intent.PreferVegan)
            sb.AppendLine("Jag utgår från växtbaserade alternativ.");
        if (intent.PreferLactoseFree && !intent.PreferVegan)
            sb.AppendLine("Jag prioriterar laktosfria smaker.");
        if (intent.PreferGlutenFree)
            sb.AppendLine("Jag håller mig till glutenfria alternativ så långt det går.");

        if (!string.IsNullOrEmpty(intent.Occasion))
        {
            sb.AppendLine(intent.Occasion switch
            {
                "fest" => "Till fest vill vi ha något som känns generöst och minnesvärt.",
                "fika" => "Till fika passar en smak som doftar hem och lördag.",
                "sommar" => "För sommaren gillar jag friska, ljusa toner.",
                "familj" => "För familjen väljer jag gärna trygga favoriter.",
                "romantisk" => "För en mer intim stund – något elegant och lite lyxigt.",
                "present" => "Som present ska det kännas omtänksamt och lite extra.",
                _ => ""
            });
        }

        sb.AppendLine();
        sb.AppendLine("Här är mina förslag åt dig:");
        sb.AppendLine();

        for (var i = 0; i < recs.Count; i++)
        {
            var r = recs[i];
            sb.AppendLine($"{i + 1}. **{r.NameSv}** – {r.ReasonSv}");
            sb.AppendLine($"   Från {r.FromPriceSekInclVat:0} kr inkl. moms.");
        }

        sb.AppendLine();
        sb.AppendLine("Vill du att jag smalnar av ytterligare – till exempel mer syra, mer sötma, eller något helt veganskt? Berätta bara.");
        sb.AppendLine();
        sb.Append("Glädje du kan smaka. 🍦");

        // If user greets only
        if (IsGreetingOnly(userMessage))
        {
            return
                "Hej och välkommen till Glassglädje! Jag är din personliga smakrådgivare.\n\n" +
                "Berätta gärna om tillfälle, favoritsmaker eller allergier, så plockar jag fram 1–3 smaker som passar dig.\n\n" +
                $"Just nu har vi {allProducts.Count} smaker i sortimentet, från Solmogen Jordgubb till Honung & Timjan.\n\n" +
                "Vad har du för humör idag?";
        }

        return sb.ToString();
    }

    private static bool IsGreetingOnly(string message)
    {
        var t = message.Trim().ToLowerInvariant();
        t = Regex.Replace(t, @"[!?.]+$", "");
        return t is "hej" or "hejsan" or "hallå" or "halla" or "hi" or "hello" or "tjena" or "god dag" or "goddag";
    }

    private static string TruncateForSpeech(string text, int maxLen)
    {
        var plain = text.Replace("**", "").Replace("\r", "");
        if (plain.Length <= maxLen) return plain;
        return plain[..maxLen].TrimEnd() + "…";
    }

    private static bool ContainsAny(string text, params string[] words) =>
        words.Any(w => text.Contains(w, StringComparison.OrdinalIgnoreCase));

    private sealed class AgentIntent
    {
        public bool ExcludeNuts { get; set; }
        public bool ExcludeEgg { get; set; }
        public bool PreferVegan { get; set; }
        public bool PreferLactoseFree { get; set; }
        public bool PreferGlutenFree { get; set; }
        public string? Occasion { get; set; }
        public List<string> FlavorHints { get; } = [];
        public bool WantSweet { get; set; }
        public bool WantFresh { get; set; }
        public bool WantBold { get; set; }
        public bool WantMild { get; set; }
    }

    private sealed record ScoredProduct(Product Product, int Score, string Reason);
}
