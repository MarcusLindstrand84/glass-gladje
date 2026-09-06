using Glassgladje.Domain.Enums;

namespace Glassgladje.Application.DTOs;

public record CartItemRequest(Guid ProductVariantId, int Quantity);

public record ShippingAddressDto(
    string FullName,
    string Street,
    string PostalCode,
    string City,
    string Country,
    string? Phone);

public record CreateOrderRequest(
    IReadOnlyList<CartItemRequest> Items,
    string Email,
    string CustomerName,
    ShippingAddressDto ShippingAddress);

public record CreateOrderResponse(
    Guid OrderId,
    string OrderNumber,
    decimal TotalInclVat,
    string Currency,
    string? ClientSecret,
    string? PublishableKey,
    bool DevMockPayment,
    string AccessToken);

public record ConfirmDevPaymentRequest(Guid OrderId);

public record OrderItemDto(
    Guid ProductVariantId,
    string ProductName,
    string VariantLabel,
    int Quantity,
    decimal UnitPriceInclVat,
    decimal LineTotalInclVat);

public record OrderDto(
    Guid Id,
    string OrderNumber,
    string Status,
    string CustomerName,
    string Email,
    decimal SubtotalExclVat,
    decimal VatAmount,
    decimal TotalInclVat,
    string Currency,
    DateTimeOffset CreatedAt,
    IReadOnlyList<OrderItemDto> Items);

public record UpdateOrderStatusRequest(OrderStatus Status);
