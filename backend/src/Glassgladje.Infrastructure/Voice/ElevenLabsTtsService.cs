using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Glassgladje.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Glassgladje.Infrastructure.Voice;

public class ElevenLabsTtsService(
    IHttpClientFactory httpClientFactory,
    IOptions<ElevenLabsOptions> options,
    ILogger<ElevenLabsTtsService> logger) : ITextToSpeechService
{
    private readonly ElevenLabsOptions _options = options.Value;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.ApiKey) &&
        !string.IsNullOrWhiteSpace(_options.VoiceId);

    public async Task<(byte[] Audio, string ContentType)?> SynthesizeAsync(string text, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        // Cost guard: hard cap characters per request
        if (text.Length > 800)
        {
            text = text[..800];
        }

        try
        {
            var client = httpClientFactory.CreateClient("ElevenLabs");
            var voiceId = _options.VoiceId;
            var url = $"https://api.elevenlabs.io/v1/text-to-speech/{voiceId}";

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("xi-api-key", _options.ApiKey);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("audio/mpeg"));

            var payload = new
            {
                text,
                model_id = _options.ModelId,
                voice_settings = new
                {
                    stability = 0.45,
                    similarity_boost = 0.75,
                    style = 0.35,
                    use_speaker_boost = true
                }
            };

            request.Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            using var response = await client.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning("ElevenLabs TTS failed ({Status}): {Error}", response.StatusCode, err);
                return null;
            }

            var bytes = await response.Content.ReadAsByteArrayAsync(ct);
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "audio/mpeg";
            logger.LogInformation("ElevenLabs TTS synthesized {Chars} chars → {Bytes} bytes", text.Length, bytes.Length);
            return (bytes, contentType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ElevenLabs TTS request failed");
            return null;
        }
    }
}
