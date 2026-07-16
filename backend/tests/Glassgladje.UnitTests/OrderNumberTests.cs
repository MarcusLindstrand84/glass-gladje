using System.Text.RegularExpressions;

namespace Glassgladje.UnitTests;

public class OrderNumberTests
{
    [Theory]
    [InlineData("GG-20260715-1234", true)]
    [InlineData("GG-20260101-9999", true)]
    [InlineData("invalid", false)]
    [InlineData("", false)]
    public void Order_number_pattern(string value, bool expected)
    {
        var ok = Regex.IsMatch(value, @"^GG-\d{8}-\d{4}$");
        Assert.Equal(expected, ok);
    }
}
