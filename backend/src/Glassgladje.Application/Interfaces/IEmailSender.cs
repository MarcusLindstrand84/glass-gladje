namespace Glassgladje.Application.Interfaces;

public interface IEmailSender
{
    Task SendOrderConfirmationAsync(
        string toEmail,
        string customerName,
        string orderNumber,
        decimal totalInclVat,
        CancellationToken ct = default);
}
