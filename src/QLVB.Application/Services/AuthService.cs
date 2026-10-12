using QLVB.Application.DTOs.Auth;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Security;
using Microsoft.AspNetCore.Http;

namespace QLVB.Application.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> SendPasswordResetCodeAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> VerifyResetCodeAsync(string email, string code, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(string email, string code, string newPassword, CancellationToken cancellationToken = default);
    Task<LoginResponseDto?> RefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default);
}

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IEmailService _emailService;

    public AuthService(IUnitOfWork unitOfWork, IJwtService jwtService, IHttpContextAccessor httpContextAccessor, IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _httpContextAccessor = httpContextAccessor;
        _emailService = emailService;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByUsernameAsync(request.Username, cancellationToken);

        if (user == null)
            return null;

        if (!user.IsEmailConfirmed)
            throw new UnauthorizedAccessException("Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Tài khoản đang bị khóa.");

        if (!PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return null;

        // Generate JWT token
        var token = _jwtService.GenerateToken(user);

        // Log login action
        var auditLog = new Domain.Entities.AuditLog
        {
            UserId = user.Id,
            Action = AuditAction.Login,
            Details = $"User {user.Username} logged in",
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Code ?? "STAFF",
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name,
                Department = user.Department != null ? new DepartmentDto
                {
                    Id = user.Department.Id,
                    Name = user.Department.Name,
                    Code = user.Department.Code
                } : null,
                CreatedAt = user.CreatedAt,
                Permissions = user.Role?.RolePermissions?.Select(rp => rp.Permission.Code).ToList() ?? new List<string>()
            }
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);

        if (user == null)
            return null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role?.Name ?? "STAFF",
            DepartmentId = user.DepartmentId,
            DepartmentName = user.Department?.Name,
            Department = user.Department != null ? new DepartmentDto
            {
                Id = user.Department.Id,
                Name = user.Department.Name,
                Code = user.Department.Code
            } : null,
            CreatedAt = user.CreatedAt,
            Permissions = user.Role?.RolePermissions?.Select(rp => rp.Permission.Code).ToList() ?? new List<string>()
        };
    }

    public async Task<bool> SendPasswordResetCodeAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken);

        if (user == null || !user.IsActive)
            return false;

        // Generate 6-digit random code
        var random = new Random();
        var resetCode = random.Next(100000, 999999).ToString();

        // Save code and expiry to database
        user.PasswordResetCode = resetCode;
        user.PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Send email
        await _emailService.SendPasswordResetCodeAsync(email, user.FullName, resetCode);

        return true;
    }

    public async Task<bool> VerifyResetCodeAsync(string email, string code, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken);

        if (user == null || !user.IsActive)
            return false;

        if (string.IsNullOrEmpty(user.PasswordResetCode) || user.PasswordResetCode != code)
            return false;

        if (user.PasswordResetCodeExpiry == null || user.PasswordResetCodeExpiry < DateTime.UtcNow)
            return false;

        return true;
    }

    public async Task<bool> ResetPasswordAsync(string email, string code, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken);

        if (user == null || !user.IsActive)
            return false;

        if (string.IsNullOrEmpty(user.PasswordResetCode) || user.PasswordResetCode != code)
            return false;

        if (user.PasswordResetCodeExpiry == null || user.PasswordResetCodeExpiry < DateTime.UtcNow)
            return false;

        // Update password
        user.PasswordHash = PasswordHasher.HashPassword(newPassword);
        
        // Clear reset code
        user.PasswordResetCode = null;
        user.PasswordResetCodeExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<LoginResponseDto?> RefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null || !user.IsActive)
            return null;

        // Generate new JWT token with updated claims (permissions)
        var token = _jwtService.GenerateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Code ?? "STAFF",
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name,
                CreatedAt = user.CreatedAt,
                Permissions = user.Role?.RolePermissions?.Select(rp => rp.Permission.Code).ToList() ?? new List<string>()
            }
        };
    }
}
