using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Phòng ban
/// </summary>
public class Department
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tên phòng ban
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Mã phòng ban
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Mô tả
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Trạng thái hoạt động
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    
    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<DocumentAssignment> DocumentAssignments { get; set; } = new List<DocumentAssignment>();
}
