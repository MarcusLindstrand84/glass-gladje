using Glassgladje.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Glassgladje.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductDietaryTag> ProductDietaryTags { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<InventoryTransaction> InventoryTransactions { get; }
    DbSet<AccountingTransaction> AccountingTransactions { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
