using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Glassgladje.Api.Controllers;

[ApiController]
[Route("api/elevenagent")]
[EnableRateLimiting("agent")]
public class ElevenAgentController(IElevenAgentService agentService) : ControllerBase
{
    [HttpPost("chat")]
    [AllowAnonymous]
    public async Task<ActionResult<AgentChatResponse>> Chat(
        [FromBody] AgentChatRequest request,
        CancellationToken ct)
    {
        try
        {
            var result = await agentService.ChatAsync(request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("status")]
    [AllowAnonymous]
    [DisableRateLimiting]
    public ActionResult<object> Status([FromServices] ITextToSpeechService tts) =>
        Ok(new
        {
            persona = "Smakrådgivare",
            tagline = "Glädje du kan smaka",
            speechConfigured = tts.IsConfigured,
            voiceInput = "Web Speech API i webbläsaren (fallback)",
            ready = true
        });
}
