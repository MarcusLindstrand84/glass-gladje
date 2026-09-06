namespace Glassgladje.Application.Interfaces;

public interface IOrderAccessTokenGenerator
{
    string Create(Guid orderId);
    bool IsValid(Guid orderId, string? token);
}
