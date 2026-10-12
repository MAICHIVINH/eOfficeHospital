using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Người dùng hệ thống
/// </summary>
public class User
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tên đăng nhập (unique)
    /// </summary>
    public string Username { get; set; } = string.Empty;
    
    /// <summary>
    /// Mật khẩu đã hash (BCrypt)
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;
    
    /// <summary>
    /// Họ tên đầy đủ
    /// </summary>
    public string FullName { get; set; } = string.Empty;
    
    /// <summary>
    /// Email
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// ID vai trò (FK to Role table)
    /// </summary>
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
    
    /// <summary>
    /// Phòng ban (nullable cho Admin)
    /// </summary>
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    /// <summary>
    /// Trạng thái hoạt động
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Đã xác thực email chưa
    /// </summary>
    public bool IsEmailConfirmed { get; set; } = false;

    /// <summary>
    /// Mã xác thực email
    /// </summary>
    public string? EmailConfirmationToken { get; set; }

    /// <summary>
    /// Thời gian hết hạn của token xác thực
    /// </summary>
    public DateTime? EmailConfirmationTokenExpires { get; set; }

    /// <summary>
    /// Mã xác nhận reset mật khẩu (6 số)
    /// </summary>
    public string? PasswordResetCode { get; set; }

    /// <summary>
    /// Thời gian hết hạn của mã reset mật khẩu
    /// </summary>
    public DateTime? PasswordResetCodeExpiry { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    
    // Navigation properties
    public ICollection<Document> CreatedDocuments { get; set; } = new List<Document>();
    public ICollection<DocumentAssignment> AssignedDocuments { get; set; } = new List<DocumentAssignment>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
