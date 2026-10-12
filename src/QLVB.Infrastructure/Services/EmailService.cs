using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;
using QLVB.Domain.Interfaces;

namespace QLVB.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendVerificationEmailAsync(string email, string fullName, string token)
    {
        var settings = _configuration.GetSection("EmailSettings");
        var smtpHost = settings["SmtpHost"];
        var smtpPort = int.Parse(settings["SmtpPort"] ?? "587");
        var smtpUsername = settings["SmtpUsername"];
        var smtpPassword = settings["SmtpPassword"];
        var senderName = settings["SenderName"];
        var senderEmail = settings["SenderEmail"];
        var appBaseUrl = settings["AppBaseUrl"];

        var verificationLink = $"{appBaseUrl}/verify-email?token={token}&email={email}";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(new MailboxAddress(fullName, email));
        message.Subject = "Xác thực tài khoản - Bệnh viện Đa khoa Tâm Trí Cao Lãnh";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <h2>Chào bạn {fullName},</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống Quản lý văn bản Bệnh viện Đa khoa Tâm Trí Cao Lãnh.</p>
                    <p>Vui lòng click vào nút bên dưới để xác thực địa chỉ email của bạn và kích hoạt tài khoản:</p>
                    <p style='text-align: center; margin: 30px 0;'>
                        <a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Xác thực Email</a>
                    </p>
                    <p>Nếu nút trên không hoạt động, bạn có thể copy link sau vào trình duyệt:</p>
                    <p><a href='{verificationLink}'>{verificationLink}</a></p>
                    <p>Link này sẽ hết hạn sau 24 giờ.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='font-size: 0.8em; color: #777;'>Đây là email tự động, vui lòng không phản hồi email này.</p>
                </div>"
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            // Connect to SMTP server
            await client.ConnectAsync(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);

            // Authenticate
            await client.AuthenticateAsync(smtpUsername, smtpPassword);

            // Send email
            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            // Log error
            Console.WriteLine($"Error sending email: {ex.Message}");
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }

    public async Task SendPasswordResetCodeAsync(string email, string fullName, string resetCode)
    {
        var settings = _configuration.GetSection("EmailSettings");
        var smtpHost = settings["SmtpHost"];
        var smtpPort = int.Parse(settings["SmtpPort"] ?? "587");
        var smtpUsername = settings["SmtpUsername"];
        var smtpPassword = settings["SmtpPassword"];
        var senderName = settings["SenderName"];
        var senderEmail = settings["SenderEmail"];

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(new MailboxAddress(fullName, email));
        message.Subject = "Đặt lại mật khẩu - Bệnh viện Đa khoa Tâm Trí Cao Lãnh";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                        <h1 style='color: white; margin: 0; font-size: 28px;'>Đặt lại mật khẩu</h1>
                    </div>
                    <div style='background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;'>
                        <h2 style='color: #333; margin-top: 0;'>Chào bạn {fullName},</h2>
                        <p style='font-size: 16px;'>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p style='font-size: 16px;'>Mã xác nhận của bạn là:</p>
                        
                        <div style='background: white; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px; border: 2px dashed #667eea;'>
                            <div style='font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: monospace;'>
                                {resetCode}
                            </div>
                        </div>

                        <div style='background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                            <p style='margin: 0; color: #856404; font-size: 14px;'>
                                <strong>⏰ Lưu ý:</strong> Mã này sẽ hết hạn sau <strong>15 phút</strong>.
                            </p>
                        </div>

                        <div style='background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                            <p style='margin: 0; color: #721c24; font-size: 14px;'>
                                <strong>🔒 Bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và đảm bảo tài khoản của bạn an toàn.
                            </p>
                        </div>

                        <p style='font-size: 14px; color: #666; margin-top: 30px;'>Trân trọng,<br><strong>Bệnh viện Đa khoa Tâm Trí Cao Lãnh</strong></p>
                    </div>
                    <div style='text-align: center; padding: 20px; color: #999; font-size: 12px;'>
                        <p>Đây là email tự động, vui lòng không phản hồi email này.</p>
                        <p>© 2026 Bệnh viện Đa khoa Tâm Trí Cao Lãnh. All rights reserved.</p>
                    </div>
                </div>"
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUsername, smtpPassword);
            await client.SendAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending password reset email: {ex.Message}");
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }
}
