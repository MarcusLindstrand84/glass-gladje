using Glassgladje.Application.DTOs;

namespace Glassgladje.Application.Interfaces;

public interface IElevenAgentService
{
    Task<AgentChatResponse> ChatAsync(AgentChatRequest request, CancellationToken ct = default);
}
