using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Vai trò trong hệ thống - có thể tạo động
/// </summary>
public class Role
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Mã vai trò (ADMIN, MANAGER, STAFF, ...) - unique
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Tên hiển thị
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Mô tả
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Vai trò hệ thống (không được xóa/sửa)
    /// </summary>
    public bool IsSystemRole { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
