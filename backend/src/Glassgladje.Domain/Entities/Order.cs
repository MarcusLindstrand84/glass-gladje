using Glassgladje.Domain.Common;
using Glassgladje.Domain.Enums;

namespace Glassgladje.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? GuestEmail { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;
    public string Currency { get; set; } = "SEK";
    public decimal SubtotalExclVat { get; set; }
    public decimal VatAmount { get; set; }
    public decimal TotalInclVat { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string ShippingAddressJson { get; set; } = "{}";

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = null!;
    public string ProductNameSnapshot { get; set; } = string.Empty;
    public string VariantLabelSnapshot { get; set; } = string.Empty;
    public decimal UnitPriceInclVat { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotalInclVat { get; set; }
    public decimal VatRate { get; set; }
}
