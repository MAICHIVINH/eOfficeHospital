using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using QLVB.Application.DTOs.Documents;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Storage;
using QLVB.Infrastructure.Services;
using QLVB.Application.DTOs.Notifications;
using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.DocIORenderer;
using Syncfusion.Pdf;
using ClosedXML.Excel;

namespace QLVB.Application.Services;

public interface IDocumentService
{
    Task<DocumentDto> UploadDocumentAsync(CreateDocumentDto dto, IFormFile file, Guid userId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<DocumentDto> Items, int TotalCount)> GetDocumentsAsync(Guid userId, string roleCode, Guid? departmentId, DocumentFilterDto filter, CancellationToken cancellationToken = default);
    Task<DocumentDto?> GetDocumentByIdAsync(Guid id, Guid userId, string roleCode, Guid? departmentId, CancellationToken cancellationToken = default);
    Task<string> GetPreviewUrlAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task AssignDocumentAsync(AssignDocumentDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<DocumentDto> UpdateDocumentAsync(Guid id, UpdateDocumentDto dto, Guid userId, string roleCode, IFormFile? file = null, CancellationToken cancellationToken = default);
    Task DeleteDocumentAsync(Guid id, Guid userId, string roleCode, CancellationToken cancellationToken = default);
    Task ApproveIncomingDocumentAsync(WorkflowTransitionDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task RejectIncomingDocumentAsync(RejectDocumentDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task ArchiveIncomingDocumentAsync(WorkflowTransitionDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<object> GetSystemStatisticsAsync(CancellationToken cancellationToken = default);
    Task<byte[]> ExportIncomingToExcelAsync(Guid userId, string roleCode, Guid? departmentId, DocumentFilterDto filter, CancellationToken cancellationToken = default);
    Task<byte[]> ExportOutgoingToExcelAsync(Guid userId, string roleCode, Guid? departmentId, DocumentFilterDto filter, CancellationToken cancellationToken = default);
    Task<List<MonthlyStatisticsDto>> GetMonthlyArchiveStatisticsAsync(int year, DocumentCategory category, CancellationToken cancellationToken = default);
    Task<byte[]> ExportArchiveIncomingToExcelAsync(int year, CancellationToken cancellationToken = default);
    Task<byte[]> ExportArchiveOutgoingToExcelAsync(int year, CancellationToken cancellationToken = default);
}

public class DocumentService : IDocumentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStorageService _storageService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly INotificationService _notificationService;
    private readonly IPdfService _pdfService;
    private readonly IConfiguration _configuration;
    private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50MB

    public DocumentService(
        IUnitOfWork unitOfWork, 
        IStorageService storageService, 
        IHttpContextAccessor httpContextAccessor,
        INotificationService notificationService,
        IPdfService pdfService,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _storageService = storageService;
        _httpContextAccessor = httpContextAccessor;
        _notificationService = notificationService;
        _pdfService = pdfService;
        _configuration = configuration;
    }

    public async Task<DocumentDto> UploadDocumentAsync(CreateDocumentDto dto, IFormFile file, Guid userId, CancellationToken cancellationToken = default)
    {
        // Validate file
        if (file == null || file.Length == 0)
            throw new ArgumentException("Cần có file đính kèm");

        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException($"Kích thước tệp vượt quá giới hạn cho phép (50MB)");

        // Check for duplicate document number
        if (!string.IsNullOrWhiteSpace(dto.DocumentNumber))
        {
            bool exists = await _unitOfWork.Documents.AnyAsync(d => d.DocumentNumber == dto.DocumentNumber, cancellationToken);
            if (exists)
                throw new ArgumentException($"Số hiệu văn bản '{dto.DocumentNumber}' đã tồn tại trong hệ thống.");
        }

        // Upload to MinIO
        string filePath;
        string? previewFilePath = null;

        using (var stream = file.OpenReadStream())
        {
            filePath = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType, cancellationToken);
        }

        // Convert to PDF for preview if needed
        try
        {
            previewFilePath = await ConvertToPdfAndUploadAsync(file, cancellationToken);
        }
        catch (Exception ex)
        {
            // Log error but don't fail the upload
            Console.WriteLine($"Error converting to PDF: {ex.Message}");
        }

        // Create document entity
        var document = new Document
        {
            Title = dto.Title,
            Description = dto.Description,
            FilePath = filePath,
            PreviewFilePath = previewFilePath,
            FileName = file.FileName,
            FileSize = file.Length,
            DocumentType = dto.DocumentType,
            SecurityLevel = dto.SecurityLevel,
            DocumentNumber = dto.DocumentNumber,
            CreatedById = userId,
            Category = DocumentCategory.Incoming,
            WorkflowStatus = DocumentWorkflowStatus.IncomingPending,
            IssuingAgencyId = dto.IssuingAgencyId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Documents.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // For all incoming documents, notify Clerks and Directors for approval
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        var directors = await _unitOfWork.Users.GetUsersByRoleAsync("DIRECTOR");
        var recipients = clerks.Concat(directors).DistinctBy(u => u.Id);

        foreach (var recipient in recipients)
        {
            await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = recipient.Id,
                Title = "Văn bản đến mới",
                Message = $"Có văn bản đến mới chờ duyệt: {document.Title} (Số hiệu: {document.DocumentNumber})",
                Type = Domain.Enums.NotificationType.General,
                Link = $"/documents/view/{document.Id}",
                DocumentId = document.Id
            });
        }

        // ... (Log action remains same)
        var auditLog = new AuditLog
        {
            UserId = userId,
            DocumentId = document.Id,
            Action = AuditAction.Upload,
            Details = $"Đã tải lên văn bản: {document.Title}",
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Fetch agency details for the DTO if provided
        IssuingAgency? agency = null;
        if (document.IssuingAgencyId.HasValue)
        {
            agency = await _unitOfWork.IssuingAgencies.GetByIdAsync(document.IssuingAgencyId.Value, cancellationToken);
        }

        // Get user for CreatedByName
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);

        return new DocumentDto
        {
            Id = document.Id,
            Title = document.Title,
            Description = document.Description,
            FileName = document.FileName,
            PreviewFilePath = document.PreviewFilePath,
            FileSize = document.FileSize,
            DocumentType = document.DocumentType.ToString(),
            DocumentTypeCode = document.DocumentType.GetAbbreviation(),
            SecurityLevel = document.SecurityLevel.ToString(),
            Category = document.Category.ToString(),
            CreatedById = document.CreatedById,
            CreatedByName = user?.FullName ?? "Unknown",
            CreatedAt = document.CreatedAt,
            ProcessingDeadline = document.ProcessingDeadline,
            IssuingAgencyId = document.IssuingAgencyId,
            IssuingAgencyName = agency?.Name,
            IssuingAgencyCode = agency?.Code,
            IssuingAgencyType = agency?.AgencyType,
            WorkflowStatus = document.WorkflowStatus.ToString()
        };
    }

    public async Task<(IEnumerable<DocumentDto> Items, int TotalCount)> GetDocumentsAsync(Guid userId, string roleCode, Guid? departmentId, DocumentFilterDto filter, CancellationToken cancellationToken = default)
    {
        IEnumerable<Document> documents;

        if (roleCode == "ADMIN" || roleCode == "DIRECTOR" || roleCode == "CLERK")
        {
            // Admin, Director, Clerk see all (filtered by category if provided)
            documents = await _unitOfWork.Documents.GetAllWithDetailsAsync(cancellationToken);
        }
        else
        {
            // Managers and Staff
            var createdDocs = await _unitOfWork.Documents.GetByCreatorIdAsync(userId, cancellationToken);
            var assignedDocs = await _unitOfWork.Documents.GetAssignedDocumentsAsync(userId, departmentId, cancellationToken);
            var publicSentDocs = await _unitOfWork.Documents.GetPublicSentDocumentsAsync(cancellationToken);
            
            // Managers also see documents in their department (for Internal/Public)
            var departmentDocs = (roleCode == "MANAGER" && departmentId.HasValue)
                ? await _unitOfWork.Documents.GetByDepartmentIdAsync(departmentId.Value, cancellationToken)
                : new List<Document>();
            
            // Opinion requested documents (Managers see these even if from other departments)
            var opinionRequestedDocs = departmentId.HasValue
                ? await _unitOfWork.Documents.GetByOpinionRequestedDepartmentIdAsync(departmentId.Value, cancellationToken)
                : new List<Document>();

            documents = createdDocs.Union(assignedDocs).Union(departmentDocs).Union(publicSentDocs).Union(opinionRequestedDocs).DistinctBy(d => d.Id);
        }

        // Apply Security Level and Workflow Filtering for non-Elevated roles
        if (roleCode != "ADMIN" && roleCode != "DIRECTOR" && roleCode != "CLERK")
        {
            documents = documents.Where(d => {
                // Always see documents created by self
                if (d.CreatedById == userId) return true;

                // Logic for OUTGOING documents
                if (d.Category == DocumentCategory.Outgoing)
                {
                    // Managers see all outgoing docs in their department for workflow review (Draft, UnitReviewed, etc.)
                    if (roleCode == "MANAGER" && departmentId.HasValue && 
                        d.CreatedBy != null && d.CreatedBy.DepartmentId == departmentId.Value)
                    {
                        return true;
                    }

                    // Managers see documents they are asked for opinions on
                    if (roleCode == "MANAGER" && departmentId.HasValue && 
                        d.DepartmentOpinions.Any(o => o.DepartmentId == departmentId.Value))
                    {
                        return true;
                    }

                    // Once published (Sent) or Archived, apply security level visibility
                    if (d.WorkflowStatus == DocumentWorkflowStatus.Sent || d.WorkflowStatus == DocumentWorkflowStatus.Archived)
                    {
                        // Public: Everyone sees it
                        if (d.SecurityLevel == SecurityLevel.Public) return true;
                        
                        // Internal/Confidential: Only if assigned to user or their department OR distributed to their department
                        return d.Assignments.Any(a => 
                            a.AssignedToUserId == userId || 
                            (a.DepartmentId.HasValue && departmentId.HasValue && a.DepartmentId == departmentId.Value)
                        ) || d.Distributions.Any(dist => 
                            departmentId.HasValue && dist.DepartmentId == departmentId.Value
                        );
                    }
                    
                    // If not Sent and doesn't meet criteria above, hide it
                    return false;
                }

                // Logic for INCOMING documents (Retain existing behavior)
                if (d.Category == DocumentCategory.Incoming)
                {
                    // Internal/Confidential: Only if assigned
                    return d.Assignments.Any(a => 
                        a.AssignedToUserId == userId || 
                        (d.SecurityLevel == SecurityLevel.Internal && a.DepartmentId.HasValue && departmentId.HasValue && a.DepartmentId == departmentId.Value)
                    );
                }

                return false;
            });
        }

        if (filter.Category.HasValue)
        {
            documents = documents.Where(d => d.Category == filter.Category.Value);
        }

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var searchLower = filter.Search.ToLower();
            documents = documents.Where(d => 
                (d.Title != null && d.Title.ToLower().Contains(searchLower)) || 
                (d.Description != null && d.Description.ToLower().Contains(searchLower)) ||
                (d.DocumentNumber != null && d.DocumentNumber.ToLower().Contains(searchLower))
            );
        }

        if (filter.DocumentType.HasValue)
        {
            documents = documents.Where(d => d.DocumentType == filter.DocumentType.Value);
        }

        if (filter.SecurityLevel.HasValue)
        {
            documents = documents.Where(d => d.SecurityLevel == filter.SecurityLevel.Value);
        }
        
        if (filter.WorkflowStatus.HasValue)
        {
            documents = documents.Where(d => d.WorkflowStatus == filter.WorkflowStatus.Value);
        }

        if (filter.IssuingAgencyId.HasValue)
        {
            documents = documents.Where(d => d.IssuingAgencyId == filter.IssuingAgencyId.Value);
        }

        if (filter.Year.HasValue)
        {
            var year = filter.Year.Value;
            if (filter.Month.HasValue)
            {
                var month = filter.Month.Value;
                var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
                var endDate = startDate.AddMonths(1);
                documents = documents.Where(d => d.CreatedAt >= startDate && d.CreatedAt < endDate);
            }
            else
            {
                var startDate = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                var endDate = startDate.AddYears(1);
                documents = documents.Where(d => d.CreatedAt >= startDate && d.CreatedAt < endDate);
            }
        }
        else if (filter.Month.HasValue)
        {
            documents = documents.Where(d => d.CreatedAt.Month == filter.Month.Value);
        }

        var totalCount = documents.Count();
        var items = documents
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(d => new DocumentDto
            {
                Id = d.Id,
                Title = d.Title,
                Description = d.Description,
                FileName = d.FileName,
                PreviewFilePath = d.PreviewFilePath,
                FileSize = d.FileSize,
                DocumentType = d.DocumentType.ToString(),
                DocumentTypeCode = d.DocumentType.GetAbbreviation(),
                SecurityLevel = d.SecurityLevel.ToString(),
                Category = d.Category.ToString(),
                WorkflowStatus = d.WorkflowStatus?.ToString(),
                DocumentNumber = d.DocumentNumber,
                CreatedById = d.CreatedById,
                CreatedByName = d.CreatedBy?.FullName ?? "Không rõ",
                CreatedAt = d.CreatedAt,
                ProcessingDeadline = d.ProcessingDeadline,
                DepartmentId = d.CreatedBy?.DepartmentId,
                ProcessingInstructions = d.ProcessingInstructions,
                IssuingAgencyId = d.IssuingAgencyId,
                IssuingAgencyName = d.IssuingAgency?.Name,
                IssuingAgencyCode = d.IssuingAgency?.Code,
                IssuingAgencyType = d.IssuingAgency?.AgencyType,
                Assignments = d.Assignments
                    .Where(a => {
                        if (roleCode == "ADMIN" || roleCode == "CLERK" || roleCode == "DIRECTOR") return true;
                        if (roleCode == "STAFF") return a.AssignedToUserId == userId;
                        if (roleCode == "MANAGER") return a.DepartmentId == departmentId || a.AssignedById == userId;
                        return a.AssignedToUserId == userId || a.AssignedById == userId;
                    })
                    .Select(a => new DocumentAssignmentDetailDto
                    {
                        Id = a.Id,
                        DepartmentId = a.DepartmentId,
                        DepartmentName = a.Department?.Name,
                        AssignedToUserId = a.AssignedToUserId,
                        AssignedToName = a.AssignedTo?.FullName,
                        Role = a.AssignedRole.ToString(),
                        Status = a.Status.ToString(),
                        Notes = a.Notes,
                        AssignedAt = a.AssignedAt,
                        Deadline = a.Deadline,
                        ParentAssignmentId = a.ParentAssignmentId
                    }).ToList(),
                RejectionReason = d.RejectionReason,
                RejectedByName = d.RejectedBy?.FullName,
                RejectedAt = d.RejectedAt
            });

        return (items, totalCount);
    }

    public async Task<DocumentDto?> GetDocumentByIdAsync(Guid id, Guid userId, string roleCode, Guid? departmentId, CancellationToken cancellationToken = default)
    {
        var document = await _unitOfWork.Documents.GetByIdWithDetailsAsync(id, cancellationToken);

        if (document == null)
            return null;

        // Check access permission
        bool hasAccess = roleCode == "ADMIN" || roleCode == "DIRECTOR" || roleCode == "CLERK" ||
                        document.CreatedById == userId;

        if (!hasAccess && document.Category == DocumentCategory.Outgoing)
        {
            // Managers see all outgoing docs in their department for workflow review
            if (roleCode == "MANAGER" && departmentId.HasValue && 
                (document.CreatedBy?.DepartmentId == departmentId.Value || 
                 document.DepartmentOpinions.Any(o => o.DepartmentId == departmentId.Value)))
            {
                hasAccess = true;
            }
            // Once published (Sent), apply security level visibility
            else if (document.WorkflowStatus == DocumentWorkflowStatus.Sent)
            {
                if (document.SecurityLevel == SecurityLevel.Public)
                {
                    hasAccess = true;
                }
                else
                {
                    hasAccess = document.Assignments.Any(a => 
                        a.AssignedToUserId == userId || 
                        (a.DepartmentId.HasValue && departmentId.HasValue && a.DepartmentId == departmentId.Value)
                    );
                }
            }
        }
        else if (!hasAccess && document.Category == DocumentCategory.Incoming)
        {
            if (document.SecurityLevel == SecurityLevel.Public && (document.WorkflowStatus == DocumentWorkflowStatus.IncomingApproved || document.WorkflowStatus == DocumentWorkflowStatus.Archived || document.WorkflowStatus == DocumentWorkflowStatus.Sent))
            {
                hasAccess = true;
            }
            else
            {
                hasAccess = document.Assignments.Any(a => 
                    a.AssignedToUserId == userId || 
                    (document.SecurityLevel == SecurityLevel.Internal && departmentId.HasValue && a.DepartmentId == departmentId.Value)
                );
            }
        }

        if (!hasAccess)
            return null;

        return new DocumentDto
        {
            Id = document.Id,
            Title = document.Title,
            Description = document.Description,
            FileName = document.FileName,
            FileSize = document.FileSize,
            DocumentType = document.DocumentType.ToString(),
            DocumentTypeCode = document.DocumentType.GetAbbreviation(),
            SecurityLevel = document.SecurityLevel.ToString(),
            Category = document.Category.ToString(),
            WorkflowStatus = document.WorkflowStatus?.ToString(),
            DocumentNumber = document.DocumentNumber,
            CreatedById = document.CreatedById,
            CreatedByName = document.CreatedBy?.FullName ?? "Unknown",
            CreatedAt = document.CreatedAt,
            ProcessingDeadline = document.ProcessingDeadline,
            DepartmentId = document.CreatedBy?.DepartmentId,
            ProcessingInstructions = document.ProcessingInstructions,
            Assignments = document.Assignments
                .Where(a => {
                    if (roleCode == "ADMIN" || roleCode == "CLERK" || roleCode == "DIRECTOR") return true;
                    if (roleCode == "STAFF") return a.AssignedToUserId == userId || (a.DepartmentId == departmentId && document.SecurityLevel != SecurityLevel.Confidential);
                    if (roleCode == "MANAGER") return a.DepartmentId == departmentId || a.AssignedById == userId;
                    return a.AssignedToUserId == userId || a.AssignedById == userId || a.DepartmentId == departmentId;
                })
                .Select(a => new DocumentAssignmentDetailDto
                {
                    Id = a.Id,
                    DepartmentId = a.DepartmentId,
                    DepartmentName = a.Department?.Name,
                    AssignedToUserId = a.AssignedToUserId,
                    AssignedToName = a.AssignedTo?.FullName,
                    Role = a.AssignedRole.ToString(),
                    Status = a.Status.ToString(),
                    Notes = a.Notes,
                    AssignedAt = a.AssignedAt,
                    Deadline = a.Deadline,
                    ParentAssignmentId = a.ParentAssignmentId
                }).ToList(),
            SignedByName = document.SignedBy?.FullName,
            SignedAt = document.SignedAt,
            IssuedByName = document.IssuedBy?.FullName,
            IssuedAt = document.IssuedAt,
            RejectionReason = document.RejectionReason,
            RejectedByName = document.RejectedBy?.FullName,
            RejectedAt = document.RejectedAt,
            Content = document.Content,
            IssuingAgencyId = document.IssuingAgencyId,
            IssuingAgencyName = document.IssuingAgency?.Name,
            IssuingAgencyCode = document.IssuingAgency?.Code,
            IssuingAgencyType = document.IssuingAgency?.AgencyType
        };
    }

    public async Task<string> GetPreviewUrlAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // ... (Remains same)
        var document = await _unitOfWork.Documents.GetByIdAsync(id, cancellationToken);

        if (document == null)
            throw new ArgumentException("Không tìm thấy văn bản");

        // Log view action
        var auditLog = new AuditLog
        {
            UserId = userId,
            DocumentId = document.Id,
            Action = AuditAction.View,
            Details = $"Đã xem văn bản: {document.Title}",
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Use PreviewFilePath if available (e.g. for Office docs converted to PDF), otherwise use original FilePath
        string pathToShow = !string.IsNullOrEmpty(document.PreviewFilePath) ? document.PreviewFilePath : document.FilePath;

        // Generate presigned URL (valid for 1 hour)
        return await _storageService.GetPresignedUrlAsync(pathToShow, 3600, cancellationToken);
    }

    public async Task AssignDocumentAsync(AssignDocumentDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await _unitOfWork.Documents.GetByIdWithDetailsAsync(dto.DocumentId, cancellationToken);
        var currentUser = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);

        if (document == null || currentUser == null)
            throw new ArgumentException("Không tìm thấy thông tin văn bản hoặc người dùng");

        var userRole = await _unitOfWork.Roles.GetByIdAsync(currentUser.RoleId, cancellationToken);
        var roleCode = userRole?.Code ?? "STAFF";

        // 1. Status Check
        if (document.Category == DocumentCategory.Incoming && 
            document.WorkflowStatus != DocumentWorkflowStatus.IncomingApproved &&
            document.WorkflowStatus != DocumentWorkflowStatus.Archived)
        {
            throw new ArgumentException("Văn bản chưa được phê duyệt nên chưa thể phân công.");
        }

        // 2. Permission Logic Check
        if (roleCode == "MANAGER")
        {
            // Managers can only assign if their department was already assigned this document
            var isDeptAssigned = document.Assignments.Any(a => a.DepartmentId == currentUser.DepartmentId);
            if (!isDeptAssigned && document.CreatedById != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền phân công văn bản này vì khoa của bạn chưa được giao xử lý.");
            }
        }

        // 3. Update the document's overall processing deadline
        if (dto.ProcessingDeadline.HasValue)
        {
            document.ProcessingDeadline = DateTime.SpecifyKind(dto.ProcessingDeadline.Value, DateTimeKind.Utc);
            _unitOfWork.Documents.Update(document);
        }

        var docDeadline = document.ProcessingDeadline;

        // Get existing assignments
        var existingAssignments = await _unitOfWork.DocumentAssignments.FindAsync(a => a.DocumentId == dto.DocumentId && !a.IsDeleted, cancellationToken);

        foreach (var assignment in dto.Assignments)
        {
            // 4. Deadline Validation
            if (assignment.Deadline.HasValue && docDeadline.HasValue)
            {
                if (assignment.Deadline.Value.Date > docDeadline.Value.Date)
                {
                    throw new ArgumentException($"Hạn xử lý giao đi ({assignment.Deadline.Value:dd/MM/yyyy}) không được muộn hơn hạn xử lý chung của văn bản ({docDeadline.Value:dd/MM/yyyy}).");
                }
            }

            // 5. Manager Cross-Department Check
            if (roleCode == "MANAGER" && assignment.AssignedToUserId.HasValue)
            {
                var targetUser = await _unitOfWork.Users.GetByIdAsync(assignment.AssignedToUserId.Value, cancellationToken);
                if (targetUser == null || targetUser.DepartmentId != currentUser.DepartmentId)
                {
                    throw new UnauthorizedAccessException($"Trưởng khoa chỉ có thể phân công cho nhân viên thuộc khoa mình. (Nhân viên {targetUser?.FullName ?? "không xác định"} không thuộc khoa của bạn).");
                }
            }

            // Check if already assigned
            bool isDuplicate = false;
            if (assignment.AssignedToUserId.HasValue)
            {
                isDuplicate = existingAssignments.Any(a => a.AssignedToUserId == assignment.AssignedToUserId.Value);
            }
            else if (assignment.DepartmentId.HasValue)
            {
                isDuplicate = existingAssignments.Any(a => a.DepartmentId == assignment.DepartmentId.Value && !a.AssignedToUserId.HasValue);
            }

            if (isDuplicate) continue;

            // Find parent assignment if this is a sub-assignment (Manager assigning to staff)
            Guid? parentId = null;
            if (roleCode == "MANAGER" && assignment.AssignedToUserId.HasValue)
            {
                var parentAssignment = existingAssignments.FirstOrDefault(a => 
                    a.DepartmentId == currentUser.DepartmentId && 
                    !a.AssignedToUserId.HasValue);
                
                parentId = parentAssignment?.Id;
            }

            var documentAssignment = new DocumentAssignment
            {
                DocumentId = dto.DocumentId,
                DepartmentId = assignment.DepartmentId,
                AssignedToUserId = assignment.AssignedToUserId,
                AssignedRole = assignment.Role,
                AssignedById = userId,
                Notes = assignment.Notes,
                AssignedAt = DateTime.UtcNow,
                Deadline = assignment.Deadline.HasValue ? DateTime.SpecifyKind(assignment.Deadline.Value, DateTimeKind.Utc) : null,
                Status = AssignmentStatus.Pending,
                ParentAssignmentId = parentId
            };

            await _unitOfWork.DocumentAssignments.AddAsync(documentAssignment, cancellationToken);

            // Send notification (Remains same logic)
            if (assignment.AssignedToUserId.HasValue)
            {
                await _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto
                {
                    UserId = assignment.AssignedToUserId.Value,
                    Title = "Giao việc cá nhân mới",
                    Message = $"Văn bản '{document.Title}' đã được phân công đích danh cho bạn.",
                    Type = Domain.Enums.NotificationType.NewAssignment,
                    Link = $"/documents/view/{dto.DocumentId}",
                    DocumentId = dto.DocumentId
                });
            }
            else if (assignment.DepartmentId.HasValue)
            {
                var departmentUsers = await _unitOfWork.Users.GetUsersByDepartmentAsync(assignment.DepartmentId.Value, cancellationToken);
                foreach (var u in departmentUsers)
                {
                    await _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto
                    {
                        UserId = u.Id,
                        Title = "Giao việc mới cho phòng",
                        Message = $"Văn bản '{document.Title}' đã được phân công cho phòng ban của bạn.",
                        Type = Domain.Enums.NotificationType.NewAssignment,
                        Link = $"/documents/view/{dto.DocumentId}",
                        DocumentId = dto.DocumentId
                    });
                }
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Audit Log
        var auditLog = new AuditLog
        {
            UserId = userId,
            DocumentId = dto.DocumentId,
            Action = AuditAction.Assign,
            Details = $"Đã thực hiện phân công/giao việc cho văn bản: {document.Title}",
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<DocumentDto> UpdateDocumentAsync(Guid id, UpdateDocumentDto dto, Guid userId, string roleCode, IFormFile? file = null, CancellationToken cancellationToken = default)
    {
        var document = await _unitOfWork.Documents.GetByIdWithDetailsAsync(id, cancellationToken);

        if (document == null)
            throw new ArgumentException("Không tìm thấy văn bản");

        // Permission check: Only allow editing if document is Draft OR user is Admin
        bool canEdit = roleCode == "ADMIN" || 
                      (document.Category == DocumentCategory.Outgoing && document.WorkflowStatus == DocumentWorkflowStatus.Draft && document.CreatedById == userId) ||
                      (document.Category == DocumentCategory.Incoming && document.CreatedById == userId);

        if (!canEdit)
            throw new UnauthorizedAccessException("Bạn chỉ có thể chỉnh sửa văn bản ở trạng thái Bản thảo hoặc nếu bạn là Quản trị viên");

        // If a new file is provided, replace the old file
        if (file != null)
        {
            // Validate file
            if (file.Length == 0)
                throw new ArgumentException("Tệp trống");

            if (file.Length > MaxFileSizeBytes)
                throw new ArgumentException($"Kích thước tệp vượt quá giới hạn cho phép (50MB)");

            // if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            //    throw new ArgumentException("Chỉ cho phép tệp PDF");

            // Delete old file from storage
            if (!string.IsNullOrEmpty(document.FilePath))
            {
                try
                {
                    await _storageService.DeleteFileAsync(document.FilePath, cancellationToken);
                }
                catch (Exception ex)
                {
                    // Log but don't fail if old file deletion fails
                    Console.WriteLine($"Warning: Failed to delete old file {document.FilePath}: {ex.Message}");
                }
            }

            // Upload new file to storage
            string newFilePath;
            string? newPreviewFilePath = null;
            using (var stream = file.OpenReadStream())
            {
                newFilePath = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType, cancellationToken);
            }

            try
            {
                newPreviewFilePath = await ConvertToPdfAndUploadAsync(file, cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error converting to PDF in update: {ex.Message}");
            }

            // Update file-related fields
            document.FilePath = newFilePath;
            document.FileName = file.FileName;
            document.FileSize = file.Length;
            document.PreviewFilePath = newPreviewFilePath;
        }

        // Update metadata fields
        document.Title = dto.Title;
        document.Description = dto.Description;

        // Check for duplicate document number
        if (!string.IsNullOrWhiteSpace(dto.DocumentNumber) && dto.DocumentNumber != document.DocumentNumber)
        {
            bool exists = await _unitOfWork.Documents.AnyAsync(d => d.DocumentNumber == dto.DocumentNumber && d.Id != id, cancellationToken);
            if (exists)
                throw new ArgumentException($"Số hiệu văn bản '{dto.DocumentNumber}' đã tồn tại trong hệ thống.");
        }

        document.DocumentNumber = dto.DocumentNumber;
        document.DocumentType = dto.DocumentType;
        document.SecurityLevel = dto.SecurityLevel;
        document.UpdatedAt = DateTime.UtcNow;

        // Update issuing agency (only for incoming documents)
        if (document.Category == Domain.Enums.DocumentCategory.Incoming)
        {
            document.IssuingAgencyId = dto.IssuingAgencyId;
        }

        // Clear rejection data when document is updated (fresh start)
        document.RejectionReason = null;
        document.RejectedById = null;
        document.RejectedAt = null;


        // If online content is provided and changed
        if (!string.IsNullOrWhiteSpace(dto.Content) && dto.Content != document.Content)
        {
            // Delete old file from storage if it exists
            if (!string.IsNullOrEmpty(document.FilePath))
            {
                try
                {
                    await _storageService.DeleteFileAsync(document.FilePath, cancellationToken);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Failed to delete old file {document.FilePath}: {ex.Message}");
                }
            }

            // Generate new PDF from updated content
            string fileName = $"{dto.Title.Replace(" ", "_")}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
            string contentType = "application/pdf";
            var pdfBytes = await _pdfService.GeneratePdfFromHtmlAsync(dto.Content);

            using (var stream = new MemoryStream(pdfBytes))
            {
                document.FilePath = await _storageService.UploadFileAsync(stream, fileName, contentType, cancellationToken);
            }

            document.FileName = fileName;
            document.FileSize = pdfBytes.Length;
            document.Content = dto.Content;
            document.PreviewFilePath = null; // No need for generic preview if it's already a generated PDF
        }

        _unitOfWork.Documents.Update(document);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log update action
        var auditLog = new AuditLog
        {
            UserId = userId,
            DocumentId = document.Id,
            Action = AuditAction.Update,
            Details = file != null ? $"Đã cập nhật văn bản với tệp mới: {document.Title}" : $"Đã cập nhật văn bản: {document.Title}",
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Get updated document with details for the return DTO
        var updatedDoc = await GetDocumentByIdAsync(document.Id, userId, roleCode, null, cancellationToken);
        return updatedDoc ?? throw new ArgumentException("Lỗi khi lấy thông tin văn bản sau khi cập nhật");
    }

    public async Task DeleteDocumentAsync(Guid id, Guid userId, string roleCode, CancellationToken cancellationToken = default)
    {
        var document = await _unitOfWork.Documents.GetByIdAsync(id, cancellationToken);

        if (document == null)
            throw new ArgumentException("Không tìm thấy văn bản");

        // Permission check: Only allow deleting if document is Draft OR user is Admin
        bool canDelete = roleCode == "ADMIN" || 
                        (document.Category == DocumentCategory.Outgoing && document.WorkflowStatus == DocumentWorkflowStatus.Draft && document.CreatedById == userId) ||
                        (document.Category == DocumentCategory.Incoming && document.CreatedById == userId);

        if (!canDelete)
            throw new UnauthorizedAccessException("Bạn chỉ có thể xóa văn bản ở trạng thái Bản thảo hoặc nếu bạn là Quản trị viên");

        // Soft delete document
        _unitOfWork.Documents.SoftDelete(document);

        // Cascade soft delete to assignments
        var assignments = await _unitOfWork.DocumentAssignments.FindAsync(a => a.DocumentId == id);
        foreach (var assignment in assignments)
        {
            _unitOfWork.DocumentAssignments.SoftDelete(assignment);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log delete action
        var auditLog = new AuditLog
        {
            UserId = userId,
            DocumentId = document.Id,
            Action = AuditAction.Delete,
            Details = $"Đã xóa văn bản: {document.Title}",
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
    
    public async Task<object> GetSystemStatisticsAsync(CancellationToken cancellationToken = default)
    {
        // Use GetAllWithDetailsAsync to include Assignments for completion check
        var allDocs = await _unitOfWork.Documents.GetAllWithDetailsAsync(cancellationToken);
        var activeDocs = allDocs.Where(d => !d.IsDeleted).ToList();
        
        var now = DateTime.UtcNow;
        var today = now.Date;
        var in3Days = today.AddDays(4); // End of 3rd day

        // Function to determine if a document is "Finished" (should NOT be counted in deadline alerts)
        Func<Document, bool> IsFinished = d =>
        {
            if (d.Category == DocumentCategory.Incoming)
            {
                // Incoming: Finished if rejected
                if (d.WorkflowStatus == DocumentWorkflowStatus.IncomingRejected) return true;
                
                // If approved or archived, it's only finished if it has assignments and ALL are completed
                if (d.WorkflowStatus == DocumentWorkflowStatus.IncomingApproved || d.WorkflowStatus == DocumentWorkflowStatus.Archived)
                {
                    // If it has assignments, check if all are completed
                    if (d.Assignments != null && d.Assignments.Any())
                    {
                        return d.Assignments.All(a => a.Status == AssignmentStatus.Completed);
                    }
                    // If it has NO assignments but is Approved/Archived, it's NOT finished (waiting for Clerk to assign)
                    return false;
                }
                
                return false; // IncomingPending is not finished
            }
            else
            {
                // Outgoing: Finished if sent or archived
                return d.WorkflowStatus >= DocumentWorkflowStatus.Sent;
            }
        };

        // Filter only working (not finished) documents for deadline alerts - ONLY for Incoming category
        var workingDocs = activeDocs.Where(d => d.Category == DocumentCategory.Incoming && d.ProcessingDeadline.HasValue && !IsFinished(d)).ToList();

        return new
        {
            TotalDocuments = activeDocs.Count,
            IncomingDocuments = activeDocs.Count(d => d.Category == DocumentCategory.Incoming),
            OutgoingDocuments = activeDocs.Count(d => d.Category == DocumentCategory.Outgoing),
            DeadlineStats = new
            {
                Overdue = workingDocs.Count(d => d.ProcessingDeadline.HasValue && d.ProcessingDeadline.Value.Date < today),
                DueToday = workingDocs.Count(d => d.ProcessingDeadline.HasValue && d.ProcessingDeadline.Value.Date == today),
                NearingDeadline = workingDocs.Count(d => d.ProcessingDeadline.HasValue && d.ProcessingDeadline.Value.Date > today && d.ProcessingDeadline.Value.Date < in3Days.Date)
            }
        };
    }

    public async Task ApproveIncomingDocumentAsync(WorkflowTransitionDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await _unitOfWork.Documents.GetByIdWithDetailsAsync(dto.DocumentId, cancellationToken);
        if (document == null) throw new ArgumentException("Không tìm thấy văn bản");

        if (document.Category != DocumentCategory.Incoming)
            throw new ArgumentException("Chỉ áp dụng cho văn bản đến");

        document.WorkflowStatus = DocumentWorkflowStatus.IncomingApproved;
        document.ProcessingInstructions = dto.Comment;
        document.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Documents.Update(document);

        // Auto-assign to all users if it's a PUBLIC document
        if (document.SecurityLevel == SecurityLevel.Public)
        {
            var allUsers = await _unitOfWork.Users.GetAllAsync(cancellationToken);
            var usersToAssign = allUsers.Where(u => u.Id != document.CreatedById && !u.IsDeleted).ToList();

            foreach (var user in usersToAssign)
            {
                var assignment = new DocumentAssignment
                {
                    DocumentId = document.Id,
                    AssignedToUserId = user.Id,
                    AssignedRole = AssignmentRole.Support,
                    Status = AssignmentStatus.Pending,
                    Notes = "Tự động phân công - Văn bản công khai đã được BGĐ duyệt",
                    AssignedAt = DateTime.UtcNow,
                    AssignedById = userId // The Director who approved it
                };
                await _unitOfWork.DocumentAssignments.AddAsync(assignment, cancellationToken);

                // Send notification to each user
                await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
                {
                    UserId = user.Id,
                    Title = "Văn bản công khai mới",
                    Message = $"Có văn bản công khai mới vừa được duyệt: {document.Title}",
                    Type = Domain.Enums.NotificationType.General,
                    Link = $"/documents/view/{document.Id}",
                    DocumentId = document.Id
                });
            }
        }
        
        // Log action
        await _unitOfWork.AuditLogs.AddAsync(new AuditLog
        {
            UserId = userId,
            DocumentId = document.Id,
            Action = AuditAction.Update,
            Details = $"Ban Giám Đốc đã duyệt văn bản đến: {document.Title}. Ý kiến: {dto.Comment}",
            Timestamp = DateTime.UtcNow,
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString()
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify Clerk that doc is approved and ready for assignment
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        foreach (var clerk in clerks)
        {
            await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = clerk.Id,
                Title = "Văn bản đến đã được duyệt",
                Message = $"Văn bản '{document.Title}' đã được BGĐ duyệt. Vui lòng thực hiện lưu trữ vào kho và phân công xử lý.",
                Type = NotificationType.General,
                Link = $"/documents/view/{document.Id}",
                DocumentId = document.Id
            });
        }
    }

    public async Task RejectIncomingDocumentAsync(RejectDocumentDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await _unitOfWork.Documents.GetByIdWithDetailsAsync(dto.DocumentId, cancellationToken);
        if (document == null) throw new ArgumentException("Không tìm thấy văn bản");

        if (document.Category != DocumentCategory.Incoming)
            throw new ArgumentException("Chỉ áp dụng cho văn bản đến");

        document.WorkflowStatus = DocumentWorkflowStatus.IncomingRejected;
        document.RejectionReason = dto.RejectionReason;
        document.RejectedById = userId;
        document.RejectedAt = DateTime.UtcNow;
        document.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Documents.Update(document);

        // Log action
        await _unitOfWork.AuditLogs.AddAsync(new AuditLog
        {
            UserId = userId,
            DocumentId = document.Id,
            Action = AuditAction.Update,
            Details = $"Ban Giám Đốc đã từ chối văn bản đến: {document.Title}. Lý do: {dto.RejectionReason}",
            Timestamp = DateTime.UtcNow,
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString()
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify Clerk
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        foreach (var clerk in clerks)
        {
            await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = clerk.Id,
                Title = "Văn bản đến bị từ chối",
                Message = $"Văn bản '{document.Title}' đã bị BGĐ từ chối. Lý do: {dto.RejectionReason}",
                Type = NotificationType.General,
                Link = $"/documents/view/{document.Id}",
                DocumentId = document.Id
            });
        }
    }

    public async Task ArchiveIncomingDocumentAsync(WorkflowTransitionDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await _unitOfWork.Documents.GetByIdWithDetailsAsync(dto.DocumentId, cancellationToken);
        if (document == null) throw new ArgumentException("Không tìm thấy văn bản");

        if (document.Category != DocumentCategory.Incoming)
            throw new ArgumentException("Chỉ áp dụng cho văn bản đến");

        if (document.WorkflowStatus != DocumentWorkflowStatus.IncomingApproved)
            throw new ArgumentException("Chỉ văn bản đã được duyệt mới có thể lưu trữ");

        document.WorkflowStatus = DocumentWorkflowStatus.Archived;
        document.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Documents.Update(document);

        // Log action
        await _unitOfWork.AuditLogs.AddAsync(new AuditLog
        {
            UserId = userId,
            DocumentId = document.Id,
            Action = AuditAction.Update,
            Details = $"Văn thư đã thực hiện lưu trữ văn bản đến: {document.Title}",
            Timestamp = DateTime.UtcNow,
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString()
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
    private async Task<string?> ConvertToPdfAndUploadAsync(IFormFile file, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(file.FileName).ToLower();
        if (extension != ".docx" && extension != ".xlsx")
            return null;

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        using var pdfStream = new MemoryStream();

        try
        {
            if (extension == ".docx")
            {
                using var wordDocument = new Syncfusion.DocIO.DLS.WordDocument(memoryStream, Syncfusion.DocIO.FormatType.Docx);
                using var renderer = new Syncfusion.DocIORenderer.DocIORenderer();
                using var pdfDocument = renderer.ConvertToPDF(wordDocument);
                pdfDocument.Save(pdfStream);
            }
            else if (extension == ".xlsx")
            {
                using var excelEngine = new Syncfusion.XlsIO.ExcelEngine();
                var application = excelEngine.Excel;
                var workbook = application.Workbooks.Open(memoryStream);
                var renderer = new Syncfusion.XlsIORenderer.XlsIORenderer();
                using var pdfDocument = renderer.ConvertToPDF(workbook);
                pdfDocument.Save(pdfStream);
                
                // Explicitly close workbook as it's not Disposable
                workbook.Close();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Syncfusion conversion error for {file.FileName}: {ex.Message}");
            return null;
        }

        pdfStream.Position = 0;
        if (pdfStream.Length == 0) return null;

        var pdfFileName = Path.GetFileNameWithoutExtension(file.FileName) + ".pdf";
        return await _storageService.UploadFileAsync(pdfStream, pdfFileName, "application/pdf", cancellationToken);
    }

    public async Task<byte[]> ExportIncomingToExcelAsync(Guid userId, string roleCode, Guid? departmentId, DocumentFilterDto filter, CancellationToken cancellationToken = default)
    {
        // Force Category to Incoming and get all relevant records
        filter.Category = DocumentCategory.Incoming;
        filter.PageSize = 2000; // Limit for one report
        filter.PageNumber = 1;

        var (items, _) = await GetDocumentsAsync(userId, roleCode, departmentId, filter, cancellationToken);
        
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Sổ văn bản đến");

        // 1. Styling Base (Times New Roman)
        worksheet.Style.Font.FontName = "Times New Roman";
        worksheet.Style.Font.FontSize = 11;

        // 2. Official Hospital Header & National Motto
        // Hospital name on the left (Rows 1-3)
        worksheet.Cell("A1").Value = "CÔNG TY CP BỆNH VIỆN ĐA KHOA";
        worksheet.Cell("A1").Style.Font.Bold = true;
        worksheet.Cell("A1").Style.Font.FontSize = 10;
        worksheet.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("A1:C1").Merge();

        worksheet.Cell("A2").Value = "TÂM TRÍ CAO LÃNH";
        worksheet.Cell("A2").Style.Font.Bold = true;
        worksheet.Cell("A2").Style.Font.FontSize = 10;
        worksheet.Cell("A2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("A2:C2").Merge();
        
        worksheet.Cell("A3").Value = "Số: ......../Sổ-VT";
        worksheet.Cell("A3").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("A3:C3").Merge();

        // Motto on the right (Rows 1-3)
        worksheet.Cell("E1").Value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
        worksheet.Cell("E1").Style.Font.Bold = true;
        worksheet.Cell("E1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("E1:G1").Merge();

        worksheet.Cell("E2").Value = "Độc lập - Tự do - Hạnh phúc";
        worksheet.Cell("E2").Style.Font.Bold = true;
        worksheet.Cell("E2").Style.Font.Italic = true;
        worksheet.Cell("E2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("E2:G2").Merge();

        worksheet.Cell("E3").Value = "P. Cao Lãnh, ngày.....tháng.....năm......";
        worksheet.Cell("E3").Style.Font.Italic = true;
        worksheet.Cell("E3").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("E3:G3").Merge();

        // 3. Main Title
        worksheet.Cell("C5").Value = "SỔ ĐĂNG KÝ VĂN BẢN ĐẾN";
        worksheet.Cell("C5").Style.Font.Bold = true;
        worksheet.Cell("C5").Style.Font.FontSize = 16;
        worksheet.Cell("C5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("C5:E5").Merge();

        worksheet.Cell("C6").Value = $"Năm: {DateTime.Now.Year}";
        worksheet.Cell("C6").Style.Font.Italic = true;
        worksheet.Cell("C6").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("C6:E6").Merge();

        // 4. Table Headers (Simplified standard)
        string[] headers = { "STT", "Số đến", "Ngày đến", "Tên văn bản", "Đơn vị/Người nhận", "Hạn xử lý", "Ghi chú" };
        var headerRange = worksheet.Range(8, 1, 8, headers.Length);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#BDD7EE"); // Light Blue Professional Shade
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        headerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        headerRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;

        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(8, i + 1).Value = headers[i];
        }

        // 5. Data Rows
        int rowIndex = 9;
        int stt = 1;
        foreach (var doc in items)
        {
            worksheet.Cell(rowIndex, 1).Value = stt++;
            worksheet.Cell(rowIndex, 2).Value = doc.DocumentNumber ?? "";
            worksheet.Cell(rowIndex, 3).Value = doc.CreatedAt.ToString("dd/MM/yyyy");
            worksheet.Cell(rowIndex, 4).Value = doc.Title;
            worksheet.Cell(rowIndex, 5).Value = string.Join(", ", doc.Assignments.Select(a => a.DepartmentName ?? a.AssignedToName));
            worksheet.Cell(rowIndex, 6).Value = doc.ProcessingDeadline?.ToString("dd/MM/yyyy") ?? "";
            worksheet.Cell(rowIndex, 7).Value = "";

            // Styling data row
            var dataRange = worksheet.Range(rowIndex, 1, rowIndex, headers.Length);
            dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            dataRange.Style.Alignment.WrapText = true;
            
            // STT and dates centered
            worksheet.Cell(rowIndex, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Cell(rowIndex, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Cell(rowIndex, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            rowIndex++;
        }

        // 6. Column Widths
        worksheet.Column(1).Width = 6;   // STT
        worksheet.Column(2).Width = 15;  // Số đến
        worksheet.Column(3).Width = 15;  // Ngày đến
        worksheet.Column(4).Width = 60;  // Tên văn bản
        worksheet.Column(5).Width = 35;  // Đơn vị/Người nhận
        worksheet.Column(6).Width = 15;  // Hạn xử lý
        worksheet.Column(7).Width = 20;  // Ghi chú

        // 7. Footer (Signatures)
        rowIndex++;
        worksheet.Cell(rowIndex, 3).Value = "Người vào sổ";
        worksheet.Cell(rowIndex, 3).Style.Font.Bold = true;
        worksheet.Cell(rowIndex, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        worksheet.Cell(rowIndex, 6).Value = "Ban Giám đốc";
        worksheet.Cell(rowIndex, 6).Style.Font.Bold = true;
        worksheet.Cell(rowIndex, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        rowIndex++;
        worksheet.Cell(rowIndex, 3).Value = "(Ký, ghi rõ họ tên)";
        worksheet.Cell(rowIndex, 3).Style.Font.Italic = true;
        worksheet.Cell(rowIndex, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        worksheet.Cell(rowIndex, 6).Value = "(Ký tên, đóng dấu)";
        worksheet.Cell(rowIndex, 6).Style.Font.Italic = true;
        worksheet.Cell(rowIndex, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // 8. Output to byte array
        using (var stream = new MemoryStream())
        {
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
    public async Task<byte[]> ExportOutgoingToExcelAsync(Guid userId, string roleCode, Guid? departmentId, DocumentFilterDto filter, CancellationToken cancellationToken = default)
    {
        // Force Category to Outgoing and get relevant records
        filter.Category = DocumentCategory.Outgoing;
        filter.PageSize = 2000; 
        filter.PageNumber = 1;

        var (items, _) = await GetDocumentsAsync(userId, roleCode, departmentId, filter, cancellationToken);
        
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Sổ văn bản đi");

        // 1. Styling Base (Times New Roman)
        worksheet.Style.Font.FontName = "Times New Roman";
        worksheet.Style.Font.FontSize = 11;

        // 2. Official Hospital Header & National Motto
        // Hospital name on the left (Rows 1-3)
        worksheet.Cell("A1").Value = "CÔNG TY CP BỆNH VIỆN ĐA KHOA";
        worksheet.Cell("A1").Style.Font.Bold = true;
        worksheet.Cell("A1").Style.Font.FontSize = 10;
        worksheet.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("A1:C1").Merge();

        worksheet.Cell("A2").Value = "TÂM TRÍ CAO LÃNH";
        worksheet.Cell("A2").Style.Font.Bold = true;
        worksheet.Cell("A2").Style.Font.FontSize = 10;
        worksheet.Cell("A2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("A2:C2").Merge();
        
        worksheet.Cell("A3").Value = "Số: ......../Sổ-VT";
        worksheet.Cell("A3").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("A3:C3").Merge();

        // Motto on the right (Rows 1-3)
        worksheet.Cell("E1").Value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
        worksheet.Cell("E1").Style.Font.Bold = true;
        worksheet.Cell("E1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("E1:F1").Merge();

        worksheet.Cell("E2").Value = "Độc lập - Tự do - Hạnh phúc";
        worksheet.Cell("E2").Style.Font.Bold = true;
        worksheet.Cell("E2").Style.Font.Italic = true;
        worksheet.Cell("E2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("E2:F2").Merge();

        worksheet.Cell("E3").Value = "P. Cao Lãnh, ngày.....tháng.....năm......";
        worksheet.Cell("E3").Style.Font.Italic = true;
        worksheet.Cell("E3").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("E3:F3").Merge();

        // 3. Main Title
        worksheet.Cell("C5").Value = "SỔ ĐĂNG KÝ VĂN BẢN ĐI";
        worksheet.Cell("C5").Style.Font.Bold = true;
        worksheet.Cell("C5").Style.Font.FontSize = 16;
        worksheet.Cell("C5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("C5:E5").Merge();

        worksheet.Cell("C6").Value = $"Năm: {DateTime.Now.Year}";
        worksheet.Cell("C6").Style.Font.Italic = true;
        worksheet.Cell("C6").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range("C6:E6").Merge();

        // 4. Table Headers (Outgoing Standard - Revised)
        string[] headers = { 
            "STT", 
            "Số hiệu văn bản", 
            "Ngày ban hành", 
            "Tên văn bản", 
            "Đơn vị soạn thảo", 
            "Ghi chú" 
        };
        var headerRange = worksheet.Range(8, 1, 8, headers.Length);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#BDD7EE");
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        headerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        headerRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;

        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(8, i + 1).Value = headers[i];
        }

        // 5. Data Rows
        int rowIndex = 9;
        int stt = 1;
        foreach (var doc in items)
        {
            worksheet.Cell(rowIndex, 1).Value = stt++;
            worksheet.Cell(rowIndex, 2).Value = doc.DocumentNumber ?? "";
            worksheet.Cell(rowIndex, 3).Value = (doc.IssuedAt ?? doc.CreatedAt).ToString("dd/MM/yyyy");
            worksheet.Cell(rowIndex, 4).Value = doc.Title;
            worksheet.Cell(rowIndex, 5).Value = doc.CreatedByName;
            worksheet.Cell(rowIndex, 6).Value = "";

            // Styling data row
            var dataRange = worksheet.Range(rowIndex, 1, rowIndex, headers.Length);
            dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            dataRange.Style.Alignment.WrapText = true;
            
            worksheet.Cell(rowIndex, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Cell(rowIndex, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            rowIndex++;
        }

        // 6. Column Widths (Adjusted)
        worksheet.Column(1).Width = 6;   // STT
        worksheet.Column(2).Width = 20;  // Số hiệu văn bản
        worksheet.Column(3).Width = 15;  // Ngày ban hành
        worksheet.Column(4).Width = 60;  // Tên văn bản
        worksheet.Column(5).Width = 25;  // Đơn vị soạn thảo
        worksheet.Column(6).Width = 20;  // Ghi chú

        // 7. Footer (Signatures)
        rowIndex++;
        worksheet.Cell(rowIndex, 2).Value = "Người vào sổ";
        worksheet.Cell(rowIndex, 2).Style.Font.Bold = true;
        worksheet.Cell(rowIndex, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        worksheet.Cell(rowIndex, 5).Value = "Ban Giám đốc";
        worksheet.Cell(rowIndex, 5).Style.Font.Bold = true;
        worksheet.Cell(rowIndex, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        rowIndex++;
        worksheet.Cell(rowIndex, 2).Value = "(Ký, ghi rõ họ tên)";
        worksheet.Cell(rowIndex, 2).Style.Font.Italic = true;
        worksheet.Cell(rowIndex, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        worksheet.Cell(rowIndex, 5).Value = "(Ký tên, đóng dấu)";
        worksheet.Cell(rowIndex, 5).Style.Font.Italic = true;
        worksheet.Cell(rowIndex, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // 8. Output
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<List<MonthlyStatisticsDto>> GetMonthlyArchiveStatisticsAsync(int year, DocumentCategory category, CancellationToken cancellationToken = default)
    {
        var docs = await _unitOfWork.Documents.FindAsync(d => 
            d.Category == category && 
            d.WorkflowStatus == DocumentWorkflowStatus.Archived &&
            (d.IssuedAt ?? d.CreatedAt).Year == year &&
            !d.IsDeleted, cancellationToken);

        var stats = docs
            .GroupBy(d => (d.IssuedAt ?? d.CreatedAt).Month)
            .Select(g => new MonthlyStatisticsDto
            {
                Month = g.Key,
                Count = g.Count()
            })
            .OrderBy(s => s.Month)
            .ToList();

        // Fill in missing months
        var result = new List<MonthlyStatisticsDto>();
        for (int i = 1; i <= 12; i++)
        {
            var stat = stats.FirstOrDefault(s => s.Month == i);
            result.Add(stat ?? new MonthlyStatisticsDto { Month = i, Count = 0 });
        }

        return result;
    }

    public async Task<byte[]> ExportArchiveIncomingToExcelAsync(int year, CancellationToken cancellationToken = default)
    {
        var docs = await _unitOfWork.Documents.GetAllWithDetailsAsync(cancellationToken);
        var archiveDocs = docs.Where(d => 
            d.Category == DocumentCategory.Incoming && 
            d.WorkflowStatus == DocumentWorkflowStatus.Archived &&
            d.CreatedAt.Year == year &&
            !d.IsDeleted).ToList();

        using var workbook = new XLWorkbook();
        
        // Get base URL for hyperlinks from config or request
        string baseUrl = _configuration["EmailSettings:AppBaseUrl"] ?? "";
        if (string.IsNullOrEmpty(baseUrl))
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request != null)
            {
                baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
            }
        }

        // Define categorization logic based on AgencyType and Name
        Func<Document, int> getSheetIndex = d => {
            var type = d.IssuingAgency?.AgencyType?.ToLower() ?? "";
            var name = d.IssuingAgency?.Name?.ToLower() ?? "";
            
            // Sheet A: Trung ương, Bộ, Chính phủ
            if (type.Contains("trung ương") || type.Contains("bộ") || type.Contains("chính phủ")) return 0;
            
            // Sheet B: Sở Y tế
            if (type.Contains("sở y tế") || name.Contains("sở y tế")) return 1;
            
            // Sheet C: Các sở ban ngành khác
            return 2;
        };

        var sheetNames = new[] { "A - TRUNG ƯƠNG", "B - SỞ Y TẾ", "C - CÁC SỞ BAN NGÀNH" };
        
        for (int i = 0; i < sheetNames.Length; i++)
        {
            var sheetDocs = archiveDocs.Where(d => getSheetIndex(d) == i).ToList();
            var worksheet = workbook.Worksheets.Add(sheetNames[i]);
            
            // Styling base
            worksheet.Style.Font.FontName = "Times New Roman";
            worksheet.Style.Font.FontSize = 12;

            // 1. Title (Dòng số 1)
            var titleCell = worksheet.Cell(1, 1); 
            titleCell.Value = $"LƯU SỐ CÔNG VĂN ĐẾN NĂM {year}";
            titleCell.Style.Font.Bold = true;
            titleCell.Style.Font.FontSize = 14;
            titleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range(1, 1, 1, 7).Merge();

            // 2. Headers (Dòng số 2)
            string[] headers = { "STT", "Ngày đến", "Số hiệu", "Nội dung", "File đính kèm", "Nội dung chỉ đạo của giám đốc", "Báo cáo xử lý" };
            for (int h = 0; h < headers.Length; h++)
            {
                var cell = worksheet.Cell(2, h + 1);
                cell.Value = headers[h];
                cell.Style.Font.Bold = true;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9D9D9"); // Light Gray
            }

            // 3. Data grouped by month (Dòng số 3, 4, ...)
            int currentRow = 3;
            int globalStt = 1;

            // Group documents by month from 1 to 12
            for (int m = 1; m <= 12; m++)
            {
                var monthDocs = sheetDocs.Where(d => d.CreatedAt.Month == m).OrderBy(d => d.CreatedAt).ToList();
                if (!monthDocs.Any()) continue;

                // Month/Year separator row (Dòng số 3, or separator between months)
                var monthSeparatorRange = worksheet.Range(currentRow, 1, currentRow, 7);
                monthSeparatorRange.Merge();
                monthSeparatorRange.Value = $"THÁNG {m:00}/{year}";
                monthSeparatorRange.Style.Font.Bold = true;
                monthSeparatorRange.Style.Font.FontColor = XLColor.Red;
                monthSeparatorRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                monthSeparatorRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#E2EFDA"); // Light Green
                monthSeparatorRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                currentRow++;

                // Data rows (Dòng số 4 và tiếp theo)
                foreach (var doc in monthDocs)
                {
                    worksheet.Cell(currentRow, 1).Value = globalStt++;
                    worksheet.Cell(currentRow, 2).Value = doc.CreatedAt.ToString("dd/MM/yyyy");
                    worksheet.Cell(currentRow, 3).Value = doc.DocumentNumber;
                    worksheet.Cell(currentRow, 4).Value = doc.Title;
                    var fileCell = worksheet.Cell(currentRow, 5);
                    fileCell.Value = doc.FileName;
                    if (!string.IsNullOrEmpty(baseUrl) && !string.IsNullOrEmpty(doc.FileName))
                    {
                        fileCell.SetHyperlink(new XLHyperlink($"{baseUrl}/storage/hospital-documents/{doc.FilePath}"));
                        fileCell.Style.Font.FontColor = XLColor.Blue;
                        fileCell.Style.Font.Underline = XLFontUnderlineValues.Single;
                    }
                    worksheet.Cell(currentRow, 6).Value = doc.ProcessingInstructions;

                    // Fetch and bind assignment reports
                    var reportCell = worksheet.Cell(currentRow, 7);
                    var completedAssignments = doc.Assignments
                        .Where(a => !a.IsDeleted && !string.IsNullOrEmpty(a.ReportFilePath))
                        .ToList();

                    if (completedAssignments.Any())
                    {
                        var reportTexts = completedAssignments.Select(a => {
                            var deptOrUser = a.Department?.Name ?? a.AssignedTo?.FullName ?? "Hành chính";
                            return $"{deptOrUser}: {a.ReportFileName}";
                        });
                        reportCell.Value = string.Join(", ", reportTexts);

                        var firstReport = completedAssignments.First();
                        if (!string.IsNullOrEmpty(baseUrl))
                        {
                            reportCell.SetHyperlink(new XLHyperlink($"{baseUrl}/storage/hospital-documents/{firstReport.ReportFilePath}"));
                            reportCell.Style.Font.FontColor = XLColor.Blue;
                            reportCell.Style.Font.Underline = XLFontUnderlineValues.Single;
                        }
                    }
                    else
                    {
                        reportCell.Value = "";
                    }

                    // Borders and alignment
                    var dataRange = worksheet.Range(currentRow, 1, currentRow, 7);
                    dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                    dataRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                    dataRange.Style.Alignment.WrapText = true;

                    // Specific alignments
                    worksheet.Cell(currentRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    currentRow++;
                }
            }

            // Set Column Widths
            worksheet.Column(1).Width = 6;   // STT
            worksheet.Column(2).Width = 14;  // Ngày đến
            worksheet.Column(3).Width = 18;  // Số hiệu
            worksheet.Column(4).Width = 55;  // Nội dung (Tiêu đề)
            worksheet.Column(5).Width = 25;  // File đính kèm
            worksheet.Column(6).Width = 45;  // Nội dung chỉ đạo
            worksheet.Column(7).Width = 35;  // Báo cáo xử lý
            
            worksheet.Rows().AdjustToContents();
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportArchiveOutgoingToExcelAsync(int year, CancellationToken cancellationToken = default)
    {
        var docs = await _unitOfWork.Documents.GetAllWithDetailsAsync(cancellationToken);
        var outgoingDocs = docs.Where(d => 
            d.Category == DocumentCategory.Outgoing && 
            d.WorkflowStatus == DocumentWorkflowStatus.Archived &&
            (d.IssuedAt ?? d.CreatedAt).Year == year &&
            !d.IsDeleted).ToList();

        using var workbook = new XLWorkbook();
        
        // Define sheet mapping logic
        Func<Document, int> getSheetIndex = d => {
            return d.DocumentType switch
            {
                DocumentType.Decision => 0, // QUYẾT ĐỊNH
                DocumentType.Directive or DocumentType.Notification or DocumentType.Report => 1, // CÔNG VĂN + THÔNG BÁO + BÁO CÁO
                DocumentType.Authorization => 2, // GIẤY ỦY QUYỀN
                DocumentType.Plan => 3, // KẾ HOẠCH
                DocumentType.IntroductionLetter => 4, // GIẤY GIỚI THIỆU
                DocumentType.Contract or DocumentType.Minutes => 5, // SỐ HỢP ĐỒNG + BIÊN BẢN
                DocumentType.WorkCertificate => 6, // GXN CÔNG TÁC + HÀNH NGHỀ
                DocumentType.AdminRecord or _ => 7, // SỐ PHÒNG HCNS (Default to last sheet)
            };
        };

        var sheetNames = new[] { 
            "QUYẾT ĐỊNH", 
            "CÔNG VĂN - TB - BC", 
            "GIẤY ỦY QUYỀN", 
            "KẾ HOẠCH", 
            "GIẤY GIỚI THIỆU", 
            "HỢP ĐỒNG - BIÊN BẢN", 
            "GXN CÔNG TÁC - HÀNH NGHỀ", 
            "SỐ PHÒNG HCNS" 
        };

        // Get base URL for hyperlinks
        string baseUrl = _configuration["EmailSettings:AppBaseUrl"] ?? "";
        if (string.IsNullOrEmpty(baseUrl))
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request != null)
            {
                baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
            }
        }

        for (int i = 0; i < sheetNames.Length; i++)
        {
            var sheetDocs = outgoingDocs.Where(d => getSheetIndex(d) == i).ToList();
            if (i == 7) // Last sheet also catch everything else just in case
            {
                var processedIds = outgoingDocs.Where(d => getSheetIndex(d) < 7).Select(d => d.Id).ToHashSet();
                sheetDocs = outgoingDocs.Where(d => !processedIds.Contains(d.Id)).ToList();
            }

            var worksheet = workbook.Worksheets.Add(sheetNames[i]);
            
            // Styling base
            worksheet.Style.Font.FontName = "Times New Roman";
            worksheet.Style.Font.FontSize = 12;

            // 1. Title (Dòng số 1)
            var titleCell = worksheet.Cell(1, 1); 
            titleCell.Value = $"SỔ CÔNG VĂN {sheetNames[i]} NĂM {year}";
            titleCell.Style.Font.Bold = true;
            titleCell.Style.Font.FontSize = 14;
            titleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range(1, 1, 1, 7).Merge();

            // 2. Headers (Dòng số 2)
            string[] headers = { "STT", "SỐ HIỆU", "NỘI DUNG TRÍCH YẾU VĂN BẢN", "NGƯỜI SOẠN", "NGƯỜI KÝ", "FILE ĐÍNH KÈM", "GHI CHÚ" };
            for (int h = 0; h < headers.Length; h++)
            {
                var cell = worksheet.Cell(2, h + 1);
                cell.Value = headers[h];
                cell.Style.Font.Bold = true;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9D9D9");
            }

            // 3. Data grouped by month
            int currentRow = 3;
            int globalStt = 1;

            for (int m = 1; m <= 12; m++)
            {
                var monthDocs = sheetDocs
                    .Where(d => (d.IssuedAt ?? d.CreatedAt).Month == m)
                    .OrderBy(d => d.IssuedAt ?? d.CreatedAt)
                    .ToList();
                    
                if (!monthDocs.Any()) continue;

                // Month separator row
                var monthSeparatorRange = worksheet.Range(currentRow, 1, currentRow, 7);
                monthSeparatorRange.Merge();
                monthSeparatorRange.Value = $"THÁNG {m:00}/{year}";
                monthSeparatorRange.Style.Font.Bold = true;
                monthSeparatorRange.Style.Font.FontColor = XLColor.Red;
                monthSeparatorRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                monthSeparatorRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#E2EFDA");
                monthSeparatorRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                currentRow++;

                foreach (var doc in monthDocs)
                {
                    worksheet.Cell(currentRow, 1).Value = globalStt++;
                    worksheet.Cell(currentRow, 2).Value = doc.DocumentNumber;
                    worksheet.Cell(currentRow, 3).Value = doc.Title;
                    worksheet.Cell(currentRow, 4).Value = doc.CreatedBy?.FullName ?? "N/A";
                    worksheet.Cell(currentRow, 5).Value = "";
                    
                    var fileCell = worksheet.Cell(currentRow, 6);
                    fileCell.Value = doc.FileName;
                    if (!string.IsNullOrEmpty(baseUrl) && !string.IsNullOrEmpty(doc.FileName))
                    {
                        fileCell.SetHyperlink(new XLHyperlink($"{baseUrl}/storage/hospital-documents/{doc.FilePath}"));
                        fileCell.Style.Font.FontColor = XLColor.Blue;
                        fileCell.Style.Font.Underline = XLFontUnderlineValues.Single;
                    }
                    
                    worksheet.Cell(currentRow, 7).Value = "";

                    var dataRange = worksheet.Range(currentRow, 1, currentRow, 7);
                    dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                    dataRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                    dataRange.Style.Alignment.WrapText = true;

                    worksheet.Cell(currentRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell(currentRow, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    currentRow++;
                }
            }

            // Set Column Widths
            worksheet.Column(1).Width = 6;
            worksheet.Column(2).Width = 18;
            worksheet.Column(3).Width = 55;
            worksheet.Column(4).Width = 20;
            worksheet.Column(5).Width = 20;
            worksheet.Column(6).Width = 25;
            worksheet.Column(7).Width = 20;
            
            worksheet.Rows().AdjustToContents();
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}