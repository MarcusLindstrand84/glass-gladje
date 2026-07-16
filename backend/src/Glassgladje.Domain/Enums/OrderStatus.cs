namespace Glassgladje.Domain.Enums;

public enum OrderStatus
{
    PendingPayment = 0,
    Paid = 1,
    Processing = 2,
    Shipped = 3,
    Completed = 4,
    Cancelled = 5,
    Refunded = 6
}
