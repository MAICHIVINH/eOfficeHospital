using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Phân công văn bản cho phòng ban
/// </summary>
public class DocumentAssignment
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Văn bản được phân công
    /// </summary>
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    
    /// <summary>
    /// Phòng ban được phân công (nếu phân công cho cả phòng)
    /// </summary>
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    /// <summary>
    /// Người được phân công (nếu phân công đích danh)
    /// </summary>
    public Guid? AssignedToUserId { get; set; }
    public User? AssignedTo { get; set; }
    
    /// <summary>
    /// Vai trò: Main (chính) / Support (phối hợp)
    /// </summary>
    public AssignmentRole AssignedRole { get; set; }
    
    /// <summary>
    /// Người phân công
    /// </summary>
    public Guid AssignedById { get; set; }
    public User AssignedBy { get; set; } = null!;
    
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Hạn xử lý
    /// </summary>
    public DateTime? Deadline { get; set; }
    
    /// <summary>
    /// Trạng thái xử lý
    /// </summary>
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Pending;
    
    /// <summary>
    /// Ghi chú
    /// </summary>
    public string? Notes { get; set; }
    
    /// <summary>
    /// Thời gian hoàn thành
    /// </summary>
    public DateTime? CompletedAt { get; set; }
    
    /// <summary>
    /// Đường dẫn file báo cáo trong MinIO (object key)
    /// </summary>
    public string? ReportFilePath { get; set; }
    
    /// <summary>
    /// Tên file báo cáo gốc
    /// </summary>
    public string? ReportFileName { get; set; }
    
    /// <summary>
    /// Kích thước file báo cáo (bytes)
    /// </summary>
    public long? ReportFileSize { get; set; }

    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // ─── Hierarchy ──────────────────────────────────────────────────────────

    /// <summary>
    /// ID của phân công cha (ví dụ: Phân công cấp khoa là cha của phân công nhân viên)
    /// </summary>
    public Guid? ParentAssignmentId { get; set; }
    
    /// <summary>
    /// Phân công cha
    /// </summary>
    public virtual DocumentAssignment? ParentAssignment { get; set; }
    
    /// <summary>
    /// Danh sách các phân công con
    /// </summary>
    public virtual ICollection<DocumentAssignment> ChildAssignments { get; set; } = new List<DocumentAssignment>();
}
