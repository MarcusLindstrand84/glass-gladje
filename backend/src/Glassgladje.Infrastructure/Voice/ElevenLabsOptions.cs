namespace Glassgladje.Infrastructure.Voice;

public class ElevenLabsOptions
{
    public const string SectionName = "ElevenLabs";

    public string ApiKey { get; set; } = string.Empty;
    public string VoiceId { get; set; } = string.Empty;
    public string ModelId { get; set; } = "eleven_multilingual_v2";
}
