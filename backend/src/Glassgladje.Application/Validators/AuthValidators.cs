using FluentValidation;
using Glassgladje.Application.DTOs;

namespace Glassgladje.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Ange en giltig e-postadress.");
        RuleFor(x => x.Password).MinimumLength(8).WithMessage("Lösenordet måste vara minst 8 tecken.");
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200).WithMessage("Ange ditt namn.");
        RuleFor(x => x.AcceptTerms).Equal(true).WithMessage("Du måste acceptera villkoren.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class TwoFactorLoginRequestValidator : AbstractValidator<TwoFactorLoginRequest>
{
    public TwoFactorLoginRequestValidator()
    {
        RuleFor(x => x.PendingUserId).NotEmpty();
        RuleFor(x => x.TwoFactorToken).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().MinimumLength(6).MaximumLength(12);
    }
}

public class TwoFactorCodeRequestValidator : AbstractValidator<TwoFactorCodeRequest>
{
    public TwoFactorCodeRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MinimumLength(6).MaximumLength(12);
    }
}

public class TwoFactorDisableRequestValidator : AbstractValidator<TwoFactorDisableRequest>
{
    public TwoFactorDisableRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MinimumLength(6).MaximumLength(12);
    }
}
