using Glassgladje.Domain.Common;
using Glassgladje.Domain.Enums;

namespace Glassgladje.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string FlavorNameSv { get; set; } = string.Empty;
    public string Size { get; set; } = "500ml";
    public ProductFormat Format { get; set; } = ProductFormat.Burk;
    public string Sku { get; set; } = string.Empty;

    /// <summary>Price including VAT (B2C display price).</summary>
    public decimal PriceSekInclVat { get; set; }

    /// <summary>Default Swedish reduced food VAT rate (12%).</summary>
    public decimal VatRate { get; set; } = 0.12m;

    public int StockQty { get; set; }
    public string AllergensJson { get; set; } = "[]";
    public string IngredientsSv { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}
