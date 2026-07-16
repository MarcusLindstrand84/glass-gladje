using Glassgladje.Application.DTOs;

namespace Glassgladje.Application.Interfaces;

public interface IAccountingService
{
    Task<IReadOnlyList<AccountingTransactionDto>> GetTransactionsAsync(
        AccountingFilterQuery filter,
        CancellationToken ct = default);

    Task<AccountingTransactionDto> CreateManualEntryAsync(
        CreateAccountingEntryRequest request,
        string userId,
        CancellationToken ct = default);

    Task<AccountingSummaryDto> GetSummaryAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default);

    Task<AccountingDashboardDto> GetDashboardAsync(CancellationToken ct = default);

    Task<byte[]> ExportCsvAsync(AccountingFilterQuery filter, CancellationToken ct = default);
}
