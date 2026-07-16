using Glassgladje.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Glassgladje.Infrastructure.Email;

/// <summary>
/// Dev/MVP email sender — logs confirmation content. Replace with SMTP/Resend in production.
/// </summary>
public class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendOrderConfirmationAsync(
        string toEmail,
        string customerName,
        string orderNumber,
        decimal totalInclVat,
        CancellationToken ct = default)
    {
        logger.LogInformation(
            """
            === Orderbekräftelse (e-post) ===
            Till: {Email}
            Ämne: Tack för din beställning hos Glassglädje – order {OrderNumber}

            Hej {Name},
            vilken glädje att du valde oss! Vi har tagit emot din order och förbereder den
            med samma omsorg som vi lägger i varje glassats.

            Order: {OrderNumber}
            Totalt: {Total:0.00} kr (inkl. moms)

            Varma hälsningar,
            Teamet bakom Glassglädje
            ================================
            """,
            toEmail,
            orderNumber,
            customerName,
            orderNumber,
            totalInclVat);

        return Task.CompletedTask;
    }
}
