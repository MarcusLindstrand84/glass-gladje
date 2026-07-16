using Glassgladje.Domain.Common;
using Glassgladje.Domain.Enums;

namespace Glassgladje.Domain.Entities;

public class Product : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string NameSv { get; set; } = string.Empty;
    public string DescriptionSv { get; set; } = string.Empty;
    public string ShortDescriptionSv { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? BaseImageUrl { get; set; }
    public int SortOrder { get; set; }

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductDietaryTag> DietaryTags { get; set; } = new List<ProductDietaryTag>();
}

public class ProductDietaryTag
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public DietaryTag Tag { get; set; }
}
