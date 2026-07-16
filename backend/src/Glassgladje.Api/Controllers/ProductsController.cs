using FluentValidation;
using Glassgladje.Application.Common;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Glassgladje.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(
    IProductService productService,
    IValidator<CreateProductRequest> createValidator,
    IValidator<UpdateProductRequest> updateValidator) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> GetProducts(
        [FromQuery] string? search,
        [FromQuery] DietaryTag? dietaryTag,
        [FromQuery] ProductFormat? format,
        [FromQuery] bool? inStockOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken ct = default)
    {
        var result = await productService.GetProductsAsync(
            new ProductFilterQuery(search, dietaryTag, format, inStockOnly, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductDetailDto>> GetBySlug(string slug, CancellationToken ct)
    {
        var product = await productService.GetBySlugAsync(slug, ct);
        return product is null ? NotFound(new { message = "Produkten hittades inte." }) : Ok(product);
    }

    [HttpGet("id/{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ProductDetailDto>> GetById(Guid id, CancellationToken ct)
    {
        var product = await productService.GetByIdAsync(id, ct);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ProductDetailDto>> Create([FromBody] CreateProductRequest request, CancellationToken ct)
    {
        var validation = await createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var created = await productService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetBySlug), new { slug = created.Slug }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ProductDetailDto>> Update(Guid id, [FromBody] UpdateProductRequest request, CancellationToken ct)
    {
        var validation = await updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });
        }

        var updated = await productService.UpdateAsync(id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPut("variants/{variantId:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ProductVariantDto>> UpdateVariant(
        Guid variantId, [FromBody] UpdateVariantRequest request, CancellationToken ct)
    {
        var updated = await productService.UpdateVariantAsync(variantId, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await productService.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}
