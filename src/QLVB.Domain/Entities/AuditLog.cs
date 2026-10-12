using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Audit log - Ghi lại mọi hành động trong hệ thống
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Người thực hiện hành động
    /// </summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Văn bản liên quan (nullable)
    /// </summary>
    public Guid? DocumentId { get; set; }
    public Document? Document { get; set; }
    
    /// <summary>
    /// Loại hành động
    /// </summary>
    public AuditAction Action { get; set; }
    
    /// <summary>
    /// Chi tiết hành động (JSON hoặc text)
    /// </summary>
    public string? Details { get; set; }
    
    /// <summary>
    /// Địa chỉ IP
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;
    
    /// <summary>
    /// User Agent (browser/device info)
    /// </summary>
    public string? UserAgent { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
