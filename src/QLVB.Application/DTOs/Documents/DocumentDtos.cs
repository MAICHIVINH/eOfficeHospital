using QLVB.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace QLVB.Application.DTOs.Documents;

public class DocumentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? PreviewFilePath { get; set; }
    public long FileSize { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentTypeCode { get; set; } = string.Empty;
    public string SecurityLevel { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? WorkflowStatus { get; set; }
    public string? DocumentNumber { get; set; }
    public Guid CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessingDeadline { get; set; }
    public Guid? DepartmentId { get; set; }
    
    // Workflow tracking
    public string? SignedByName { get; set; }
    public DateTime? SignedAt { get; set; }
    public string? IssuedByName { get; set; }
    public DateTime? IssuedAt { get; set; }

    // Rejection tracking
    public string? RejectionReason { get; set; }
    public string? RejectedByName { get; set; }
    public DateTime? RejectedAt { get; set; }

    /// <summary>
    /// Nội dung văn bản (HTML)
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// Ý kiến chỉ đạo của Ban Giám Đốc (cho văn bản đến)
    /// </summary>
    public string? ProcessingInstructions { get; set; }

    /// <summary>
    /// Cơ quan ban hành (chỉ dành cho văn bản đến)
    /// </summary>
    public Guid? IssuingAgencyId { get; set; }
    public string? IssuingAgencyName { get; set; }
    public string? IssuingAgencyCode { get; set; }
    public string? IssuingAgencyType { get; set; }

    public List<DocumentAssignmentDetailDto> Assignments { get; set; } = new();
}

public class DocumentAssignmentDetailDto
{
    public Guid Id { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? Deadline { get; set; }
    public Guid? ParentAssignmentId { get; set; }
}

public class CreateDocumentDto
{
    public Guid? DocumentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DocumentNumber { get; set; }
    public DocumentType DocumentType { get; set; }
    public SecurityLevel SecurityLevel { get; set; }
    public string? Content { get; set; }
    public IFormFile? File { get; set; }
    /// <summary>
    /// Cơ quan ban hành (chỉ dùng khi tạo văn bản đến)
    /// </summary>
    public Guid? IssuingAgencyId { get; set; }
}

public class AssignDocumentDto
{
    public Guid DocumentId { get; set; }
    public DateTime? ProcessingDeadline { get; set; }
    public List<DepartmentAssignmentDto> Assignments { get; set; } = new();
}

public class DepartmentAssignmentDto
{
    public Guid? DepartmentId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public AssignmentRole Role { get; set; }
    public string? Notes { get; set; }
    public DateTime? Deadline { get; set; }
}

/// <summary>
/// Request body for POST /documents/{id}/assign
/// </summary>
public class AssignDocumentBody
{
    public DateTime? ProcessingDeadline { get; set; }
    public List<DepartmentAssignmentDto> Assignments { get; set; } = new();
}

public class AssignDraftingDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DocumentType DocumentType { get; set; }
    public SecurityLevel SecurityLevel { get; set; }
    public Guid AssignedToUserId { get; set; }
    public DateTime? Deadline { get; set; }
    public string? Notes { get; set; }
}

public class UpdateDocumentDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DocumentNumber { get; set; }
    public DocumentType DocumentType { get; set; }
    public SecurityLevel SecurityLevel { get; set; }
    public string? Content { get; set; }
    public IFormFile? File { get; set; }
    /// <summary>
    /// Cơ quan ban hành (chỉ dùng khi cập nhật văn bản đến)
    /// </summary>
    public Guid? IssuingAgencyId { get; set; }
}

public class DocumentFilterDto
{
    public string? Search { get; set; }
    public DocumentType? DocumentType { get; set; }
    public SecurityLevel? SecurityLevel { get; set; }
    public DocumentCategory? Category { get; set; }
    public DocumentWorkflowStatus? WorkflowStatus { get; set; }
    public int? Year { get; set; }
    public int? Month { get; set; }
    /// <summary>
    /// Lọc theo cơ quan ban hành
    /// </summary>
    public Guid? IssuingAgencyId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class MonthlyStatisticsDto
{
    public int Month { get; set; }
    public int Count { get; set; }
}
