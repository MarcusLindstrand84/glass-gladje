using System.Security.Claims;
using Glassgladje.Application.Common;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Glassgladje.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.Admin)]
public class AccountingController(IAccountingService accounting) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<AccountingDashboardDto>> Dashboard(CancellationToken ct) =>
        Ok(await accounting.GetDashboardAsync(ct));

    [HttpGet("transactions")]
    public async Task<ActionResult<IReadOnlyList<AccountingTransactionDto>>> Transactions(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] AccountingType? type,
        [FromQuery] AccountingCategory? category,
        CancellationToken ct)
    {
        var result = await accounting.GetTransactionsAsync(
            new AccountingFilterQuery(from, to, type, category), ct);
        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AccountingSummaryDto>> Summary(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var f = from ?? new DateOnly(today.Year, today.Month, 1);
        var t = to ?? today;
        return Ok(await accounting.GetSummaryAsync(f, t, ct));
    }

    [HttpPost("transactions")]
    public async Task<ActionResult<AccountingTransactionDto>> Create(
        [FromBody] CreateAccountingEntryRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        try
        {
            var created = await accounting.CreateManualEntryAsync(request, userId, ct);
            return CreatedAtAction(nameof(Transactions), new { }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] AccountingType? type,
        [FromQuery] AccountingCategory? category,
        CancellationToken ct)
    {
        var bytes = await accounting.ExportCsvAsync(
            new AccountingFilterQuery(from, to, type, category), ct);
        var fileName = $"glassgladje-bokforing-{DateTime.UtcNow:yyyyMMdd}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
}
