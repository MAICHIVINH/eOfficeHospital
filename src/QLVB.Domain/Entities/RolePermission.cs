namespace QLVB.Domain.Entities;

/// <summary>
/// Liên kết giữa Role và Permission (many-to-many)
/// </summary>
public class RolePermission
{
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
    
    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
    
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
