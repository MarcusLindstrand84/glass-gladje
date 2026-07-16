using Glassgladje.Application.DTOs;
using Glassgladje.Domain.Enums;

namespace Glassgladje.Application.Interfaces;

public interface IOrderService
{
    Task<CreateOrderResponse> CreateOrderAsync(CreateOrderRequest request, string? userId, CancellationToken ct = default);
    Task HandlePaymentSucceededAsync(string paymentIntentId, CancellationToken ct = default);
    Task HandleDevMockPaymentAsync(Guid orderId, CancellationToken ct = default);
    Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<OrderDto?> GetByOrderNumberAsync(string orderNumber, CancellationToken ct = default);
    Task<IReadOnlyList<OrderDto>> GetForUserAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<OrderDto>> GetAllAsync(int take = 50, CancellationToken ct = default);
    Task<OrderDto?> UpdateStatusAsync(Guid id, OrderStatus status, CancellationToken ct = default);
}
