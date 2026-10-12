using System.Linq;
using Microsoft.AspNetCore.Http;
using QLVB.Application.DTOs.Documents;
using QLVB.Domain.Constants;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Storage;
using QLVB.Infrastructure.Services;

namespace QLVB.Application.Services;

public class OutgoingDocumentService : IOutgoingDocumentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStorageService _storageService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly INotificationService _notificationService;
    private readonly IPdfService _pdfService;
    private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50MB

    public OutgoingDocumentService(
        IUnitOfWork unitOfWork, 
        IStorageService storageService, 
        IHttpContextAccessor httpContextAccessor,
        INotificationService notificationService,
        IPdfService pdfService)
    {
        _unitOfWork = unitOfWork;
        _storageService = storageService;
        _httpContextAccessor = httpContextAccessor;
        _notificationService = notificationService;
        _pdfService = pdfService;
    }

    public async Task<DocumentDto> AssignDraftingAsync(AssignDraftingDto dto, Guid managerId)
    {
        var manager = await _unitOfWork.Users.GetByIdAsync(managerId);
        if (manager == null) throw new ArgumentException("Không tìm thấy thông tin quản lý");

        var assignedUser = await _unitOfWork.Users.GetByIdAsync(dto.AssignedToUserId);
        if (assignedUser == null) throw new ArgumentException("Không tìm thấy thông tin nhân viên được phân công");

        // Security check: Manager can only assign to users in their department
        if (manager.Role?.Code == "MANAGER" && manager.DepartmentId != assignedUser.DepartmentId)
        {
            throw new ArgumentException("Bạn chỉ có thể phân công cho nhân viên trong cùng khoa/phòng");
        }

        var document = new Document
        {
            Title = dto.Title,
            Description = dto.Description,
            DocumentType = dto.DocumentType,
            SecurityLevel = dto.SecurityLevel,
            CreatedById = dto.AssignedToUserId, // The assigned person will be the 'creator' of the draft
            Category = DocumentCategory.Outgoing,
            WorkflowStatus = DocumentWorkflowStatus.PendingDraft,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Documents.AddAsync(document);
        
        // Create an assignment record
        var assignment = new DocumentAssignment
        {
            DocumentId = document.Id,
            AssignedToUserId = dto.AssignedToUserId,
            AssignedById = managerId,
            AssignedRole = AssignmentRole.Main,
            Notes = dto.Notes,
            Deadline = dto.Deadline?.ToUniversalTime(),
            Status = AssignmentStatus.Pending,
            AssignedAt = DateTime.UtcNow
        };
        await _unitOfWork.DocumentAssignments.AddAsync(assignment);
        await _unitOfWork.SaveChangesAsync();

        await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
        {
            UserId = dto.AssignedToUserId,
            Title = "Yêu cầu soạn thảo văn bản",
            Message = $"Bạn đã được phân công soạn thảo văn bản: {document.Title}. Hạn xử lý: {dto.Deadline:dd/MM/yyyy}",
            Type = Domain.Enums.NotificationType.NewAssignment,
            Link = $"/outgoing-documents/view/{document.Id}",
            DocumentId = document.Id
        });

        await LogActionAsync(managerId, document.Id, AuditAction.Assign, $"Đã phân công soạn thảo cho nhân viên. Hạn: {dto.Deadline:dd/MM/yyyy}");

        return MapToDto(document);
    }

    public async Task<DocumentDto> CreateDraftAsync(CreateDocumentDto dto, IFormFile? file, Guid creatorId)
    {
        Document? document = null;
        bool isAssignmentUpdate = false;
        
        if (dto.DocumentId.HasValue)
        {
            document = await _unitOfWork.Documents.GetByIdAsync(dto.DocumentId.Value);
            if (document == null) throw new ArgumentException("Không tìm thấy văn bản được phân công");
            
            // Update document info if it was just a shell
            document.Title = dto.Title;
            document.Description = dto.Description;
            document.DocumentType = dto.DocumentType;
            document.SecurityLevel = dto.SecurityLevel;
            isAssignmentUpdate = true;
        }
        else
        {
            // If it's an update to a pending assignment searched by title (fallback)
            var existingDoc = await _unitOfWork.Documents.FindAsync(d => 
                d.Title == dto.Title && 
                d.CreatedById == creatorId && 
                d.WorkflowStatus == DocumentWorkflowStatus.PendingDraft);
            
            if (existingDoc.Any())
            {
                document = existingDoc.First();
                isAssignmentUpdate = true;
            }
            else
            {
                document = new Document
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    DocumentType = dto.DocumentType,
                    SecurityLevel = dto.SecurityLevel,
                    CreatedById = creatorId,
                    Category = DocumentCategory.Outgoing,
                    CreatedAt = DateTime.UtcNow
                };
            }
        }

        string filePath;
        string fileName;
        long fileSize;
        string contentType;

        if (file != null && file.Length > 0)
        {
            fileName = file.FileName;
            fileSize = file.Length;
            contentType = file.ContentType;

            using (var stream = file.OpenReadStream())
            {
                filePath = await _storageService.UploadFileAsync(stream, fileName, contentType);
            }
        }
        else if (!string.IsNullOrWhiteSpace(dto.Content))
        {
            fileName = $"{dto.Title.Replace(" ", "_")}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
            contentType = "application/pdf";

            var pdfBytes = await _pdfService.GeneratePdfFromHtmlAsync(dto.Content);
            fileSize = pdfBytes.Length;

            using (var stream = new MemoryStream(pdfBytes))
            {
                filePath = await _storageService.UploadFileAsync(stream, fileName, contentType);
            }
        }
        else
        {
            throw new ArgumentException("Cần có file đính kèm hoặc nội dung soạn thảo");
        }

        document.FilePath = filePath;
        document.FileName = fileName;
        document.FileSize = fileSize;
        document.Content = dto.Content;
        document.UpdatedAt = DateTime.UtcNow;

        var creator = await _unitOfWork.Users.GetByIdAsync(creatorId);
        var isManagerOrDirector = creator?.Role?.Code == "MANAGER" || creator?.Role?.Code == "DIRECTOR";
        var nextStatus = isManagerOrDirector ? DocumentWorkflowStatus.UnitReviewed : DocumentWorkflowStatus.Draft;
        document.WorkflowStatus = nextStatus;

        if (isAssignmentUpdate)
        {
            _unitOfWork.Documents.Update(document);
        }
        else
        {
            await _unitOfWork.Documents.AddAsync(document);
        }

        await _unitOfWork.SaveChangesAsync();

        if (nextStatus == DocumentWorkflowStatus.Draft)
        {
            // Notify managers
            if (creator?.DepartmentId != null)
            {
                var managers = await _unitOfWork.Users.GetUsersByRoleAsync("MANAGER");
                foreach (var manager in managers)
                {
                    if (manager.DepartmentId == creator.DepartmentId)
                    {
                        await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
                        {
                            UserId = manager.Id,
                            Title = "Văn bản mới chờ duyệt",
                            Message = $"Nhân viên {creator.FullName} vừa soạn thảo văn bản mới: {document.Title}",
                            Type = Domain.Enums.NotificationType.General,
                            Link = $"/outgoing-documents/view/{document.Id}",
                            DocumentId = document.Id
                        });
                    }
                }
            }
        }
        else // UnitReviewed - notify Clerks for format check
        {
            var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
            foreach (var clerk in clerks)
            {
                await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
                {
                    UserId = clerk.Id,
                    Title = "Văn bản chờ kiểm tra thể thức",
                    Message = $"Văn bản '{document.Title}' đã được duyệt nội dung và đang chờ bạn kiểm tra thể thức.",
                    Type = Domain.Enums.NotificationType.General,
                    Link = $"/outgoing-documents/view/{document.Id}",
                    DocumentId = document.Id
                });
            }
        }

        await LogActionAsync(creatorId, document.Id, AuditAction.Upload, $"Đã hoàn thành soạn thảo văn bản: {document.Title} (Trạng thái: {nextStatus})");
        
        return MapToDto(document);
    }

    public async Task<DocumentDto> ReviewContentAsync(WorkflowTransitionDto dto, Guid managerId)
    {
        // Accept both Draft (manager bypasses opinion step) and PendingDepartmentOpinion (after majority agreed)
        var doc = await GetAndValidateAsync(dto.DocumentId,
            DocumentWorkflowStatus.Draft,
            DocumentWorkflowStatus.PendingDepartmentOpinion);

        // If coming from PendingDepartmentOpinion, check majority rule
        if (doc.WorkflowStatus == DocumentWorkflowStatus.PendingDepartmentOpinion)
        {
            var opinions = await _unitOfWork.DepartmentOpinions.FindAsync(o => o.DocumentId == dto.DocumentId);
            var opinionList = opinions.ToList();
            var total = opinionList.Count;
            var approved = opinionList.Count(o => o.Status == Domain.Enums.DepartmentOpinionStatus.Approved);
            if (total > 0 && approved <= total / 2)
            {
                throw new ArgumentException("Chưa đạt đa số phòng ban đồng ý. Không thể chuyển lên Văn thư.");
            }
        }

        doc.WorkflowStatus = DocumentWorkflowStatus.UnitReviewed;
        doc.UpdatedAt = DateTime.UtcNow;
        doc.RejectionReason = null;
        doc.RejectedById = null;
        doc.RejectedAt = null;
        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(managerId, doc.Id, AuditAction.Update, $"Đã duyệt nội dung (ký nháy): {dto.Comment}");

        // Notify Clerks
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        foreach (var clerk in clerks)
        {
            await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = clerk.Id,
                Title = "Văn bản chờ trình ký",
                Message = $"Văn bản '{doc.Title}' đã được Trưởng khoa ký nháy. Vui lòng in trình ký và cập nhật bản quét.",
                Type = Domain.Enums.NotificationType.General,
                Link = $"/outgoing-documents/view/{doc.Id}",
                DocumentId = doc.Id
            });
        }

        return MapToDto(doc);
    }

    public async Task<DocumentDto> SignDocumentAsync(WorkflowTransitionDto dto, Microsoft.AspNetCore.Http.IFormFile? scanFile, Guid userId)
    {
        var doc = await GetAndValidateAsync(dto.DocumentId, DocumentWorkflowStatus.UnitReviewed);
        
        // If there's a scan file, upload and update the document's file path
        if (scanFile != null)
        {
            var fileName = $"SIGNED_{doc.Id}_{scanFile.FileName}";
            using (var stream = scanFile.OpenReadStream())
            {
                doc.FilePath = await _storageService.UploadFileAsync(stream, fileName, scanFile.ContentType);
            }
        }

        doc.WorkflowStatus = DocumentWorkflowStatus.Signed;
        doc.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(userId, doc.Id, AuditAction.Update, $"Đã xác nhận ký duyệt (Cập nhật bản quét): {dto.Comment}");

        // Notify Clerk to register and issue
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        foreach (var clerk in clerks)
        {
            if (clerk.Id == userId) continue;
            await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = clerk.Id,
                Title = "Văn bản đã ký duyệt",
                Message = $"Văn bản '{doc.Title}' đã được cập nhật bản quét. Vui lòng cấp số và ban hành.",
                Type = Domain.Enums.NotificationType.General,
                Link = $"/outgoing-documents/view/{doc.Id}",
                DocumentId = doc.Id
            });
        }

        return MapToDto(doc);
    }


    public async Task<DocumentDto> IssueDocumentAsync(WorkflowTransitionDto dto, Guid clerkId)
    {
        if (string.IsNullOrWhiteSpace(dto.DocumentNumber))
            throw new ArgumentException("Cần có số văn bản để ban hành");

        // Check for duplicate document number
        bool exists = await _unitOfWork.Documents.AnyAsync(d => d.DocumentNumber == dto.DocumentNumber);
        if (exists)
            throw new ArgumentException($"Số hiệu văn bản '{dto.DocumentNumber}' đã tồn tại trong hệ thống.");

        var doc = await GetAndValidateAsync(dto.DocumentId, DocumentWorkflowStatus.Signed);
        doc.WorkflowStatus = DocumentWorkflowStatus.Issued;
        doc.DocumentNumber = dto.DocumentNumber;
        doc.IssuedById = clerkId;
        doc.IssuedAt = DateTime.UtcNow;
        doc.UpdatedAt = DateTime.UtcNow;

        // Clear rejection data on successful issue
        doc.RejectionReason = null;
        doc.RejectedById = null;
        doc.RejectedAt = null;

        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(clerkId, doc.Id, AuditAction.Update, $"Đã ban hành văn bản số {dto.DocumentNumber}: {dto.Comment}");

        // Notify document creator
        await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
        {
            UserId = doc.CreatedById,
            Title = "Văn bản đã được ban hành",
            Message = $"Văn bản '{doc.Title}' đã được cấp số {dto.DocumentNumber} và ban hành.",
            Type = Domain.Enums.NotificationType.DocumentIssued,
            Link = $"/outgoing-documents/view/{doc.Id}",
            DocumentId = doc.Id
        });

        return MapToDto(doc);
    }

    public async Task<DocumentDto> PublishDocumentAsync(WorkflowTransitionDto dto, Guid clerkId)
    {
        var doc = await GetAndValidateAsync(dto.DocumentId, DocumentWorkflowStatus.Issued);
        doc.WorkflowStatus = DocumentWorkflowStatus.Sent;
        doc.UpdatedAt = DateTime.UtcNow;

        // Clear rejection data
        doc.RejectionReason = null;
        doc.RejectedById = null;
        doc.RejectedAt = null;

        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(clerkId, doc.Id, AuditAction.Update, $"Đã phát hành văn bản: {dto.Comment}");

        // Broadcast notification to all active users for important document types
        if (doc.DocumentType == DocumentType.Notification || doc.DocumentType == DocumentType.Directive)
        {
            var allUsers = await _unitOfWork.Users.FindAsync(u => u.IsActive);
            foreach (var user in allUsers)
            {
                // Don't send to the publisher
                if (user.Id == clerkId) continue;

                await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
                {
                    UserId = user.Id,
                    Title = "Văn bản mới được phát hành",
                    Message = $"Văn bản '{doc.Title}' (Số {doc.DocumentNumber}) đã được phát hành. Vui lòng xem chi tiết.",
                    Type = Domain.Enums.NotificationType.DocumentPublished,
                    Link = $"/documents/view/{doc.Id}",
                    DocumentId = doc.Id
                });
            }
        }

        return MapToDto(doc);
    }

    public async Task<DocumentDto> ArchiveDocumentAsync(WorkflowTransitionDto dto, Guid userId)
        => await TransitionAsync(dto, userId, DocumentWorkflowStatus.Sent, DocumentWorkflowStatus.Archived, "Đã lưu trữ văn bản");

    public async Task<DocumentDto> RejectContentReviewAsync(RejectDocumentDto dto, Guid managerId)
    {
        if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            throw new ArgumentException("Cần có lý do từ chối");

        // Manager rejects when document is in Draft or PendingDepartmentOpinion status
        var doc = await GetAndValidateAsync(dto.DocumentId,
            DocumentWorkflowStatus.Draft,
            DocumentWorkflowStatus.PendingDepartmentOpinion);
        
        doc.RejectionReason = dto.RejectionReason;
        doc.RejectedById = managerId;
        doc.RejectedAt = DateTime.UtcNow;
        doc.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(managerId, doc.Id, AuditAction.Update, $"Từ chối duyệt nội dung: {dto.RejectionReason}");

        // Send real-time notification to document creator
        await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
        {
            UserId = doc.CreatedById,
            Title = "Văn bản bị từ chối",
            Message = $"Văn bản '{doc.Title}' đã bị từ chối duyệt nội dung. Lý do: {dto.RejectionReason}",
            Type = Domain.Enums.NotificationType.DocumentRejected,
            Link = $"/outgoing-documents/view/{doc.Id}",
            DocumentId = doc.Id
        });

        return MapToDto(doc);
    }

    public async Task<DocumentDto> RejectFormatCheckAsync(RejectDocumentDto dto, Guid clerkId)
    {
        if (string.IsNullOrWhiteSpace(dto.RejectionReason))
            throw new ArgumentException("Cần có lý do từ chối");

        // Clerk rejects when document is pending format check (UnitReviewed or Signed)
        var doc = await GetAndValidateAsync(dto.DocumentId, 
            DocumentWorkflowStatus.UnitReviewed, 
            DocumentWorkflowStatus.Signed);
        
        // Return to Draft status
        doc.WorkflowStatus = DocumentWorkflowStatus.Draft;
        doc.RejectionReason = dto.RejectionReason;
        doc.RejectedById = clerkId;
        doc.RejectedAt = DateTime.UtcNow;
        doc.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(clerkId, doc.Id, AuditAction.Update, $"Từ chối kiểm tra thể thức: {dto.RejectionReason}");

        // Send real-time notification to document creator
        await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
        {
            UserId = doc.CreatedById,
            Title = "Văn bản bị từ chối thể thức",
            Message = $"Văn bản '{doc.Title}' đã bị từ chối kiểm tra thể thức. Lý do: {dto.RejectionReason}",
            Type = Domain.Enums.NotificationType.DocumentRejected,
            Link = $"/outgoing-documents/view/{doc.Id}",
            DocumentId = doc.Id
        });

        return MapToDto(doc);
    }

    public async Task<IEnumerable<WorkflowHistoryDto>> GetWorkflowHistoryAsync(Guid documentId)
    {
        var logs = await _unitOfWork.AuditLogs.GetByDocumentIdAsync(documentId);
        return logs.Where(l => l.Action == AuditAction.Update || l.Action == AuditAction.Upload)
                   .Select(l => new WorkflowHistoryDto
                   {
                       Status = DocumentWorkflowStatus.Draft, // Simple mapping for now, should store status in audit log if needed
                       StatusDisplayName = l.Details ?? string.Empty,
                       ChangedAt = l.Timestamp,
                       ChangedById = l.UserId,
                       ChangedByName = l.User?.FullName ?? "Không rõ",
                       Comment = l.Details
                   });
    }

    public async Task<DocumentDto> RequestDepartmentOpinionsAsync(RequestDepartmentOpinionsDto dto, Guid managerId)
    {
        if (dto.DepartmentIds == null || dto.DepartmentIds.Count == 0)
            throw new ArgumentException("Cần chọn ít nhất một phòng ban để lấy ý kiến.");
        if (dto.Deadline <= DateTime.UtcNow)
            throw new ArgumentException("Thời hạn phải lớn hơn thời điểm hiện tại.");

        var doc = await GetAndValidateAsync(dto.DocumentId, DocumentWorkflowStatus.Draft);

        // Remove existing pending opinions for this document (in case of re-request)
        var existing = await _unitOfWork.DepartmentOpinions.FindAsync(o => o.DocumentId == dto.DocumentId);
        foreach (var old in existing)
            _unitOfWork.DepartmentOpinions.Remove(old);

        // Create new opinion requests
        foreach (var deptId in dto.DepartmentIds)
        {
            var dept = await _unitOfWork.Departments.GetByIdAsync(deptId);
            if (dept == null) continue;

            var opinion = new Domain.Entities.DepartmentOpinion
            {
                DocumentId = dto.DocumentId,
                DepartmentId = deptId,
                RequestedById = managerId,
                Status = Domain.Enums.DepartmentOpinionStatus.Pending,
                Deadline = dto.Deadline.ToUniversalTime(),
                RequestedAt = DateTime.UtcNow
            };
            await _unitOfWork.DepartmentOpinions.AddAsync(opinion);

            // Notify managers of each selected department
            var deptManagers = await _unitOfWork.Users.FindAsync(u =>
                u.DepartmentId == deptId && u.Role != null && u.Role.Code == "MANAGER" && u.IsActive);
            foreach (var deptManager in deptManagers)
            {
                await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
                {
                    UserId = deptManager.Id,
                    Title = "Yêu cầu lấy ý kiến văn bản",
                    Message = $"Phòng ban bạn được yêu cầu cho ý kiến về văn bản: '{doc.Title}'. Hạn phản hồi: {dto.Deadline:dd/MM/yyyy HH:mm}.",
                    Type = Domain.Enums.NotificationType.NewAssignment,
                    Link = $"/outgoing-documents/view/{dto.DocumentId}",
                    DocumentId = dto.DocumentId
                });
            }
        }

        doc.WorkflowStatus = DocumentWorkflowStatus.PendingDepartmentOpinion;
        doc.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(managerId, doc.Id, AuditAction.Update,
            $"Gửi yêu cầu lấy ý kiến {dto.DepartmentIds.Count} phòng ban. Hạn: {dto.Deadline:dd/MM/yyyy HH:mm}. Ghi chú: {dto.Note}");

        return MapToDto(doc);
    }

    public async Task<DepartmentOpinionDto> RespondDepartmentOpinionAsync(RespondDepartmentOpinionDto dto, Guid responderId)
    {
        var doc = await GetAndValidateAsync(dto.DocumentId, DocumentWorkflowStatus.PendingDepartmentOpinion);

        // Find the opinion for the responder's department
        var responder = await _unitOfWork.Users.GetByIdAsync(responderId)
            ?? throw new ArgumentException("Không tìm thấy thông tin người dùng.");
        if (responder.DepartmentId == null)
            throw new ArgumentException("Bạn không thuộc phòng ban nào để phản hồi ý kiến.");

        var opinions = await _unitOfWork.DepartmentOpinions.FindAsync(o =>
            o.DocumentId == dto.DocumentId && o.DepartmentId == responder.DepartmentId);
        var opinion = opinions.FirstOrDefault()
            ?? throw new ArgumentException("Phòng ban của bạn không được yêu cầu lấy ý kiến cho văn bản này.");

        if (opinion.Status != Domain.Enums.DepartmentOpinionStatus.Pending)
            throw new ArgumentException("Ý kiến của phòng ban đã được ghi nhận trước đó.");

        opinion.Status = dto.IsApproved
            ? Domain.Enums.DepartmentOpinionStatus.Approved
            : Domain.Enums.DepartmentOpinionStatus.Rejected;
        opinion.Comment = dto.Comment;
        opinion.RespondedById = responderId;
        opinion.RespondedAt = DateTime.UtcNow;
        _unitOfWork.DepartmentOpinions.Update(opinion);
        await _unitOfWork.SaveChangesAsync();

        // Log
        var statusText = dto.IsApproved ? "Đồng ý" : "Không đồng ý";
        await LogActionAsync(responderId, dto.DocumentId, AuditAction.Update,
            $"Phản hồi ý kiến phòng ban ({responder.Department?.Name ?? "N/A"}): {statusText}. {dto.Comment}");

        // Notify the requesting manager
        await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
        {
            UserId = opinion.RequestedById,
            Title = $"Phòng ban {responder.Department?.Name ?? ""} đã phản hồi ý kiến",
            Message = $"Văn bản '{doc.Title}': Phòng ban {responder.Department?.Name ?? ""} {statusText.ToLower()}. Ghi chú: {dto.Comment}",
            Type = Domain.Enums.NotificationType.General,
            Link = $"/outgoing-documents/view/{dto.DocumentId}",
            DocumentId = dto.DocumentId
        });

        return await MapOpinionToDto(opinion);
    }

    public async Task<IEnumerable<DepartmentOpinionDto>> GetDepartmentOpinionsAsync(Guid documentId)
    {
        var opinions = await _unitOfWork.DepartmentOpinions.FindAsync(o => o.DocumentId == documentId);
        var result = new List<DepartmentOpinionDto>();
        foreach (var o in opinions)
            result.Add(await MapOpinionToDto(o));
        return result;
    }

    private async Task<DepartmentOpinionDto> MapOpinionToDto(Domain.Entities.DepartmentOpinion o)
    {
        var dept = o.Department ?? await _unitOfWork.Departments.GetByIdAsync(o.DepartmentId);
        var requestedBy = o.RequestedBy ?? await _unitOfWork.Users.GetByIdAsync(o.RequestedById);
        User? respondedBy = null;
        if (o.RespondedById.HasValue)
            respondedBy = o.RespondedBy ?? await _unitOfWork.Users.GetByIdAsync(o.RespondedById.Value);

        return new DTOs.Documents.DepartmentOpinionDto
        {
            Id = o.Id,
            DepartmentId = o.DepartmentId,
            DepartmentName = dept?.Name ?? "N/A",
            RequestedByName = requestedBy?.FullName ?? "N/A",
            RespondedByName = respondedBy?.FullName,
            Status = o.Status.ToString(),
            Comment = o.Comment,
            Deadline = o.Deadline,
            RequestedAt = o.RequestedAt,
            RespondedAt = o.RespondedAt
        };
    }

    private async Task<DocumentDto> TransitionAsync(WorkflowTransitionDto dto, Guid userId, DocumentWorkflowStatus from, DocumentWorkflowStatus to, string actionPrefix)
    {
        var doc = await GetAndValidateAsync(dto.DocumentId, from);
        doc.WorkflowStatus = to;
        doc.UpdatedAt = DateTime.UtcNow;

        // Clear rejection data when moving forward in workflow
        doc.RejectionReason = null;
        doc.RejectedById = null;
        doc.RejectedAt = null;

        _unitOfWork.Documents.Update(doc);
        await _unitOfWork.SaveChangesAsync();
        await LogActionAsync(userId, doc.Id, AuditAction.Update, $"{actionPrefix}: {dto.Comment}");

        return MapToDto(doc);
    }

    private async Task<Document> GetAndValidateAsync(Guid id, params DocumentWorkflowStatus[] expectedStatuses)
    {
        var doc = await _unitOfWork.Documents.GetByIdAsync(id);
        if (doc == null) throw new ArgumentException("Không tìm thấy văn bản");
        if (doc.Category != DocumentCategory.Outgoing) throw new ArgumentException("Không phải là văn bản đi");
        if (expectedStatuses.Length > 0 && (!doc.WorkflowStatus.HasValue || !expectedStatuses.Contains(doc.WorkflowStatus.Value)))
        {
            throw new ArgumentException($"Trạng thái không hợp lệ. Hiện tại là {doc.WorkflowStatus}");
        }
        return doc;
    }

    private async Task LogActionAsync(Guid userId, Guid docId, AuditAction action, string details)
    {
        var auditLog = new AuditLog
        {
            UserId = userId,
            DocumentId = docId,
            Action = action,
            Details = details,
            IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();
    }

    private DocumentDto MapToDto(Document d)
    {
        return new DocumentDto
        {
            Id = d.Id,
            Title = d.Title,
            Description = d.Description,
            FileName = d.FileName,
            FileSize = d.FileSize,
            DocumentType = d.DocumentType.ToString(),
            DocumentTypeCode = d.DocumentType.GetAbbreviation(),
            SecurityLevel = d.SecurityLevel.ToString(),
            Category = d.Category.ToString(),
            WorkflowStatus = d.WorkflowStatus?.ToString(),
            DocumentNumber = d.DocumentNumber,
            CreatedById = d.CreatedById,
            CreatedByName = d.CreatedBy?.FullName ?? "Unknown",
            CreatedAt = d.CreatedAt,
            DepartmentId = d.CreatedBy?.DepartmentId,
            SignedByName = d.SignedBy?.FullName,
            SignedAt = d.SignedAt,
            IssuedByName = d.IssuedBy?.FullName,
            IssuedAt = d.IssuedAt,
            Content = d.Content,
            RejectionReason = d.RejectionReason,
            RejectedByName = d.RejectedBy?.FullName,
            RejectedAt = d.RejectedAt
        };
    }
}
