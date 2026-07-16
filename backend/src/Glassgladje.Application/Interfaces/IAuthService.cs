using Glassgladje.Application.DTOs;

namespace Glassgladje.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<LoginResultDto> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginWithTwoFactorAsync(TwoFactorLoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct = default);
    Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task<UserDto?> GetUserAsync(string userId, CancellationToken ct = default);

    Task<TwoFactorStatusDto> GetTwoFactorStatusAsync(string userId, CancellationToken ct = default);
    Task<TwoFactorSetupDto> BeginTwoFactorSetupAsync(string userId, CancellationToken ct = default);
    Task<TwoFactorEnableResponse> EnableTwoFactorAsync(string userId, TwoFactorCodeRequest request, CancellationToken ct = default);
    Task DisableTwoFactorAsync(string userId, TwoFactorDisableRequest request, CancellationToken ct = default);
}
