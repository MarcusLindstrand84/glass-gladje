using Glassgladje.Application.Common;
using Glassgladje.Domain.Entities;
using Glassgladje.Domain.Enums;
using Glassgladje.Infrastructure.Identity;
using Glassgladje.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Glassgladje.Infrastructure.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");
        var db = sp.GetRequiredService<ApplicationDbContext>();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();

        await db.Database.MigrateAsync();

        foreach (var role in new[] { AppRoles.Admin, AppRoles.Customer })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        const string adminEmail = "admin@glassgladje.se";
        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Glassglädje Admin",
                EmailConfirmed = true,
                TermsAcceptedAt = DateTimeOffset.UtcNow
            };
            var result = await userManager.CreateAsync(admin, "ChangeMe!Admin1");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, AppRoles.Admin);
                await userManager.AddToRoleAsync(admin, AppRoles.Customer);
                logger.LogInformation("Seeded admin user {Email} (change password on first login)", adminEmail);
            }
            else
            {
                logger.LogError("Failed to seed admin: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        if (await db.Products.AnyAsync())
        {
            return;
        }

        var catalog = GetCatalog();
        db.Products.AddRange(catalog);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} products", catalog.Count);
    }

    private static List<Product> GetCatalog()
    {
        var products = new List<(string Slug, string Name, string Short, string Desc, DietaryTag[] Tags, string Allergens, string Ingredients, decimal Price500, decimal Price1L)>
        {
            ("solmogen-jordgubb", "Solmogen Jordgubb",
                "Svenska jordgubbar i högsäsong – ren sommar i varje sked.",
                "Svenska jordgubbar i högsäsong, svalt syrliga, ren sommar i varje sked. Vi plockar smaken när den är som bäst och låter frukten stå i centrum – utan onödig sötma.",
                [DietaryTag.Glutenfri], "[]",
                "Grädde, mjölk, socker, jordgubbar, citronsaft, vanilj.", 89m, 149m),
            ("vanilj-fran-madagaskar", "Vanilj från Madagaskar",
                "Klassikern på riktigt – gräddig bas och äkta vaniljstång.",
                "Klassikern, men på riktigt: gräddig bas, äkta vaniljstång, inget konstlat. En vardagslyx som passar till allt – och till ingenting alls.",
                [DietaryTag.Glutenfri], "[]",
                "Grädde, mjölk, socker, äggula, vaniljstång från Madagaskar.", 85m, 145m),
            ("mork-choklad-70", "Mörk Choklad 70%",
                "Djup, vuxen chokladton med silkeslen smältkänsla.",
                "Djup, vuxen chokladton med silkeslen smältkänsla. För dig som vill ha intensitet utan bitterhet – premiumkakao i varje sked.",
                [DietaryTag.Glutenfri], "[\"Mjölk\"]",
                "Grädde, mjölk, socker, mörk choklad 70%, kakao.", 95m, 159m),
            ("havsalt-karamell", "Havsalt Karamell",
                "Långsamt kokad karamell med knäckig sälta.",
                "Karamellkok på långsam värme, knäckig sälta som stannar kvar. Balansen mellan sött och salt är vår stolthet.",
                [DietaryTag.Glutenfri], "[]",
                "Grädde, mjölk, socker, smör, havssalt, vanilj.", 92m, 155m),
            ("hallon-vit-choklad", "Hallon & Vit Choklad",
                "Skogssyrliga hallon möter krämig vit choklad.",
                "Skogssyrliga hallon möter krämig vit choklad – fest utan ansträngning. Perfekt till middagssällskapet eller en tyst stund i solen.",
                [DietaryTag.Glutenfri], "[\"Mjölk\"]",
                "Grädde, mjölk, socker, hallon, vit choklad.", 94m, 158m),
            ("pistage-sicilien", "Pistage Sicilien",
                "Nött, elegant – grön av äkta pistage, inte färgämnen.",
                "Nött, elegant, grön av äkta pistage – inte av färgämnen. En medelhavsklassiker i nordisk inramning.",
                [DietaryTag.Glutenfri, DietaryTag.Notter], "[\"Nötter\",\"Mjölk\"]",
                "Grädde, mjölk, socker, pistagenötter, vanilj.", 109m, 179m),
            ("citronmarang", "Citronmaräng",
                "Frisk citronglass med marängtouch – som en tårta i frysen.",
                "Frisk citronglass med marängtouch – som en tårta i frysen. Ljus, elegant och oväntat merish.",
                [DietaryTag.Glutenfri], "[\"Ägg\"]",
                "Grädde, mjölk, socker, citronsaft, citronskal, äggvita, vanilj.", 90m, 152m),
            ("kanelbulle", "Kanelbulle",
                "Doften av lördagsfika – kanel, kardemumma, mjuk degkänsla.",
                "Doften av lördagsfika: kanel, kardemumma, mjuk degkänsla i glassform. Svensk myskultur i fryst form.",
                [], "[\"Gluten\",\"Mjölk\"]",
                "Grädde, mjölk, socker, vetemjöl, kanel, kardemumma, smör.", 88m, 148m),
            ("blabarsskog", "Blåbärsskog",
                "Vilda blåbär, lätt syra, nordisk renhet.",
                "Vilda blåbär, lätt syra, nordisk renhet. En smak som tar dig ut i skogen – utan mygg.",
                [DietaryTag.Glutenfri], "[]",
                "Grädde, mjölk, socker, blåbär, citronsaft.", 91m, 153m),
            ("kokos-lime", "Kokos & Lime",
                "Tropisk men balanserad – vegansk kokosgrädde och limezest.",
                "Tropisk men balanserad; kokosgrädde och limezest utan kompromiss. För dig som vill ha värme utan mejeri.",
                [DietaryTag.Vegan, DietaryTag.Laktosfri, DietaryTag.Glutenfri], "[]",
                "Kokosgrädde, kokosmjölk, socker, limezest, limesaft, vanilj.", 96m, 162m),
            ("salt-lakrits", "Salt lakrits",
                "Nordisk lakrits med sälta och mörk sötma.",
                "För den som vågar: nordisk lakrits med sälta och mörk sötma. En vuxen favorit som delar rummet – på bästa sätt.",
                [DietaryTag.Glutenfri], "[]",
                "Grädde, mjölk, socker, lakritsextrakt, havssalt, melass.", 93m, 156m),
            ("honung-timjan", "Honung & Timjan",
                "Lantlig elegans – mild honung och aromatisk timjan.",
                "Lantlig elegans; mild honung och aromatisk timjan för ostbrickan eller kvällssolen. Ovnatad, minnesvärd, mjuk.",
                [DietaryTag.Glutenfri], "[]",
                "Grädde, mjölk, socker, honung, timjan, vanilj.", 98m, 165m),
        };

        var list = new List<Product>();
        var order = 1;
        foreach (var p in products)
        {
            var product = new Product
            {
                Slug = p.Slug,
                NameSv = p.Name,
                ShortDescriptionSv = p.Short,
                DescriptionSv = p.Desc,
                SortOrder = order++,
                IsActive = true,
                BaseImageUrl = $"/images/products/{p.Slug}.jpg"
            };

            foreach (var tag in p.Tags)
            {
                product.DietaryTags.Add(new ProductDietaryTag { Tag = tag });
            }

            var skuBase = p.Slug.ToUpperInvariant().Replace("-", "");
            if (skuBase.Length > 10) skuBase = skuBase[..10];
            product.Variants.Add(CreateVariant(p.Name, "500ml", ProductFormat.Burk, $"GG-{skuBase}-500", p.Price500, p.Allergens, p.Ingredients, 40));
            product.Variants.Add(CreateVariant(p.Name, "1L", ProductFormat.Burk, $"GG-{skuBase}-1L", p.Price1L, p.Allergens, p.Ingredients, 25));

            list.Add(product);
        }

        return list;
    }

    private static ProductVariant CreateVariant(
        string flavor, string size, ProductFormat format, string sku,
        decimal price, string allergensJson, string ingredients, int stock) =>
        new()
        {
            FlavorNameSv = flavor,
            Size = size,
            Format = format,
            Sku = sku.Replace("--", "-"),
            PriceSekInclVat = price,
            VatRate = 0.12m,
            StockQty = stock,
            AllergensJson = allergensJson,
            IngredientsSv = ingredients,
            IsActive = true
        };
}
