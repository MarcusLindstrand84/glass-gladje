using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Glassgladje.Application;
using Glassgladje.Infrastructure;
using Glassgladje.Infrastructure.Seed;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
            .WriteTo.Console()
            .Enrich.FromLogContext());

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddControllers()
        .AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

    builder.Services.AddOpenApi();

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.AddFixedWindowLimiter("agent", opt =>
        {
            opt.Window = TimeSpan.FromMinutes(1);
            opt.PermitLimit = 20;
            opt.QueueLimit = 2;
            opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        });
        options.AddFixedWindowLimiter("auth", opt =>
        {
            opt.Window = TimeSpan.FromMinutes(1);
            opt.PermitLimit = 30;
            opt.QueueLimit = 0;
        });
    });

    var frontendOrigin = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
            policy.WithOrigins(frontendOrigin, "http://localhost:5173", "http://127.0.0.1:5173")
                .AllowAnyHeader()
                .AllowAnyMethod());
    });

    var app = builder.Build();

    app.UseSerilogRequestLogging();

    // Security headers (OWASP basics)
    app.Use(async (ctx, next) =>
    {
        ctx.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
        ctx.Response.Headers.TryAdd("X-Frame-Options", "DENY");
        ctx.Response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
        ctx.Response.Headers.TryAdd("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
        ctx.Response.Headers.TryAdd("X-Permitted-Cross-Domain-Policies", "none");
        if (!app.Environment.IsDevelopment())
        {
            ctx.Response.Headers.TryAdd("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }
        await next();
    });

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseCors("Frontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    await DbSeeder.SeedAsync(app.Services);

    Log.Information("Glassglädje API startar…");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "API avslutades oväntat");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program;
