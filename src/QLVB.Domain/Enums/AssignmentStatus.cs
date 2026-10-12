namespace QLVB.Domain.Enums;

/// <summary>
/// Trạng thái xử lý văn bản
/// </summary>
public enum AssignmentStatus
{
    /// <summary>
    /// Chờ xử lý
    /// </summary>
    Pending = 1,
    
    /// <summary>
    /// Đang xử lý
    /// </summary>
    InProgress = 2,
    
    /// <summary>
    /// Đã hoàn thành
    /// </summary>
    Completed = 3,
    
    /// <summary>
    /// Từ chối
    /// </summary>
    Rejected = 4
}
