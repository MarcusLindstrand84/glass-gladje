namespace Glassgladje.UnitTests;

public class AccountingVatTests
{
    [Theory]
    [InlineData(112, 0.12, 12.00)]
    [InlineData(125, 0.25, 25.00)]
    [InlineData(89, 0.12, 9.54)]
    public void Vat_amount_from_incl_price(decimal amountIncl, decimal rate, decimal expectedVat)
    {
        var vat = Math.Round(amountIncl * rate / (1 + rate), 2, MidpointRounding.AwayFromZero);
        Assert.Equal(expectedVat, vat);
    }

    [Fact]
    public void Vat_to_report_is_outgoing_minus_incoming()
    {
        var incomeVat = 12.00m;
        var expenseVat = 5.00m;
        Assert.Equal(7.00m, incomeVat - expenseVat);
    }
}
