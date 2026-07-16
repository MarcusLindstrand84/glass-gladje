namespace Glassgladje.Application.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string? Phone,
    bool MarketingConsent,
    bool AcceptTerms);

public record LoginRequest(string Email, string Password);

/// <summary>
/// Login result: either full tokens, or a pending 2FA challenge.
/// </summary>
public record LoginResultDto(
    bool RequiresTwoFactor,
    string? PendingUserId,
    string? TwoFactorToken,
    AuthResponse? Auth);

public record TwoFactorLoginRequest(
    string PendingUserId,
    string TwoFactorToken,
    string Code);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    UserDto User);

public record RefreshRequest(string RefreshToken);

public record UserDto(
    string Id,
    string Email,
    string FullName,
    string? Phone,
    IReadOnlyList<string> Roles,
    bool TwoFactorEnabled);

public record TwoFactorStatusDto(
    bool Enabled,
    bool IsAdmin,
    bool Recommended);

public record TwoFactorSetupDto(
    string SharedKey,
    string AuthenticatorUri,
    string ManualEntryKey);

public record TwoFactorCodeRequest(string Code);

public record TwoFactorEnableResponse(
    bool Enabled,
    IReadOnlyList<string> RecoveryCodes);

public record TwoFactorDisableRequest(string Code);
