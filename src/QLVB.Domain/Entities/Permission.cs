namespace QLVB.Domain.Entities;

/// <summary>
/// Quyền trong hệ thống
/// </summary>
public class Permission
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Mã quyền (Documents.View, Users.Manage, ...) - unique
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
    /// Nhóm quyền (Documents, Users, Departments, ...)
    /// </summary>
    public string Category { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
