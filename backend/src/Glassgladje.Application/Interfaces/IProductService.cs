using Glassgladje.Application.DTOs;

namespace Glassgladje.Application.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductFilterQuery filter, CancellationToken ct = default);
    Task<ProductDetailDto?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ProductDetailDto> CreateAsync(CreateProductRequest request, CancellationToken ct = default);
    Task<ProductDetailDto?> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct = default);
    Task<ProductVariantDto?> UpdateVariantAsync(Guid variantId, UpdateVariantRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}
