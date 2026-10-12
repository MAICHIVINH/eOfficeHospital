using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using QLVB.Api.Hubs;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Security;
using System.Security.Claims;
using QLVB.Domain.Constants;
using QLVB.Infrastructure.Services;
using QLVB.Application.Services;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailValidator _emailValidator;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    // private readonly IHubContext<NotificationHub> _hubContext;

    public UsersController(
        IUnitOfWork unitOfWork, 
        IEmailValidator emailValidator, 
        IEmailService emailService, 
        INotificationService notificationService/*,
        IHubContext<NotificationHub> hubContext*/)
    {
        _unitOfWork = unitOfWork;
        _emailValidator = emailValidator;
        _emailService = emailService;
        _notificationService = notificationService;
        // _hubContext = hubContext;
    }

    /// <summary>
    /// Get all users (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = CustomPermissions.Users.View)]
    public async Task<ActionResult<object>> GetUsers(
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] bool? isActive = null)
    {
        var (users, totalCount) = await _unitOfWork.Users.GetPagedAsync(
            pageNumber, 
            pageSize, 
            predicate: u => 
                (string.IsNullOrEmpty(search) || u.Username.Contains(search) || u.FullName.Contains(search) || u.Email.Contains(search)) &&
                (string.IsNullOrEmpty(role) || u.Role.Code == role) &&
                (!departmentId.HasValue || u.DepartmentId == departmentId) &&
                (!isActive.HasValue || u.IsActive == isActive),
            orderBy: q => q.OrderByDescending(u => u.CreatedAt));

        var items = users.Select(u => new
        {
            u.Id,
            u.Username,
            u.FullName,
            u.Email,
            Role = u.Role?.Code ?? "STAFF",
            u.DepartmentId,
            Department = u.Department != null ? new { u.Department.Id, u.Department.Name, u.Department.Code } : null,
            u.IsActive,
            u.CreatedAt
        });

        return Ok(new
        {
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    /// <summary>
    /// Get user by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Policy = CustomPermissions.Users.View)]
    public async Task<ActionResult<object>> GetUser(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);

        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });

        return Ok(new
        {
            user.Id,
            user.Username,
            user.FullName,
            user.Email,
            Role = user.Role?.Code ?? "STAFF",
            user.DepartmentId,
            Department = user.Department != null ? new { user.Department.Id, user.Department.Name, user.Department.Code } : null,
            user.IsActive,
            user.CreatedAt,
            user.UpdatedAt
        });
    }

    /// <summary>
    /// Create new user (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = CustomPermissions.Users.Create)]
    public async Task<ActionResult<object>> CreateUser([FromBody] CreateUserDto dto)
    {
        try
        {
            // Check if username exists (including soft-deleted)
            var usernameExists = await _unitOfWork.Users.UsernameExistsIgnoreFilterAsync(dto.Username);
            if (usernameExists)
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại (có thể đang ở trong thùng rác)" });

            // Check if email exists (including soft-deleted)
            var emailExists = await _unitOfWork.Users.EmailExistsIgnoreFilterAsync(dto.Email);
            if (emailExists)
                return BadRequest(new { message = "Email đã tồn tại (có thể đang ở trong thùng rác)" });

            // Validate email format
            if (!await _emailValidator.IsValidEmailAsync(dto.Email))
                return BadRequest(new { message = "Định dạng email không hợp lệ" });

            // Validate department if provided
            if (dto.DepartmentId.HasValue)
            {
                var department = await _unitOfWork.Departments.GetByIdAsync(dto.DepartmentId.Value);
                if (department == null)
                    return BadRequest(new { message = "Không tìm thấy phòng ban" });
            }

            // Find role by code
            var roles = await _unitOfWork.Roles.GetAllAsync();
            var role = roles.FirstOrDefault(r => r.Code == dto.Role);
            if (role == null)
                return BadRequest(new { message = $"Không tìm thấy vai trò '{dto.Role}'" });

            var user = new User
            {
                Username = dto.Username,
                PasswordHash = PasswordHasher.HashPassword(dto.Password),
                FullName = dto.FullName,
                Email = dto.Email,
                RoleId = role.Id,
                DepartmentId = dto.DepartmentId,
                IsActive = true, // Tự động active cho mọi user mới
                IsEmailConfirmed = true, // Bỏ qua xác thực email
                EmailConfirmationToken = null,
                EmailConfirmationTokenExpires = null,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Log user creation
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.CreateUser,
                Details = $"Đã tạo người dùng: {user.Username} ({user.FullName})",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Email,
                Role = role.Code,
                user.DepartmentId,
                user.IsActive,
                user.CreatedAt
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi khi tạo người dùng: {ex.Message}");
            return StatusCode(500, new { message = "Lỗi hệ thống khi tạo người dùng", details = ex.Message });
        }
    }

    /// <summary>
    /// Update user (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = CustomPermissions.Users.Edit)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            // Check if new username conflicts (including soft-deleted)
            if (dto.Username != user.Username)
            {
                var usernameExists = await _unitOfWork.Users.UsernameExistsIgnoreFilterAsync(dto.Username);
                if (usernameExists)
                    return BadRequest(new { message = "Tên đăng nhập đã tồn tại (có thể đang ở trong thùng rác)" });
            }

            // Check if new email conflicts (including soft-deleted)
            if (dto.Email != user.Email)
            {
                var emailExists = await _unitOfWork.Users.EmailExistsIgnoreFilterAsync(dto.Email);
                if (emailExists)
                    return BadRequest(new { message = "Email đã tồn tại (có thể đang ở trong thùng rác)" });
            }

            // Validate email format
            if (!await _emailValidator.IsValidEmailAsync(dto.Email))
                return BadRequest(new { message = "Định dạng email không hợp lệ" });

            // Validate department if provided
            if (dto.DepartmentId.HasValue)
            {
                var department = await _unitOfWork.Departments.GetByIdAsync(dto.DepartmentId.Value);
                if (department == null)
                    return BadRequest(new { message = "Không tìm thấy phòng ban" });
            }

            // Find role by code
            var roles = await _unitOfWork.Roles.GetAllAsync();
            var role = roles.FirstOrDefault(r => r.Code == dto.Role);
            if (role == null)
                return BadRequest(new { message = $"Không tìm thấy vai trò '{dto.Role}'" });

            var oldUsername = user.Username;
            user.Username = dto.Username;
            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.RoleId = role.Id;
            user.DepartmentId = dto.DepartmentId;
            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

        // No need to call _unitOfWork.Users.Update(user) as entity is already tracked
        await _unitOfWork.SaveChangesAsync();

        // Notify user about permission/status change
        try
        {
            await _notificationService.CreateAndSendAsync(new QLVB.Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = user.Id,
                Title = "Cập nhật tài khoản",
                Message = "Quyền hạn hoặc trạng thái tài khoản của bạn đã được cập nhật. Vui lòng tải lại trang nếu cần thiết.",
                Type = NotificationType.PermissionChanged,
                Link = "/profile"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Gửi thông báo cập nhật người dùng thất bại: {ex.Message}");
            // We continue even if notification fails
        }

        // Log user update
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var currentUserId))
            {
                var auditLog = new AuditLog
                {
                    UserId = currentUserId,
                    Action = AuditAction.UpdateUser,
                    Details = $"Đã cập nhật người dùng: {oldUsername} → {user.Username} ({user.FullName})",
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                    UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                    Timestamp = DateTime.UtcNow
                };
                await _unitOfWork.AuditLogs.AddAsync(auditLog);
                await _unitOfWork.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ghi nhật ký cập nhật người dùng thất bại: {ex.Message}");
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.FullName,
            user.Email,
            Role = user.Role?.Code ?? "STAFF",
            user.DepartmentId,
            Department = user.Department != null ? new { user.Department.Id, user.Department.Name, user.Department.Code } : null,
            user.IsActive,
            user.CreatedAt,
            user.UpdatedAt
        });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi nghiêm trọng khi cập nhật người dùng {id}: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            return StatusCode(500, new { 
                message = "Lỗi hệ thống khi cập nhật người dùng",
                details = ex.Message 
            });
        }
    }

    /// <summary>
    /// Change user password (Admin only)
    /// </summary>
    [HttpPost("{id}/change-password")]
    [Authorize(Policy = CustomPermissions.Users.Edit)]
    public async Task<IActionResult> ChangeUserPassword(Guid id, [FromBody] ChangePasswordDto dto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);

        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });

        user.PasswordHash = PasswordHasher.HashPassword(dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        // Notify user about password change
        await _notificationService.CreateAndSendAsync(new QLVB.Application.DTOs.Notifications.CreateNotificationDto
        {
            UserId = user.Id,
            Title = "Mật khẩu đã thay đổi",
            Message = "Quản trị viên đã thay đổi mật khẩu của bạn.",
            Type = NotificationType.General,
            Link = "/profile"
        });

        // Log password change
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            Action = AuditAction.ChangePassword,
            Details = $"Đã đổi mật khẩu cho người dùng: {user.Username}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Đổi mật khẩu thành công" });
    }

    /// <summary>
    /// Delete user (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = CustomPermissions.Users.Delete)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);

        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });

        // Prevent deleting system administrator
        if (user.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Không thể xóa tài khoản quản trị viên hệ thống" });

        // Prevent deleting self
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (user.Id == currentUserId)
            return BadRequest(new { message = "Bạn không thể tự xóa tài khoản của chính mình" });

        var username = user.Username;
        _unitOfWork.Users.SoftDelete(user);
        await _unitOfWork.SaveChangesAsync();

        // Log user deletion
        currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            Action = AuditAction.DeleteUser,
            Details = $"Đã xóa người dùng: {username}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        /*
        // Broadcast notification to all admins
        await _hubContext.Clients.All.SendAsync("UserDeleted", new
        {
            userId = id,
            username = username,
            message = $"Người dùng {username} đã bị xóa"
        });
        */

        return NoContent();
    }

    /// <summary>
    /// Verify user email
    /// </summary>
    [HttpGet("verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token, [FromQuery] string email)
    {
        // First check by email to see if they are already verified
        var userByEmail = await _unitOfWork.Users.GetByEmailAsync(email);
        if (userByEmail != null && userByEmail.IsEmailConfirmed)
            return Ok(new { message = "Email đã được xác thực. Bạn có thể đăng nhập." });

        var user = await _unitOfWork.Users.GetByEmailConfirmationTokenAsync(token);

        if (user == null || user.Email != email)
            return BadRequest(new { message = "Mã xác thực hoặc email không hợp lệ" });

        if (user.EmailConfirmationTokenExpires < DateTime.UtcNow)
            return BadRequest(new { message = "Mã xác thực đã hết hạn" });

        if (user.IsEmailConfirmed)
            return Ok(new { message = "Email đã được xác thực" });

        user.IsEmailConfirmed = true;
        user.IsActive = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpires = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        // Log verification
        var auditLog = new AuditLog
        {
            UserId = user.Id,
            Action = AuditAction.UpdateUser,
            Details = $"Người dùng {user.Username} đã xác thực email",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Xác thực email thành công. Bạn có thể đăng nhập." });
    }

    /// <summary>
    /// Get users by department (Admin only)
    /// </summary>
    [HttpGet("by-department/{departmentId}")]
    [Authorize(Policy = CustomPermissions.Users.View)]
    public async Task<ActionResult<IEnumerable<object>>> GetUsersByDepartment(Guid departmentId)
    {
        var users = await _unitOfWork.Users.GetByDepartmentIdAsync(departmentId);

        var result = users.Select(u => new
        {
            u.Id,
            u.Username,
            u.FullName,
            u.Email,
            Role = u.Role?.Code ?? "STAFF",
            u.IsActive
        });

        return Ok(result);
    }

    /// <summary>
    /// Change own password (Any authenticated user)
    /// </summary>
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangeMyPassword([FromBody] ChangeMyPasswordDto dto)
    {
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _unitOfWork.Users.GetByIdAsync(currentUserId);

        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });

        // Verify old password
        if (!PasswordHasher.VerifyPassword(dto.OldPassword, user.PasswordHash))
            return BadRequest(new { message = "Mật khẩu hiện tại không chính xác" });

        // Validate new password
        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự" });

        // Update password
        user.PasswordHash = PasswordHasher.HashPassword(dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        // Log password change
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            Action = AuditAction.ChangePassword,
            Details = $"Người dùng đã tự đổi mật khẩu: {user.Username}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Đổi mật khẩu thành công" });
    }

    /// <summary>
    /// Update own profile (Any authenticated user)
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
    {
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _unitOfWork.Users.GetByIdAsync(currentUserId);

        if (user == null)
            return NotFound(new { message = "Không tìm thấy người dùng" });

        var oldFullName = user.FullName;
        var oldEmail = user.Email;

        // Validate email
        if (dto.Email != oldEmail && !await _emailValidator.IsValidEmailAsync(dto.Email))
            return BadRequest(new { message = "Email không hợp lệ hoặc tên miền không tồn tại" });

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        // Log profile update
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            Action = AuditAction.UpdateUser,
            Details = $"Người dùng đã tự cập nhật hồ sơ: {user.Username}. Tên: {oldFullName} → {user.FullName}, Email: {oldEmail} → {user.Email}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Cập nhật hồ sơ thành công" });
    }
}

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Role name: ADMIN, MANAGER, STAFF
    public Guid? DepartmentId { get; set; }
}

public class UpdateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Role name: ADMIN, MANAGER, STAFF
    public Guid? DepartmentId { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateMyProfileDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangeMyPasswordDto
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
