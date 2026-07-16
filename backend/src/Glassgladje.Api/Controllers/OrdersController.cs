using System.Security.Claims;
using Glassgladje.Application.Common;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Glassgladje.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<CreateOrderResponse>> Create(
        [FromBody] CreateOrderRequest request,
        CancellationToken ct)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await orderService.CreateOrderAsync(request, userId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Development only: marks order paid when Stripe is not configured.
    /// Disabled outside Development.
    /// </summary>
    [HttpPost("dev-confirm-payment")]
    [AllowAnonymous]
    public async Task<ActionResult<OrderDto>> DevConfirmPayment(
        [FromBody] ConfirmDevPaymentRequest request,
        [FromServices] IHostEnvironment env,
        CancellationToken ct)
    {
        if (!env.IsDevelopment())
        {
            return NotFound();
        }

        try
        {
            await orderService.HandleDevMockPaymentAsync(request.OrderId, ct);
            var order = await orderService.GetByIdAsync(request.OrderId, ct);
            return order is null ? NotFound() : Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> Mine(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return Ok(await orderService.GetForUserAsync(userId, ct));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<OrderDto>> GetById(Guid id, CancellationToken ct)
    {
        var order = await orderService.GetByIdAsync(id, ct);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpGet("by-number/{orderNumber}")]
    [AllowAnonymous]
    public async Task<ActionResult<OrderDto>> GetByNumber(string orderNumber, CancellationToken ct)
    {
        var order = await orderService.GetByOrderNumberAsync(orderNumber, ct);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> All([FromQuery] int take = 50, CancellationToken ct = default)
    {
        return Ok(await orderService.GetAllAsync(take, ct));
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<OrderDto>> UpdateStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken ct)
    {
        var order = await orderService.UpdateStatusAsync(id, request.Status, ct);
        return order is null ? NotFound() : Ok(order);
    }
}
