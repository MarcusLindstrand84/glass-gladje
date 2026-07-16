using Glassgladje.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace Glassgladje.Api.Controllers;

[ApiController]
[Route("api/webhooks/stripe")]
public class StripeWebhookController(
    IPaymentService paymentService,
    IOrderService orderService,
    ILogger<StripeWebhookController> logger) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        if (!paymentService.IsConfigured)
        {
            return BadRequest(new { message = "Stripe är inte konfigurerat." });
        }

        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(ct);
        var signature = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            var paymentIntentId = await paymentService.ValidateWebhookAndGetPaymentIntentIdAsync(
                json, signature, ct);

            if (!string.IsNullOrEmpty(paymentIntentId))
            {
                await orderService.HandlePaymentSucceededAsync(paymentIntentId, ct);
                logger.LogInformation("Handled payment_intent.succeeded for {Id}", paymentIntentId);
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            logger.LogWarning(ex, "Invalid Stripe webhook");
            return BadRequest();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Webhook processing failed");
            return StatusCode(500);
        }
    }
}
