namespace QLVB.Domain.Interfaces;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string email, string fullName, string token);
    Task SendPasswordResetCodeAsync(string email, string fullName, string resetCode);
}
