using FluentValidation;
using Glassgladje.Application.Accounting;
using Glassgladje.Application.Agent;
using Glassgladje.Application.Interfaces;
using Glassgladje.Application.Orders;
using Glassgladje.Application.Products;
using Glassgladje.Application.Validators;
using Microsoft.Extensions.DependencyInjection;

namespace Glassgladje.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IElevenAgentService, ElevenAgentService>();
        services.AddScoped<IAccountingService, AccountingService>();
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        return services;
    }
}
