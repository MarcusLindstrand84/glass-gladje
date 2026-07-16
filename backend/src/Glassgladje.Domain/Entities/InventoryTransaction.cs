using Glassgladje.Domain.Common;
using Glassgladje.Domain.Enums;

namespace Glassgladje.Domain.Entities;

public class InventoryTransaction : BaseEntity
{
    public Guid ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = null!;
    public int DeltaQty { get; set; }
    public InventoryReason Reason { get; set; }
    public Guid? OrderId { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? Note { get; set; }
}
