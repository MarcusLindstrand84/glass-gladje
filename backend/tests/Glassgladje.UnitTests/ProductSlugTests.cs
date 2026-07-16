namespace Glassgladje.UnitTests;

public class ProductSlugTests
{
    [Theory]
    [InlineData("solmogen-jordgubb", true)]
    [InlineData("vanilj-fran-madagaskar", true)]
    [InlineData("Invalid Slug", false)]
    [InlineData("UPPER", false)]
    public void Slug_pattern_matches_expected(string slug, bool expectedValid)
    {
        var isValid = System.Text.RegularExpressions.Regex.IsMatch(
            slug,
            "^[a-z0-9]+(?:-[a-z0-9]+)*$");
        Assert.Equal(expectedValid, isValid);
    }
}
