using System.Text.Json;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Entities;
using Glassgladje.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Glassgladje.Application.Orders;

public class OrderService(
    IApplicationDbContext db,
    IPaymentService paymentService,
    IEmailSender emailSender) : IOrderService
{
    public async Task<CreateOrderResponse> CreateOrderAsync(
        CreateOrderRequest request,
        string? userId,
        CancellationToken ct = default)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new InvalidOperationException("Korgen är tom.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new InvalidOperationException("E-post krävs.");
        }

        if (string.IsNullOrWhiteSpace(request.CustomerName))
        {
            throw new InvalidOperationException("Namn krävs.");
        }

        // Merge duplicate variant lines (qty sum)
        var lines = request.Items
            .GroupBy(i => i.ProductVariantId)
            .Select(g => new CartItemRequest(g.Key, g.Sum(x => x.Quantity)))
            .ToList();

        if (lines.Any(l => l.Quantity < 1))
        {
            throw new InvalidOperationException("Ogiltigt antal.");
        }

        var variantIds = lines.Select(i => i.ProductVariantId).ToList();
        var variants = await db.ProductVariants
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id) && v.IsActive && v.Product.IsActive)
            .ToListAsync(ct);

        if (variants.Count != variantIds.Count)
        {
            throw new InvalidOperationException("En eller flera produkter är inte tillgängliga.");
        }

        var order = new Order
        {
            OrderNumber = GenerateOrderNumber(),
            UserId = userId,
            // Always store contact email for confirmation (guest or registered)
            GuestEmail = request.Email.Trim().ToLowerInvariant(),
            CustomerName = request.CustomerName.Trim(),
            Status = OrderStatus.PendingPayment,
            Currency = "SEK",
            ShippingAddressJson = JsonSerializer.Serialize(request.ShippingAddress)
        };

        decimal totalIncl = 0;
        decimal vatTotal = 0;

        foreach (var line in lines)
        {
            var variant = variants.First(v => v.Id == line.ProductVariantId);
            if (variant.StockQty < line.Quantity)
            {
                throw new InvalidOperationException(
                    $"Otillräckligt lager för {variant.Product.NameSv} ({variant.Size}).");
            }

            var lineTotal = variant.PriceSekInclVat * line.Quantity;
            var lineVat = Math.Round(lineTotal * variant.VatRate / (1 + variant.VatRate), 2, MidpointRounding.AwayFromZero);

            order.Items.Add(new OrderItem
            {
                ProductVariantId = variant.Id,
                ProductNameSnapshot = variant.Product.NameSv,
                VariantLabelSnapshot = $"{variant.Size} · {variant.Format}",
                UnitPriceInclVat = variant.PriceSekInclVat,
                Quantity = line.Quantity,
                LineTotalInclVat = lineTotal,
                VatRate = variant.VatRate
            });

            totalIncl += lineTotal;
            vatTotal += lineVat;
        }

        order.TotalInclVat = totalIncl;
        order.VatAmount = vatTotal;
        order.SubtotalExclVat = totalIncl - vatTotal;

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        string? clientSecret = null;
        var devMock = !paymentService.IsConfigured;

        if (!devMock)
        {
            var amountOre = (long)Math.Round(order.TotalInclVat * 100, MidpointRounding.AwayFromZero);
            var (intentId, secret) = await paymentService.CreatePaymentIntentAsync(
                order.Id,
                order.OrderNumber,
                amountOre,
                "sek",
                request.Email.Trim(),
                ct);

            order.StripePaymentIntentId = intentId;
            await db.SaveChangesAsync(ct);
            clientSecret = secret;
        }

        return new CreateOrderResponse(
            order.Id,
            order.OrderNumber,
            order.TotalInclVat,
            order.Currency,
            clientSecret,
            paymentService.PublishableKey,
            devMock);
    }

    public async Task HandlePaymentSucceededAsync(string paymentIntentId, CancellationToken ct = default)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntentId, ct);

        if (order is null)
        {
            return;
        }

        await MarkPaidAndFulfillAsync(order, ct);
    }

    public async Task HandleDevMockPaymentAsync(Guid orderId, CancellationToken ct = default)
    {
        if (paymentService.IsConfigured)
        {
            throw new InvalidOperationException("Dev-mock betalning är avstängd när Stripe är konfigurerat.");
        }

        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct)
            ?? throw new InvalidOperationException("Ordern hittades inte.");

        await MarkPaidAndFulfillAsync(order, ct);
    }

    public async Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
        return order is null ? null : Map(order);
    }

    public async Task<OrderDto?> GetByOrderNumberAsync(string orderNumber, CancellationToken ct = default)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);
        return order is null ? null : Map(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetForUserAsync(string userId, CancellationToken ct = default)
    {
        var orders = await db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Take(50)
            .ToListAsync(ct);
        return orders.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<OrderDto>> GetAllAsync(int take = 50, CancellationToken ct = default)
    {
        var orders = await db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Take(take)
            .ToListAsync(ct);
        return orders.Select(Map).ToList();
    }

    public async Task<OrderDto?> UpdateStatusAsync(Guid id, OrderStatus status, CancellationToken ct = default)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order is null) return null;
        order.Status = status;
        order.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Map(order);
    }

    private async Task MarkPaidAndFulfillAsync(Order order, CancellationToken ct)
    {
        if (order.Status is OrderStatus.Paid or OrderStatus.Processing or OrderStatus.Shipped or OrderStatus.Completed)
        {
            return; // idempotent
        }

        if (order.Status != OrderStatus.PendingPayment)
        {
            throw new InvalidOperationException($"Ordern kan inte betalas i status {order.Status}.");
        }

        foreach (var item in order.Items)
        {
            var variant = await db.ProductVariants.FirstAsync(v => v.Id == item.ProductVariantId, ct);
            if (variant.StockQty < item.Quantity)
            {
                throw new InvalidOperationException($"Otillräckligt lager för {item.ProductNameSnapshot}.");
            }

            variant.StockQty -= item.Quantity;
            variant.UpdatedAt = DateTimeOffset.UtcNow;

            db.InventoryTransactions.Add(new InventoryTransaction
            {
                ProductVariantId = variant.Id,
                DeltaQty = -item.Quantity,
                Reason = InventoryReason.Sale,
                OrderId = order.Id,
                Note = $"Order {order.OrderNumber}"
            });
        }

        order.Status = OrderStatus.Paid;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        var existingAccounting = await db.AccountingTransactions
            .AnyAsync(a => a.LinkedOrderId == order.Id, ct);
        if (!existingAccounting)
        {
            db.AccountingTransactions.Add(new AccountingTransaction
            {
                Type = AccountingType.Income,
                Category = AccountingCategory.ForsaljningGlass,
                AmountInclVat = order.TotalInclVat,
                VatAmount = order.VatAmount,
                VatRate = 0.12m,
                TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                LinkedOrderId = order.Id,
                Description = $"Försäljning order {order.OrderNumber}",
                CreatedByUserId = order.UserId
            });
        }

        db.AuditLogs.Add(new AuditLog
        {
            ActorUserId = order.UserId,
            Action = "OrderPaid",
            EntityType = nameof(Order),
            EntityId = order.Id.ToString(),
            PayloadJson = JsonSerializer.Serialize(new { order.OrderNumber, order.TotalInclVat })
        });

        await db.SaveChangesAsync(ct);

        if (!string.IsNullOrWhiteSpace(order.GuestEmail))
        {
            await emailSender.SendOrderConfirmationAsync(
                order.GuestEmail,
                order.CustomerName,
                order.OrderNumber,
                order.TotalInclVat,
                ct);
        }
    }

    private static string GenerateOrderNumber()
    {
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        var rand = Random.Shared.Next(1000, 9999);
        return $"GG-{date}-{rand}";
    }

    private static OrderDto Map(Order o)
    {
        // Email: GuestEmail or empty (UI may show customer name only)
        var email = o.GuestEmail ?? string.Empty;
        return new OrderDto(
            o.Id,
            o.OrderNumber,
            o.Status.ToString(),
            o.CustomerName,
            email,
            o.SubtotalExclVat,
            o.VatAmount,
            o.TotalInclVat,
            o.Currency,
            o.CreatedAt,
            o.Items.Select(i => new OrderItemDto(
                i.ProductVariantId,
                i.ProductNameSnapshot,
                i.VariantLabelSnapshot,
                i.Quantity,
                i.UnitPriceInclVat,
                i.LineTotalInclVat)).ToList());
    }
}
