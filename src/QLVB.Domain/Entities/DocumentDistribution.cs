using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Theo dõi việc phát hành văn bản đi đến từng đơn vị (nội bộ hoặc ngoài)
/// </summary>
public class DocumentDistribution
{
    public Guid Id { get; set; }

    /// <summary>
    /// Văn bản được phát hành
    /// </summary>
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;

    /// <summary>
    /// Loại phát hành: Nội bộ / Ngoài
    /// </summary>
    public DistributionType DistributionType { get; set; }

    // ─── Nội bộ ─────────────────────────────────────────────────────────────
    
    /// <summary>
    /// Khoa/Phòng nhận văn bản (chỉ dùng khi DistributionType = Internal)
    /// </summary>
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    /// <summary>
    /// Trạng thái xử lý của khoa nhận
    /// </summary>
    public DistributionStatus Status { get; set; } = DistributionStatus.Sent;

    /// <summary>
    /// Thời điểm khoa xác nhận đã nhận
    /// </summary>
    public DateTime? ReceivedAt { get; set; }

    /// <summary>
    /// Thời điểm hoàn thành
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// File báo cáo kết quả (do khoa nộp lên)
    /// </summary>
    public string? ReportFilePath { get; set; }
    public string? ReportFileName { get; set; }
    public long? ReportFileSize { get; set; }

    // ─── Ra ngoài ───────────────────────────────────────────────────────────

    /// <summary>
    /// Tên đơn vị/đối tác nhận văn bản (chỉ dùng khi DistributionType = External)
    /// </summary>
    public string? ExternalRecipientName { get; set; }

    /// <summary>
    /// Đối tác đã xác nhận nhận văn bản chưa
    /// </summary>
    public bool IsExternalReceived { get; set; } = false;

    /// <summary>
    /// Ngày đối tác xác nhận đã nhận
    /// </summary>
    public DateTime? ExternalReceivedAt { get; set; }

    // ─── Chung ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Ghi chú thêm
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Ngày gửi văn bản
    /// </summary>
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Người gửi (Văn thư)
    /// </summary>
    public Guid SentById { get; set; }
    public User SentBy { get; set; } = null!;
}
