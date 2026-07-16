using Glassgladje.Domain.Common;
using Glassgladje.Domain.Enums;

namespace Glassgladje.Domain.Entities;

public class AccountingTransaction : BaseEntity
{
    public AccountingType Type { get; set; }
    public AccountingCategory Category { get; set; }
    public decimal AmountInclVat { get; set; }
    public decimal VatAmount { get; set; }
    public decimal VatRate { get; set; }
    public DateOnly TransactionDate { get; set; }
    public Guid? LinkedOrderId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? CreatedByUserId { get; set; }
}
