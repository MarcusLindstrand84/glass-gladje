namespace Glassgladje.Application.Interfaces;

public interface ITextToSpeechService
{
    bool IsConfigured { get; }
    Task<(byte[] Audio, string ContentType)?> SynthesizeAsync(string text, CancellationToken ct = default);
}
