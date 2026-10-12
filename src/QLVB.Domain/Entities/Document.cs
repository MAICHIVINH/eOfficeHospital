using QLVB.Domain.Enums;

namespace QLVB.Domain.Entities;

/// <summary>
/// Văn bản
/// </summary>
public class Document
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tiêu đề văn bản
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Mô tả / Trích yếu
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Đường dẫn file trong MinIO (object key)
    /// </summary>
    public string FilePath { get; set; } = string.Empty;
    
    /// <summary>
    /// Đường dẫn file preview (PDF converted from Office)
    /// </summary>
    public string? PreviewFilePath { get; set; }
    
    /// <summary>
    /// Tên file gốc
    /// </summary>
    public string FileName { get; set; } = string.Empty;
    
    /// <summary>
    /// Kích thước file (bytes)
    /// </summary>
    public long FileSize { get; set; }
    
    /// <summary>
    /// Loại văn bản
    /// </summary>
    public DocumentType DocumentType { get; set; }
    
    /// <summary>
    /// Phân loại: Đến / Đi
    /// </summary>
    public DocumentCategory Category { get; set; } = DocumentCategory.Incoming;

    /// <summary>
    /// Trạng thái Workflow (dành cho văn bản đi)
    /// </summary>
    public DocumentWorkflowStatus? WorkflowStatus { get; set; }

    /// <summary>
    /// Số văn bản (cấp khi phát hành văn bản đi)
    /// </summary>
    public string? DocumentNumber { get; set; }

    /// <summary>
    /// Hạn xử lý
    /// </summary>
    public DateTime? ProcessingDeadline { get; set; }

    /// <summary>
    /// Mức độ bảo mật
    /// </summary>
    public SecurityLevel SecurityLevel { get; set; }
    
    /// <summary>
    /// Người tạo
    /// </summary>
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    /// <summary>
    /// Người ký (văn bản đi)
    /// </summary>
    public Guid? SignedById { get; set; }
    public User? SignedBy { get; set; }

    /// <summary>
    /// Thời gian ký
    /// </summary>
    public DateTime? SignedAt { get; set; }

    /// <summary>
    /// Người cấp số / phát hành (Văn thư)
    /// </summary>
    public Guid? IssuedById { get; set; }
    public User? IssuedBy { get; set; }

    /// <summary>
    /// Thời gian cấp số / phát hành
    /// </summary>
    public DateTime? IssuedAt { get; set; }

    /// <summary>
    /// Lý do từ chối (khi bị từ chối ở bất kỳ giai đoạn nào)
    /// </summary>
    public string? RejectionReason { get; set; }

    /// <summary>
    /// Người từ chối
    /// </summary>
    public Guid? RejectedById { get; set; }
    public User? RejectedBy { get; set; }

    /// <summary>
    /// Thời gian từ chối
    /// </summary>
    public DateTime? RejectedAt { get; set; }

    /// <summary>
    /// Nội dung văn bản (đối với văn bản soạn thảo trực tuyến)
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// Cơ quan ban hành (chỉ dành cho văn bản đến)
    /// </summary>
    public Guid? IssuingAgencyId { get; set; }
    public IssuingAgency? IssuingAgency { get; set; }
    
    /// <summary>
    /// Ý kiến chỉ đạo của Ban Giám Đốc (cho văn bản đến)
    /// </summary>
    public string? ProcessingInstructions { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    
    // Navigation properties
    public ICollection<DocumentAssignment> Assignments { get; set; } = new List<DocumentAssignment>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<DocumentDistribution> Distributions { get; set; } = new List<DocumentDistribution>();
    public ICollection<DepartmentOpinion> DepartmentOpinions { get; set; } = new List<DepartmentOpinion>();
}
