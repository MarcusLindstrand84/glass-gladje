using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Entities;
using Glassgladje.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Glassgladje.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options), IApplicationDbContext
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductDietaryTag> ProductDietaryTags => Set<ProductDietaryTag>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<AccountingTransaction> AccountingTransactions => Set<AccountingTransaction>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Product>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.NameSv).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(200).IsRequired();
            e.Property(x => x.ShortDescriptionSv).HasMaxLength(300).IsRequired();
        });

        builder.Entity<ProductVariant>(e =>
        {
            e.HasIndex(x => x.Sku).IsUnique();
            e.Property(x => x.PriceSekInclVat).HasPrecision(18, 2);
            e.Property(x => x.VatRate).HasPrecision(5, 4);
            e.HasOne(x => x.Product)
                .WithMany(p => p.Variants)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProductDietaryTag>(e =>
        {
            e.HasKey(x => new { x.ProductId, x.Tag });
            e.HasOne(x => x.Product)
                .WithMany(p => p.DietaryTags)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Order>(e =>
        {
            e.HasIndex(x => x.OrderNumber).IsUnique();
            e.HasIndex(x => x.StripePaymentIntentId).IsUnique();
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.SubtotalExclVat).HasPrecision(18, 2);
            e.Property(x => x.VatAmount).HasPrecision(18, 2);
            e.Property(x => x.TotalInclVat).HasPrecision(18, 2);
        });

        builder.Entity<OrderItem>(e =>
        {
            e.Property(x => x.UnitPriceInclVat).HasPrecision(18, 2);
            e.Property(x => x.LineTotalInclVat).HasPrecision(18, 2);
            e.Property(x => x.VatRate).HasPrecision(5, 4);
            e.HasOne(x => x.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ProductVariant)
                .WithMany()
                .HasForeignKey(x => x.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<InventoryTransaction>(e =>
        {
            e.HasIndex(x => x.CreatedAt);
            e.HasOne(x => x.ProductVariant)
                .WithMany()
                .HasForeignKey(x => x.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AccountingTransaction>(e =>
        {
            e.HasIndex(x => x.TransactionDate);
            // One income posting per order; multiple NULL allowed for manual entries (SQL Server)
            e.HasIndex(x => x.LinkedOrderId)
                .IsUnique()
                .HasFilter("[LinkedOrderId] IS NOT NULL");
            e.Property(x => x.AmountInclVat).HasPrecision(18, 2);
            e.Property(x => x.VatAmount).HasPrecision(18, 2);
            e.Property(x => x.VatRate).HasPrecision(5, 4);
        });

        builder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();
            e.HasIndex(x => x.CreatedAt);
        });

        builder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(x => x.Token).IsUnique();
            e.HasIndex(x => x.UserId);
        });
    }
}
