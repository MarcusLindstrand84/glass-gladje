namespace Glassgladje.Application.Interfaces;

public interface IPaymentService
{
    bool IsConfigured { get; }
    string? PublishableKey { get; }

    Task<(string PaymentIntentId, string ClientSecret)> CreatePaymentIntentAsync(
        Guid orderId,
        string orderNumber,
        long amountOre,
        string currency,
        string receiptEmail,
        CancellationToken ct = default);

    Task<string?> ValidateWebhookAndGetPaymentIntentIdAsync(
        string json,
        string stripeSignatureHeader,
        CancellationToken ct = default);
}
