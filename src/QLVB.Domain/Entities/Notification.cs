using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Thông báo hệ thống
/// </summary>
public class Notification
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Người nhận thông báo (FK to User)
    /// </summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Tiêu đề thông báo
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Nội dung chi tiết
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Loại thông báo
    /// </summary>
    public NotificationType Type { get; set; }
    
    /// <summary>
    /// Link để điều hướng khi click vào thông báo
    /// </summary>
    public string? Link { get; set; }
    
    /// <summary>
    /// Đã đọc chưa
    /// </summary>
    public bool IsRead { get; set; } = false;
    
    /// <summary>
    /// Thời gian đọc
    /// </summary>
    public DateTime? ReadAt { get; set; }
    
    /// <summary>
    /// Thời gian tạo
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// ID văn bản liên quan (nếu có)
    /// </summary>
    public Guid? DocumentId { get; set; }
    public Document? Document { get; set; }
}
