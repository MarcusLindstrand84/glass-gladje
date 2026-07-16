namespace Glassgladje.UnitTests;

/// <summary>
/// Lightweight checks for keyword matching used by ElevenAgent scoring (mirrors service logic).
/// </summary>
public class AgentIntentHintsTests
{
    [Theory]
    [InlineData("vegansk fest", true)]
    [InlineData("utan nötter till fika", true)]
    [InlineData("hej", false)]
    public void Dietary_or_occasion_keywords_detectable(string message, bool expectSignal)
    {
        var t = message.ToLowerInvariant();
        var signal =
            t.Contains("vegan") ||
            t.Contains("nöt") ||
            t.Contains("fest") ||
            t.Contains("fika") ||
            t.Contains("laktos") ||
            t.Contains("gluten");
        Assert.Equal(expectSignal, signal);
    }
}
