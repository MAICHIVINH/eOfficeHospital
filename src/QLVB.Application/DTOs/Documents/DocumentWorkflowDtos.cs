using QLVB.Domain.Enums;

namespace QLVB.Application.DTOs.Documents;

/// <summary>
/// DTO cho việc chuyển đổi trạng thái workflow
/// </summary>
public class WorkflowTransitionDto
{
    public Guid DocumentId { get; set; }
    
    /// <summary>
    /// Ghi chú / Ý kiến xử lý
    /// </summary>
    public string? Comment { get; set; }
    
    /// <summary>
    /// Số văn bản (chỉ dùng cho bước Cấp số - Issued)
    /// </summary>
    public string? DocumentNumber { get; set; }
}

/// <summary>
/// DTO cho việc từ chối văn bản
/// </summary>
public class RejectDocumentDto
{
    public Guid DocumentId { get; set; }
    
    /// <summary>
    /// Lý do từ chối (bắt buộc)
    /// </summary>
    public string RejectionReason { get; set; } = string.Empty;
}

/// <summary>
/// DTO hiển thị lịch sử workflow
/// </summary>
public class WorkflowHistoryDto
{
    public DocumentWorkflowStatus Status { get; set; }
    public string StatusDisplayName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public Guid ChangedById { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public string? Comment { get; set; }
}

/// <summary>
/// DTO để quản lý gửi yêu cầu lấy ý kiến các phòng ban
/// </summary>
public class RequestDepartmentOpinionsDto
{
    public Guid DocumentId { get; set; }

    /// <summary>
    /// Danh sách ID các phòng ban cần lấy ý kiến
    /// </summary>
    public List<Guid> DepartmentIds { get; set; } = new();

    /// <summary>
    /// Thời hạn phải phản hồi
    /// </summary>
    public DateTime Deadline { get; set; }

    /// <summary>
    /// Ghi chú của quản lý
    /// </summary>
    public string? Note { get; set; }
}

/// <summary>
/// DTO để trưởng phòng ban phản hồi ý kiến
/// </summary>
public class RespondDepartmentOpinionDto
{
    public Guid DocumentId { get; set; }

    /// <summary>
    /// true = Đồng ý, false = Không đồng ý
    /// </summary>
    public bool IsApproved { get; set; }

    /// <summary>
    /// Ý kiến / nhận xét
    /// </summary>
    public string? Comment { get; set; }
}

/// <summary>
/// DTO trả về thông tin ý kiến của một phòng ban
/// </summary>
public class DepartmentOpinionDto
{
    public Guid Id { get; set; }
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string RequestedByName { get; set; } = string.Empty;
    public string? RespondedByName { get; set; }
    public string Status { get; set; } = string.Empty; // Pending | Approved | Rejected
    public string? Comment { get; set; }
    public DateTime Deadline { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
