using FluentValidation;
using Glassgladje.Application.DTOs;

namespace Glassgladje.Application.Validators;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.NameSv).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug får endast innehålla små bokstäver, siffror och bindestreck.");
        RuleFor(x => x.DescriptionSv).NotEmpty();
        RuleFor(x => x.ShortDescriptionSv).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Variants).NotEmpty().WithMessage("Minst en variant krävs.");
        RuleForEach(x => x.Variants).SetValidator(new CreateVariantRequestValidator());
    }
}

public class CreateVariantRequestValidator : AbstractValidator<CreateVariantRequest>
{
    public CreateVariantRequestValidator()
    {
        RuleFor(x => x.FlavorNameSv).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Size).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(50);
        RuleFor(x => x.PriceSekInclVat).GreaterThan(0);
        RuleFor(x => x.VatRate).InclusiveBetween(0, 1);
        RuleFor(x => x.StockQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.IngredientsSv).NotEmpty();
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.NameSv).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DescriptionSv).NotEmpty();
        RuleFor(x => x.ShortDescriptionSv).NotEmpty().MaximumLength(300);
    }
}
