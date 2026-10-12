namespace QLVB.Domain.Enums;

/// <summary>
/// Trạng thái Workflow cho Văn bản đi
/// </summary>
public enum DocumentWorkflowStatus
{
    /// <summary>
    /// Chờ phân công soạn thảo (Trưởng khoa)
    /// </summary>
    PendingDraft = 0,

    /// <summary>
    /// Đang soạn thảo (Nhân viên)
    /// </summary>
    Draft = 1,

    /// <summary>
    /// Chờ lấy ý kiến phòng ban (Quản lý gửi yêu cầu, đa số phải đồng ý)
    /// </summary>
    PendingDepartmentOpinion = 9,

    /// <summary>
    /// Duyệt nội dung (Trưởng khoa/phòng – sau khi đa số phòng ban đồng ý)
    /// </summary>
    UnitReviewed = 2,

    /// <summary>
    /// Kiểm tra thể thức (Văn thư)
    /// </summary>
    FormatChecked = 3,

    /// <summary>
    /// Trình ký (Văn thư)
    /// </summary>
    WaitingForSign = 4,

    /// <summary>
    /// Ký văn bản (Giám đốc/Phó Giám đốc)
    /// </summary>
    Signed = 5,

    /// <summary>
    /// Vào sổ – Cấp số (Văn thư)
    /// </summary>
    Issued = 6,

    /// <summary>
    /// Phát hành (Văn thư)
    /// </summary>
    Sent = 7,

    /// <summary>
    /// Lưu trữ (Hệ thống)
    /// </summary>
    Archived = 8,

    /// <summary>
    /// Chờ Ban Giám Đốc duyệt (Văn bản đến)
    /// </summary>
    IncomingPending = 10,

    /// <summary>
    /// Ban Giám Đốc đã duyệt (Văn bản đến)
    /// </summary>
    IncomingApproved = 11,

    /// <summary>
    /// Ban Giám Đốc từ chối (Văn bản đến)
    /// </summary>
    IncomingRejected = 12
}
