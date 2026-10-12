namespace QLVB.Domain.Enums;

/// <summary>
/// Trạng thái ý kiến của phòng ban đối với văn bản đi
/// </summary>
public enum DepartmentOpinionStatus
{
    /// <summary>
    /// Chờ phản hồi
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Đồng ý
    /// </summary>
    Approved = 1,

    /// <summary>
    /// Không đồng ý
    /// </summary>
    Rejected = 2
}
