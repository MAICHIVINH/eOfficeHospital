namespace QLVB.Domain.Enums;

/// <summary>
/// Trạng thái xử lý văn bản đi nội bộ tại mỗi khoa/phòng
/// </summary>
public enum DistributionStatus
{
    /// <summary>
    /// Đã gửi, chờ khoa xác nhận nhận
    /// </summary>
    Sent = 0,

    /// <summary>
    /// Khoa đã xác nhận nhận văn bản
    /// </summary>
    Received = 1,

    /// <summary>
    /// Đang triển khai thực hiện
    /// </summary>
    InProgress = 2,

    /// <summary>
    /// Đã hoàn thành (có thể kèm file báo cáo)
    /// </summary>
    Completed = 3
}
