namespace Glassgladje.Application.DTOs;

public record AgentChatMessage(string Role, string Content);

public record AgentChatRequest(
    string Message,
    IReadOnlyList<AgentChatMessage>? History,
    bool IncludeSpeech = false);

public record AgentProductRecommendation(
    Guid ProductId,
    string Slug,
    string NameSv,
    string ShortDescriptionSv,
    string ReasonSv,
    decimal FromPriceSekInclVat,
    IReadOnlyList<string> DietaryTags,
    Guid? SuggestedVariantId,
    string? SuggestedVariantLabel);

public record AgentChatResponse(
    string ReplyText,
    IReadOnlyList<AgentProductRecommendation> Recommendations,
    bool SpeechAvailable,
    string? SpeechAudioBase64,
    string? SpeechContentType,
    string PersonaName);
