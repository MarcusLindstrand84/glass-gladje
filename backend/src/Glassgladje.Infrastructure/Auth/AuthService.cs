using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Glassgladje.Application.Common;
using Glassgladje.Application.DTOs;
using Glassgladje.Application.Interfaces;
using Glassgladje.Domain.Entities;
using Glassgladje.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Glassgladje.Infrastructure.Auth;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IApplicationDbContext db,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    private const string TwoFactorPendingPurpose = "TwoFactorPendingLogin";
    private const string AuthenticatorIssuer = "Glassgladje";

    private readonly JwtOptions _jwt = jwtOptions.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            throw new InvalidOperationException("Ett konto med denna e-post finns redan.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email.Trim().ToLowerInvariant(),
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.Phone,
            MarketingConsent = request.MarketingConsent,
            TermsAcceptedAt = DateTimeOffset.UtcNow,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        await userManager.AddToRoleAsync(user, AppRoles.Customer);
        return await IssueTokensAsync(user, ct);
    }

    public async Task<LoginResultDto> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null || user.IsDeleted)
        {
            throw new UnauthorizedAccessException("Fel e-post eller lösenord.");
        }

        var check = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (check.IsLockedOut)
        {
            throw new UnauthorizedAccessException("Kontot är tillfälligt låst efter för många försök. Försök igen senare.");
        }

        if (!check.Succeeded)
        {
            throw new UnauthorizedAccessException("Fel e-post eller lösenord.");
        }

        if (await userManager.GetTwoFactorEnabledAsync(user))
        {
            var pendingToken = await userManager.GenerateUserTokenAsync(
                user,
                TokenOptions.DefaultProvider,
                TwoFactorPendingPurpose);

            return new LoginResultDto(
                RequiresTwoFactor: true,
                PendingUserId: user.Id,
                TwoFactorToken: pendingToken,
                Auth: null);
        }

        var auth = await IssueTokensAsync(user, ct);
        return new LoginResultDto(false, null, null, auth);
    }

    public async Task<AuthResponse> LoginWithTwoFactorAsync(TwoFactorLoginRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(request.PendingUserId.Trim());
        if (user is null || user.IsDeleted)
        {
            throw new UnauthorizedAccessException("Ogiltig eller utgången tvåfaktorssession. Logga in igen.");
        }

        if (!await userManager.GetTwoFactorEnabledAsync(user))
        {
            throw new UnauthorizedAccessException("Tvåfaktorsautentisering är inte aktiverad.");
        }

        var pendingValid = await userManager.VerifyUserTokenAsync(
            user,
            TokenOptions.DefaultProvider,
            TwoFactorPendingPurpose,
            request.TwoFactorToken);

        if (!pendingValid)
        {
            throw new UnauthorizedAccessException("Ogiltig eller utgången tvåfaktorssession. Logga in igen.");
        }

        var code = NormalizeCode(request.Code);
        var authenticatorOk = await userManager.VerifyTwoFactorTokenAsync(
            user,
            TokenOptions.DefaultAuthenticatorProvider,
            code);

        if (!authenticatorOk)
        {
            // Allow one-time recovery codes as fallback
            var recovery = await userManager.RedeemTwoFactorRecoveryCodeAsync(user, code);
            if (!recovery.Succeeded)
            {
                throw new UnauthorizedAccessException("Felaktig engångskod. Försök igen.");
            }
        }

        // Invalidate pending login token by changing security stamp is too aggressive (kills other sessions).
        // Tokens expire via provider; proceed to issue JWT.
        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct = default)
    {
        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, ct);

        if (stored is null || !stored.IsActive)
        {
            throw new UnauthorizedAccessException("Ogiltig eller utgången refresh-token.");
        }

        stored.RevokedAt = DateTimeOffset.UtcNow;
        var user = await userManager.FindByIdAsync(stored.UserId)
            ?? throw new UnauthorizedAccessException("Användaren finns inte.");

        if (user.IsDeleted)
        {
            throw new UnauthorizedAccessException("Användaren finns inte.");
        }

        await db.SaveChangesAsync(ct);
        return await IssueTokensAsync(user, ct);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == refreshToken, ct);
        if (stored is null) return;
        stored.RevokedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<UserDto?> GetUserAsync(string userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null || user.IsDeleted) return null;
        return await MapUserAsync(user);
    }

    public async Task<TwoFactorStatusDto> GetTwoFactorStatusAsync(string userId, CancellationToken ct = default)
    {
        var user = await RequireUserAsync(userId);
        var roles = await userManager.GetRolesAsync(user);
        var isAdmin = roles.Contains(AppRoles.Admin);
        var enabled = await userManager.GetTwoFactorEnabledAsync(user);
        return new TwoFactorStatusDto(enabled, isAdmin, Recommended: isAdmin);
    }

    public async Task<TwoFactorSetupDto> BeginTwoFactorSetupAsync(string userId, CancellationToken ct = default)
    {
        var user = await RequireUserAsync(userId);

        await userManager.ResetAuthenticatorKeyAsync(user);
        var key = await userManager.GetAuthenticatorKeyAsync(user)
            ?? throw new InvalidOperationException("Kunde inte skapa autentiseringsnyckel.");

        var email = user.Email ?? user.UserName ?? "user";
        var uri = GenerateQrCodeUri(email, key);
        var formatted = FormatKey(key);

        return new TwoFactorSetupDto(key, uri, formatted);
    }

    public async Task<TwoFactorEnableResponse> EnableTwoFactorAsync(
        string userId,
        TwoFactorCodeRequest request,
        CancellationToken ct = default)
    {
        var user = await RequireUserAsync(userId);
        var code = NormalizeCode(request.Code);

        var key = await userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            throw new InvalidOperationException("Starta 2FA-setup först (skanna QR-kod).");
        }

        var valid = await userManager.VerifyTwoFactorTokenAsync(
            user,
            TokenOptions.DefaultAuthenticatorProvider,
            code);

        if (!valid)
        {
            throw new InvalidOperationException("Felaktig engångskod. Kontrollera klockan på telefonen och försök igen.");
        }

        await userManager.SetTwoFactorEnabledAsync(user, true);
        var recovery = await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 8);
        return new TwoFactorEnableResponse(true, recovery?.ToList() ?? []);
    }

    public async Task DisableTwoFactorAsync(string userId, TwoFactorDisableRequest request, CancellationToken ct = default)
    {
        var user = await RequireUserAsync(userId);
        if (!await userManager.GetTwoFactorEnabledAsync(user))
        {
            return;
        }

        var code = NormalizeCode(request.Code);
        var authenticatorOk = await userManager.VerifyTwoFactorTokenAsync(
            user,
            TokenOptions.DefaultAuthenticatorProvider,
            code);

        if (!authenticatorOk)
        {
            var recovery = await userManager.RedeemTwoFactorRecoveryCodeAsync(user, code);
            if (!recovery.Succeeded)
            {
                throw new InvalidOperationException("Felaktig engångskod. 2FA avaktiverades inte.");
            }
        }

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);
    }

    private async Task<ApplicationUser> RequireUserAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null || user.IsDeleted)
        {
            throw new UnauthorizedAccessException("Användaren finns inte.");
        }

        return user;
    }

    private async Task<AuthResponse> IssueTokensAsync(ApplicationUser user, CancellationToken ct)
    {
        var roles = await userManager.GetRolesAsync(user);
        var expires = DateTimeOffset.UtcNow.AddMinutes(_jwt.AccessTokenMinutes);
        var accessToken = CreateAccessToken(user, roles, expires);
        var refresh = CreateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refresh,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwt.RefreshTokenDays)
        });
        await db.SaveChangesAsync(ct);

        return new AuthResponse(accessToken, refresh, expires, await MapUserAsync(user));
    }

    private string CreateAccessToken(ApplicationUser user, IList<string> roles, DateTimeOffset expires)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id),
            new("full_name", user.FullName)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expires.UtcDateTime,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private async Task<UserDto> MapUserAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var twoFactor = await userManager.GetTwoFactorEnabledAsync(user);
        return new UserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.PhoneNumber,
            roles.ToList(),
            twoFactor);
    }

    private static string NormalizeCode(string code) =>
        code.Replace(" ", string.Empty, StringComparison.Ordinal).Trim();

    private static string FormatKey(string unformattedKey)
    {
        var result = new StringBuilder();
        var current = 0;
        while (current + 4 < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(current, 4)).Append(' ');
            current += 4;
        }

        if (current < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(current));
        }

        return result.ToString().ToLowerInvariant();
    }

    private static string GenerateQrCodeUri(string email, string unformattedKey)
    {
        const string authenticatorUriFormat =
            "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&digits=6";

        return string.Format(
            CultureInfo.InvariantCulture,
            authenticatorUriFormat,
            UrlEncoder.Default.Encode(AuthenticatorIssuer),
            UrlEncoder.Default.Encode(email),
            unformattedKey);
    }
}
