using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Ý kiến phòng ban đối với văn bản đi (dùng trong bước lấy ý kiến)
/// </summary>
public class DepartmentOpinion
{
    public Guid Id { get; set; }

    /// <summary>
    /// Văn bản liên quan
    /// </summary>
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;

    /// <summary>
    /// Phòng ban được lấy ý kiến
    /// </summary>
    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    /// <summary>
    /// Người yêu cầu lấy ý kiến (Quản lý)
    /// </summary>
    public Guid RequestedById { get; set; }
    public User RequestedBy { get; set; } = null!;

    /// <summary>
    /// Người phản hồi (Trưởng phòng của phòng ban đó)
    /// </summary>
    public Guid? RespondedById { get; set; }
    public User? RespondedBy { get; set; }

    /// <summary>
    /// Trạng thái ý kiến
    /// </summary>
    public DepartmentOpinionStatus Status { get; set; } = DepartmentOpinionStatus.Pending;

    /// <summary>
    /// Ý kiến / ghi chú
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// Thời hạn phải trả lời
    /// </summary>
    public DateTime Deadline { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }
}
