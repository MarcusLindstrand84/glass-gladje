using Glassgladje.Domain.Enums;

namespace Glassgladje.Application.DTOs;

public record ProductListItemDto(
    Guid Id,
    string Slug,
    string NameSv,
    string ShortDescriptionSv,
    string? BaseImageUrl,
    IReadOnlyList<string> DietaryTags,
    decimal FromPriceSekInclVat,
    bool InStock);

public record ProductDetailDto(
    Guid Id,
    string Slug,
    string NameSv,
    string DescriptionSv,
    string ShortDescriptionSv,
    string? BaseImageUrl,
    IReadOnlyList<string> DietaryTags,
    IReadOnlyList<ProductVariantDto> Variants);

public record ProductVariantDto(
    Guid Id,
    string FlavorNameSv,
    string Size,
    string Format,
    string Sku,
    decimal PriceSekInclVat,
    decimal VatRate,
    int StockQty,
    IReadOnlyList<string> Allergens,
    string IngredientsSv,
    string? ImageUrl,
    bool IsActive);

public record CreateProductRequest(
    string NameSv,
    string Slug,
    string DescriptionSv,
    string ShortDescriptionSv,
    string? BaseImageUrl,
    int SortOrder,
    bool IsActive,
    IReadOnlyList<DietaryTag> DietaryTags,
    IReadOnlyList<CreateVariantRequest> Variants);

public record CreateVariantRequest(
    string FlavorNameSv,
    string Size,
    ProductFormat Format,
    string Sku,
    decimal PriceSekInclVat,
    decimal VatRate,
    int StockQty,
    IReadOnlyList<string> Allergens,
    string IngredientsSv,
    string? ImageUrl,
    bool IsActive);

public record UpdateProductRequest(
    string NameSv,
    string DescriptionSv,
    string ShortDescriptionSv,
    string? BaseImageUrl,
    int SortOrder,
    bool IsActive,
    IReadOnlyList<DietaryTag> DietaryTags);

public record UpdateVariantRequest(
    string FlavorNameSv,
    string Size,
    ProductFormat Format,
    decimal PriceSekInclVat,
    decimal VatRate,
    int StockQty,
    IReadOnlyList<string> Allergens,
    string IngredientsSv,
    string? ImageUrl,
    bool IsActive);

public record ProductFilterQuery(
    string? Search,
    DietaryTag? DietaryTag,
    ProductFormat? Format,
    bool? InStockOnly,
    int Page = 1,
    int PageSize = 24);

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);
