using QLVB.Application.DTOs.Documents;

namespace QLVB.Application.Services;

public interface IOutgoingDocumentService
{
    /// <summary>
    /// Phân công soạn thảo (Quản lý/Admin/Văn thư)
    /// </summary>
    Task<DocumentDto> AssignDraftingAsync(AssignDraftingDto dto, Guid managerId);

    /// <summary>
    /// Nhân viên nộp bản thảo lên hệ thống (PENDING_DRAFT → DRAFT)
    /// </summary>
    Task<DocumentDto> CreateDraftAsync(CreateDocumentDto dto, Microsoft.AspNetCore.Http.IFormFile? file, Guid creatorId);

    /// <summary>
    /// Bước 1: Trưởng khoa duyệt nội dung (DRAFT → UNIT_REVIEWED)
    /// </summary>
    Task<DocumentDto> ReviewContentAsync(WorkflowTransitionDto dto, Guid managerId);

    /// <summary>
    /// Bước 2: Văn thư in, trình ký giấy, scan và upload bản đã ký (UNIT_REVIEWED → SIGNED)
    /// </summary>
    Task<DocumentDto> SignDocumentAsync(WorkflowTransitionDto dto, Microsoft.AspNetCore.Http.IFormFile? scanFile, Guid userId);

    /// <summary>
    /// Bước 3: Văn thư kiểm tra thể thức và cấp số (SIGNED → ISSUED)
    /// </summary>
    Task<DocumentDto> IssueDocumentAsync(WorkflowTransitionDto dto, Guid clerkId);

    /// <summary>
    /// Bước 4: Văn thư phát hành (ISSUED → PUBLISHED)
    /// </summary>
    Task<DocumentDto> PublishDocumentAsync(WorkflowTransitionDto dto, Guid clerkId);

    /// <summary>
    /// Bước 5: Lưu trữ văn bản (PUBLISHED → ARCHIVED)
    /// </summary>
    Task<DocumentDto> ArchiveDocumentAsync(WorkflowTransitionDto dto, Guid userId);

    /// <summary>
    /// Trưởng khoa từ chối bản thảo → trả về DRAFT
    /// </summary>
    Task<DocumentDto> RejectContentReviewAsync(RejectDocumentDto dto, Guid managerId);

    /// <summary>
    /// Văn thư từ chối thể thức → trả về DRAFT
    /// (Áp dụng khi: UNIT_REVIEWED hoặc SIGNED)
    /// </summary>
    Task<DocumentDto> RejectFormatCheckAsync(RejectDocumentDto dto, Guid clerkId);

    /// <summary>
    /// Lấy lịch sử workflow của văn bản
    /// </summary>
    Task<IEnumerable<WorkflowHistoryDto>> GetWorkflowHistoryAsync(Guid documentId);

    /// <summary>
    /// Quản lý gửi yêu cầu lấy ý kiến phòng ban (DRAFT → PENDING_DEPARTMENT_OPINION)
    /// </summary>
    Task<DocumentDto> RequestDepartmentOpinionsAsync(RequestDepartmentOpinionsDto dto, Guid managerId);

    /// <summary>
    /// Trưởng phòng ban phản hồi ý kiến (Đồng ý / Không đồng ý)
    /// </summary>
    Task<DepartmentOpinionDto> RespondDepartmentOpinionAsync(RespondDepartmentOpinionDto dto, Guid responderId);

    /// <summary>
    /// Lấy danh sách ý kiến của tất cả phòng ban cho một văn bản
    /// </summary>
    Task<IEnumerable<DepartmentOpinionDto>> GetDepartmentOpinionsAsync(Guid documentId);
}
