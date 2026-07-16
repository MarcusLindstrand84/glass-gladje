using Glassgladje.Domain.Enums;

namespace Glassgladje.Application.DTOs;

public record AccountingTransactionDto(
    Guid Id,
    string Type,
    string Category,
    decimal AmountInclVat,
    decimal VatAmount,
    decimal VatRate,
    DateOnly TransactionDate,
    Guid? LinkedOrderId,
    string Description,
    DateTimeOffset CreatedAt);

public record CreateAccountingEntryRequest(
    AccountingType Type,
    AccountingCategory Category,
    decimal AmountInclVat,
    decimal? VatRate,
    DateOnly TransactionDate,
    string Description);

public record AccountingFilterQuery(
    DateOnly? From,
    DateOnly? To,
    AccountingType? Type,
    AccountingCategory? Category);

public record AccountingSummaryDto(
    DateOnly From,
    DateOnly To,
    decimal TotalIncomeInclVat,
    decimal TotalExpenseInclVat,
    decimal NetResultInclVat,
    decimal IncomeVat,
    decimal ExpenseVat,
    decimal VatToReport,
    int TransactionCount,
    IReadOnlyList<CategoryBreakdownDto> IncomeByCategory,
    IReadOnlyList<CategoryBreakdownDto> ExpenseByCategory);

public record CategoryBreakdownDto(string Category, decimal AmountInclVat, decimal VatAmount, int Count);

public record AccountingDashboardDto(
    decimal RevenueToday,
    decimal RevenueThisMonth,
    decimal ExpensesThisMonth,
    decimal NetThisMonth,
    decimal VatToReportThisMonth,
    int OpenOrders,
    int LowStockVariants,
    int TotalProducts);
