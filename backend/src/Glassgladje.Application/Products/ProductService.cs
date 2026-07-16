using System.Text.Json;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Entities;
using Glassgladje.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Glassgladje.Application.Products;

public class ProductService(IApplicationDbContext db) : IProductService
{
    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductFilterQuery filter, CancellationToken ct = default)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize is < 1 or > 100 ? 24 : filter.PageSize;

        var query = db.Products
            .AsNoTracking()
            .Include(p => p.Variants)
            .Include(p => p.DietaryTags)
            .Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToLowerInvariant();
            query = query.Where(p =>
                p.NameSv.ToLower().Contains(s) ||
                p.ShortDescriptionSv.ToLower().Contains(s) ||
                p.DescriptionSv.ToLower().Contains(s));
        }

        if (filter.DietaryTag is { } tag)
        {
            query = query.Where(p => p.DietaryTags.Any(t => t.Tag == tag));
        }

        if (filter.Format is { } format)
        {
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Format == format));
        }

        if (filter.InStockOnly == true)
        {
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.StockQty > 0));
        }

        var total = await query.CountAsync(ct);
        var products = await query
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.NameSv)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = products.Select(MapListItem).ToList();
        return new PagedResult<ProductListItemDto>(items, total, page, pageSize);
    }

    public async Task<ProductDetailDto?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var product = await db.Products
            .AsNoTracking()
            .Include(p => p.Variants)
            .Include(p => p.DietaryTags)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);

        return product is null ? null : MapDetail(product);
    }

    public async Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var product = await db.Products
            .AsNoTracking()
            .Include(p => p.Variants)
            .Include(p => p.DietaryTags)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return product is null ? null : MapDetail(product);
    }

    public async Task<ProductDetailDto> CreateAsync(CreateProductRequest request, CancellationToken ct = default)
    {
        if (await db.Products.AnyAsync(p => p.Slug == request.Slug, ct))
        {
            throw new InvalidOperationException("En produkt med denna slug finns redan.");
        }

        var product = new Product
        {
            NameSv = request.NameSv.Trim(),
            Slug = request.Slug.Trim().ToLowerInvariant(),
            DescriptionSv = request.DescriptionSv.Trim(),
            ShortDescriptionSv = request.ShortDescriptionSv.Trim(),
            BaseImageUrl = request.BaseImageUrl,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        foreach (var tag in request.DietaryTags.Distinct())
        {
            product.DietaryTags.Add(new ProductDietaryTag { Tag = tag });
        }

        foreach (var v in request.Variants)
        {
            product.Variants.Add(new ProductVariant
            {
                FlavorNameSv = v.FlavorNameSv.Trim(),
                Size = v.Size.Trim(),
                Format = v.Format,
                Sku = v.Sku.Trim().ToUpperInvariant(),
                PriceSekInclVat = v.PriceSekInclVat,
                VatRate = v.VatRate,
                StockQty = v.StockQty,
                AllergensJson = JsonSerializer.Serialize(v.Allergens),
                IngredientsSv = v.IngredientsSv.Trim(),
                ImageUrl = v.ImageUrl,
                IsActive = v.IsActive
            });
        }

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return (await GetByIdAsync(product.Id, ct))!;
    }

    public async Task<ProductDetailDto?> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct = default)
    {
        var product = await db.Products
            .Include(p => p.DietaryTags)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (product is null) return null;

        product.NameSv = request.NameSv.Trim();
        product.DescriptionSv = request.DescriptionSv.Trim();
        product.ShortDescriptionSv = request.ShortDescriptionSv.Trim();
        product.BaseImageUrl = request.BaseImageUrl;
        product.SortOrder = request.SortOrder;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTimeOffset.UtcNow;

        product.DietaryTags.Clear();
        foreach (var tag in request.DietaryTags.Distinct())
        {
            product.DietaryTags.Add(new ProductDietaryTag { ProductId = product.Id, Tag = tag });
        }

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<ProductVariantDto?> UpdateVariantAsync(Guid variantId, UpdateVariantRequest request, CancellationToken ct = default)
    {
        var variant = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId, ct);
        if (variant is null) return null;

        variant.FlavorNameSv = request.FlavorNameSv.Trim();
        variant.Size = request.Size.Trim();
        variant.Format = request.Format;
        variant.PriceSekInclVat = request.PriceSekInclVat;
        variant.VatRate = request.VatRate;
        variant.StockQty = request.StockQty;
        variant.AllergensJson = JsonSerializer.Serialize(request.Allergens);
        variant.IngredientsSv = request.IngredientsSv.Trim();
        variant.ImageUrl = request.ImageUrl;
        variant.IsActive = request.IsActive;
        variant.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return MapVariant(variant);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null) return false;

        product.IsActive = false;
        product.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static ProductListItemDto MapListItem(Product p)
    {
        var activeVariants = p.Variants.Where(v => v.IsActive).ToList();
        var fromPrice = activeVariants.Count == 0 ? 0 : activeVariants.Min(v => v.PriceSekInclVat);
        return new ProductListItemDto(
            p.Id,
            p.Slug,
            p.NameSv,
            p.ShortDescriptionSv,
            p.BaseImageUrl,
            p.DietaryTags.Select(t => t.Tag.ToString()).ToList(),
            fromPrice,
            activeVariants.Any(v => v.StockQty > 0));
    }

    private static ProductDetailDto MapDetail(Product p) =>
        new(
            p.Id,
            p.Slug,
            p.NameSv,
            p.DescriptionSv,
            p.ShortDescriptionSv,
            p.BaseImageUrl,
            p.DietaryTags.Select(t => t.Tag.ToString()).ToList(),
            p.Variants.OrderBy(v => v.PriceSekInclVat).Select(MapVariant).ToList());

    private static ProductVariantDto MapVariant(ProductVariant v)
    {
        var allergens = JsonSerializer.Deserialize<List<string>>(v.AllergensJson) ?? [];
        return new ProductVariantDto(
            v.Id,
            v.FlavorNameSv,
            v.Size,
            v.Format.ToString(),
            v.Sku,
            v.PriceSekInclVat,
            v.VatRate,
            v.StockQty,
            allergens,
            v.IngredientsSv,
            v.ImageUrl,
            v.IsActive);
    }
}
