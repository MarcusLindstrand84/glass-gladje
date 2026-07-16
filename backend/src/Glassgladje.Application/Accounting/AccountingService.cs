using System.Globalization;
using System.Text;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Entities;
using Glassgladje.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Glassgladje.Application.Accounting;

public class AccountingService(IApplicationDbContext db) : IAccountingService
{
    private static readonly CultureInfo Sv = CultureInfo.GetCultureInfo("sv-SE");

    public async Task<IReadOnlyList<AccountingTransactionDto>> GetTransactionsAsync(
        AccountingFilterQuery filter,
        CancellationToken ct = default)
    {
        var q = db.AccountingTransactions.AsNoTracking().AsQueryable();

        if (filter.From is { } from)
            q = q.Where(t => t.TransactionDate >= from);
        if (filter.To is { } to)
            q = q.Where(t => t.TransactionDate <= to);
        if (filter.Type is { } type)
            q = q.Where(t => t.Type == type);
        if (filter.Category is { } cat)
            q = q.Where(t => t.Category == cat);

        var list = await q
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Take(500)
            .ToListAsync(ct);

        return list.Select(Map).ToList();
    }

    public async Task<AccountingTransactionDto> CreateManualEntryAsync(
        CreateAccountingEntryRequest request,
        string userId,
        CancellationToken ct = default)
    {
        if (request.AmountInclVat <= 0)
            throw new InvalidOperationException("Beloppet måste vara större än noll.");

        if (string.IsNullOrWhiteSpace(request.Description))
            throw new InvalidOperationException("Beskrivning krävs.");

        var vatRate = request.VatRate ?? (request.Type == AccountingType.Income ? 0.12m : 0.25m);
        if (vatRate is < 0 or > 1)
            throw new InvalidOperationException("Momssats måste vara mellan 0 och 1 (t.ex. 0.12).");

        var vatAmount = Math.Round(
            request.AmountInclVat * vatRate / (1 + vatRate),
            2,
            MidpointRounding.AwayFromZero);

        var entity = new AccountingTransaction
        {
            Type = request.Type,
            Category = request.Category,
            AmountInclVat = request.AmountInclVat,
            VatAmount = vatAmount,
            VatRate = vatRate,
            TransactionDate = request.TransactionDate,
            Description = request.Description.Trim(),
            CreatedByUserId = userId,
            LinkedOrderId = null
        };

        db.AccountingTransactions.Add(entity);
        db.AuditLogs.Add(new AuditLog
        {
            ActorUserId = userId,
            Action = "AccountingManualEntry",
            EntityType = nameof(AccountingTransaction),
            EntityId = entity.Id.ToString(),
            PayloadJson = $"{{\"type\":\"{entity.Type}\",\"amount\":{entity.AmountInclVat}}}"
        });

        await db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<AccountingSummaryDto> GetSummaryAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        if (to < from)
            (from, to) = (to, from);

        var items = await db.AccountingTransactions.AsNoTracking()
            .Where(t => t.TransactionDate >= from && t.TransactionDate <= to)
            .ToListAsync(ct);

        var income = items.Where(t => t.Type == AccountingType.Income).ToList();
        var expense = items.Where(t => t.Type == AccountingType.Expense).ToList();

        var totalIncome = income.Sum(t => t.AmountInclVat);
        var totalExpense = expense.Sum(t => t.AmountInclVat);
        var incomeVat = income.Sum(t => t.VatAmount);
        var expenseVat = expense.Sum(t => t.VatAmount);

        // Simplified: utgående moms − ingående moms
        var vatToReport = incomeVat - expenseVat;

        return new AccountingSummaryDto(
            from,
            to,
            totalIncome,
            totalExpense,
            totalIncome - totalExpense,
            incomeVat,
            expenseVat,
            vatToReport,
            items.Count,
            Breakdown(income),
            Breakdown(expense));
    }

    public async Task<AccountingDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var monthTx = await db.AccountingTransactions.AsNoTracking()
            .Where(t => t.TransactionDate >= monthStart && t.TransactionDate <= today)
            .ToListAsync(ct);

        var todayIncome = monthTx
            .Where(t => t.Type == AccountingType.Income && t.TransactionDate == today)
            .Sum(t => t.AmountInclVat);

        var monthIncome = monthTx.Where(t => t.Type == AccountingType.Income).Sum(t => t.AmountInclVat);
        var monthExpense = monthTx.Where(t => t.Type == AccountingType.Expense).Sum(t => t.AmountInclVat);
        var monthIncomeVat = monthTx.Where(t => t.Type == AccountingType.Income).Sum(t => t.VatAmount);
        var monthExpenseVat = monthTx.Where(t => t.Type == AccountingType.Expense).Sum(t => t.VatAmount);

        var openOrders = await db.Orders.CountAsync(
            o => o.Status == OrderStatus.Paid || o.Status == OrderStatus.Processing || o.Status == OrderStatus.PendingPayment,
            ct);

        var lowStock = await db.ProductVariants.CountAsync(v => v.IsActive && v.StockQty <= 5, ct);
        var products = await db.Products.CountAsync(p => p.IsActive, ct);

        return new AccountingDashboardDto(
            todayIncome,
            monthIncome,
            monthExpense,
            monthIncome - monthExpense,
            monthIncomeVat - monthExpenseVat,
            openOrders,
            lowStock,
            products);
    }

    public async Task<byte[]> ExportCsvAsync(AccountingFilterQuery filter, CancellationToken ct = default)
    {
        var rows = await GetTransactionsAsync(filter, ct);
        var sb = new StringBuilder();
        sb.AppendLine("Datum;Typ;Kategori;BeloppInklMoms;Moms;Momssats;OrderId;Beskrivning");

        foreach (var r in rows)
        {
            sb.Append(r.TransactionDate.ToString("yyyy-MM-dd", Sv)).Append(';')
              .Append(CategoryLabel(r.Type)).Append(';')
              .Append(CategoryLabel(r.Category)).Append(';')
              .Append(r.AmountInclVat.ToString("0.00", Sv)).Append(';')
              .Append(r.VatAmount.ToString("0.00", Sv)).Append(';')
              .Append(r.VatRate.ToString("0.####", Sv)).Append(';')
              .Append(r.LinkedOrderId?.ToString() ?? "").Append(';')
              .Append('"').Append(r.Description.Replace("\"", "\"\"")).Append('"')
              .AppendLine();
        }

        // UTF-8 with BOM for Excel
        var preamble = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + body.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(body, 0, result, preamble.Length, body.Length);
        return result;
    }

    private static List<CategoryBreakdownDto> Breakdown(List<AccountingTransaction> items) =>
        items
            .GroupBy(t => t.Category)
            .Select(g => new CategoryBreakdownDto(
                g.Key.ToString(),
                g.Sum(x => x.AmountInclVat),
                g.Sum(x => x.VatAmount),
                g.Count()))
            .OrderByDescending(x => x.AmountInclVat)
            .ToList();

    private static AccountingTransactionDto Map(AccountingTransaction t) =>
        new(
            t.Id,
            t.Type.ToString(),
            t.Category.ToString(),
            t.AmountInclVat,
            t.VatAmount,
            t.VatRate,
            t.TransactionDate,
            t.LinkedOrderId,
            t.Description,
            t.CreatedAt);

    private static string CategoryLabel(string value) => value switch
    {
        "Income" => "Intäkt",
        "Expense" => "Kostnad",
        "ForsaljningGlass" => "Försäljning glass",
        "Ravaror" => "Råvaror",
        "Forpackning" => "Förpackning",
        "Frakt" => "Frakt",
        "Marknadsforing" => "Marknadsföring",
        "Utrustning" => "Utrustning",
        "Ovrigt" => "Övrigt",
        _ => value
    };
}
