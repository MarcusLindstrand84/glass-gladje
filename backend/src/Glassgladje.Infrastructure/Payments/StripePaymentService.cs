using Glassgladje.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;

namespace Glassgladje.Infrastructure.Payments;

public class StripePaymentService(IOptions<StripeOptions> options, ILogger<StripePaymentService> logger) : IPaymentService
{
    private readonly StripeOptions _options = options.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.SecretKey);
    public string? PublishableKey => string.IsNullOrWhiteSpace(_options.PublishableKey) ? null : _options.PublishableKey;

    public async Task<(string PaymentIntentId, string ClientSecret)> CreatePaymentIntentAsync(
        Guid orderId,
        string orderNumber,
        long amountOre,
        string currency,
        string receiptEmail,
        CancellationToken ct = default)
    {
        StripeConfiguration.ApiKey = _options.SecretKey;

        var service = new PaymentIntentService();
        var intent = await service.CreateAsync(new PaymentIntentCreateOptions
        {
            Amount = amountOre,
            Currency = currency.ToLowerInvariant(),
            ReceiptEmail = receiptEmail,
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true
            },
            Metadata = new Dictionary<string, string>
            {
                ["orderId"] = orderId.ToString(),
                ["orderNumber"] = orderNumber
            },
            Description = $"Glassglädje order {orderNumber}"
        }, cancellationToken: ct);

        logger.LogInformation("Created Stripe PaymentIntent {Id} for order {OrderNumber}", intent.Id, orderNumber);
        return (intent.Id, intent.ClientSecret);
    }

    public Task<string?> ValidateWebhookAndGetPaymentIntentIdAsync(
        string json,
        string stripeSignatureHeader,
        CancellationToken ct = default)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json,
                stripeSignatureHeader,
                _options.WebhookSecret);

            if (stripeEvent.Type == EventTypes.PaymentIntentSucceeded)
            {
                var intent = stripeEvent.Data.Object as PaymentIntent;
                return Task.FromResult(intent?.Id);
            }

            return Task.FromResult<string?>(null);
        }
        catch (StripeException ex)
        {
            logger.LogWarning(ex, "Stripe webhook validation failed");
            throw;
        }
    }
}
