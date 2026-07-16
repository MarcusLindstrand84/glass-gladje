using Glassgladje.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Glassgladje.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var dbOk = false;
        try
        {
            dbOk = await db.Database.CanConnectAsync(ct);
        }
        catch
        {
            dbOk = false;
        }

        var payload = new
        {
            status = dbOk ? "healthy" : "degraded",
            database = dbOk ? "up" : "down",
            brand = "Glassglädje",
            tagline = "Glädje du kan smaka",
            utc = DateTimeOffset.UtcNow
        };

        return dbOk ? Ok(payload) : StatusCode(StatusCodes.Status503ServiceUnavailable, payload);
    }
}
