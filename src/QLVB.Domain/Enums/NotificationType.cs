namespace QLVB.Domain.Enums;

/// <summary>
/// Loại thông báo
/// </summary>
public enum NotificationType
{
    /// <summary>
    /// Thông báo chung
    /// </summary>
    General = 0,
    
    /// <summary>
    /// Văn bản bị từ chối
    /// </summary>
    DocumentRejected = 1,
    
    /// <summary>
    /// Yêu cầu ký duyệt
    /// </summary>
    SignatureRequest = 2,
    
    /// <summary>
    /// Phân công mới
    /// </summary>
    NewAssignment = 3,
    
    /// <summary>
    /// Văn bản được phát hành
    /// </summary>
    DocumentPublished = 4,
    
    /// <summary>
    /// Nhắc hẹn sắp hết hạn
    /// </summary>
    DeadlineReminder = 5,
    
    /// <summary>
    /// Cập nhật quyền hạn
    /// </summary>
    PermissionChanged = 6,
    
    /// <summary>
    /// Bảo trì hệ thống
    /// </summary>
    SystemMaintenance = 7,
    
    /// <summary>
    /// Văn bản cần cấp số
    /// </summary>
    DocumentNeedsIssuing = 8,
    
    /// <summary>
    /// Văn bản đã được ký
    /// </summary>
    DocumentSigned = 9,
    
    /// <summary>
    /// Văn bản đã được ban hành
    /// </summary>
    DocumentIssued = 10
}
