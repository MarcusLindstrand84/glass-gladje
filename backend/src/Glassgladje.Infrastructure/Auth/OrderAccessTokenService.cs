using System.Security.Cryptography;
using System.Text;
using Glassgladje.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace Glassgladje.Infrastructure.Auth;

public class OrderAccessTokenService(IOptions<JwtOptions> jwtOptions) : IOrderAccessTokenGenerator
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public string Create(Guid orderId)
    {
        var keyBytes = Encoding.UTF8.GetBytes(_jwt.Key);
        var payload = orderId.ToByteArray();
        var hash = HMACSHA256.HashData(keyBytes, payload);
        return ToBase64Url(hash);
    }

    public bool IsValid(Guid orderId, string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var expected = Create(orderId);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var actualBytes = Encoding.UTF8.GetBytes(token);
        if (expectedBytes.Length != actualBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }

    private static string ToBase64Url(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
