using QLVB.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace QLVB.Application.DTOs.Documents;

/// <summary>
/// DTO để phát hành văn bản đi (nội bộ hoặc ra ngoài)
/// </summary>
public class PublishDocumentDto
{
    /// <summary>
    /// Loại phát hành: Internal hoặc External
    /// </summary>
    public DistributionType DistributionType { get; set; }

    /// <summary>
    /// Danh sách ID khoa/phòng nhận (chỉ dùng khi DistributionType = Internal)
    /// </summary>
    public List<Guid>? DepartmentIds { get; set; }

    /// <summary>
    /// Tên đơn vị/đối tác nhận (chỉ dùng khi DistributionType = External)
    /// </summary>
    public string? ExternalRecipientName { get; set; }

    /// <summary>
    /// Ngày gửi (mặc định là hôm nay nếu không truyền)
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// Ghi chú thêm
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// DTO để Văn thư xác nhận đối tác đã nhận văn bản ngoài
/// </summary>
public class ConfirmExternalReceiptDto
{
    public bool IsReceived { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO để Trưởng khoa cập nhật trạng thái xử lý văn bản nội bộ
/// </summary>
public class UpdateDistributionStatusDto
{
    public DistributionStatus Status { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO phản hồi thông tin một bản ghi phát hành
/// </summary>
public class DocumentDistributionDto
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public string DistributionType { get; set; } = string.Empty;

    // Nội bộ
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ReceivedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ReportFileName { get; set; }
    public long? ReportFileSize { get; set; }

    // Ra ngoài
    public string? ExternalRecipientName { get; set; }
    public bool IsExternalReceived { get; set; }
    public DateTime? ExternalReceivedAt { get; set; }

    // Chung
    public string? Notes { get; set; }
    public DateTime SentAt { get; set; }
    public Guid SentById { get; set; }
    public string SentByName { get; set; } = string.Empty;
}
