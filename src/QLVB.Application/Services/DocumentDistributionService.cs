using Microsoft.AspNetCore.Http;
using QLVB.Application.DTOs.Documents;
using QLVB.Application.DTOs.Notifications;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Storage;

namespace QLVB.Application.Services;

public class DocumentDistributionService : IDocumentDistributionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public DocumentDistributionService(
        IUnitOfWork unitOfWork,
        IStorageService storageService,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _storageService = storageService;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<DocumentDistributionDto>> PublishAsync(Guid documentId, PublishDocumentDto dto, Guid clerkId)
    {
        var doc = await _unitOfWork.Documents.GetByIdAsync(documentId)
            ?? throw new ArgumentException("Không tìm thấy văn bản");

        if (doc.WorkflowStatus != DocumentWorkflowStatus.Issued)
            throw new ArgumentException("Văn bản phải ở trạng thái 'Đã cấp số' trước khi phát hành");

        var distributions = new List<DocumentDistribution>();
        var sentAt = dto.SentAt ?? DateTime.UtcNow;

        if (dto.DistributionType == DistributionType.Internal)
        {
            if (dto.DepartmentIds == null || dto.DepartmentIds.Count == 0)
                throw new ArgumentException("Phải chọn ít nhất một khoa/phòng nhận");

            foreach (var deptId in dto.DepartmentIds)
            {
                var dept = await _unitOfWork.Departments.GetByIdAsync(deptId)
                    ?? throw new ArgumentException($"Không tìm thấy khoa/phòng với ID {deptId}");

                distributions.Add(new DocumentDistribution
                {
                    Id = Guid.NewGuid(),
                    DocumentId = documentId,
                    DistributionType = DistributionType.Internal,
                    DepartmentId = deptId,
                    Status = DistributionStatus.Sent,
                    SentAt = sentAt,
                    SentById = clerkId,
                    Notes = dto.Notes
                });
            }

            // Notify managers of each selected department
            foreach (var deptId in dto.DepartmentIds)
            {
                var managers = await _unitOfWork.Users.FindAsync(u =>
                    u.DepartmentId == deptId &&
                    u.Role != null && u.Role.Code == "MANAGER" &&
                    u.IsActive);

                foreach (var manager in managers)
                {
                    await _notificationService.CreateAndSendAsync(new CreateNotificationDto
                    {
                        UserId = manager.Id,
                        Title = "Văn bản nội bộ mới",
                        Message = $"Văn bản '{doc.Title}' (Số {doc.DocumentNumber}) đã được phát hành đến khoa của bạn. Vui lòng xem và xác nhận đã nhận.",
                        Type = NotificationType.General,
                        Link = $"/outgoing-documents/view/{doc.Id}",
                        DocumentId = doc.Id
                    });
                }
            }
        }
        else // External
        {
            if (string.IsNullOrWhiteSpace(dto.ExternalRecipientName))
                throw new ArgumentException("Phải nhập tên đơn vị/đối tác nhận");

            distributions.Add(new DocumentDistribution
            {
                Id = Guid.NewGuid(),
                DocumentId = documentId,
                DistributionType = DistributionType.External,
                ExternalRecipientName = dto.ExternalRecipientName,
                IsExternalReceived = false,
                SentAt = sentAt,
                SentById = clerkId,
                Notes = dto.Notes
            });
        }

        // Save all distribution records
        foreach (var dist in distributions)
            await _unitOfWork.DocumentDistributions.AddAsync(dist);

        // Update document status to Sent
        doc.WorkflowStatus = DocumentWorkflowStatus.Sent;
        doc.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Documents.Update(doc);

        await _unitOfWork.SaveChangesAsync();

        return distributions.Select(MapToDto);
    }

    public async Task<DocumentDistributionDto> ConfirmExternalReceiptAsync(Guid distributionId, ConfirmExternalReceiptDto dto, Guid clerkId)
    {
        var dist = await _unitOfWork.DocumentDistributions.GetByIdAsync(distributionId)
            ?? throw new ArgumentException("Không tìm thấy bản ghi phát hành");

        if (dist.DistributionType != DistributionType.External)
            throw new ArgumentException("Chỉ áp dụng cho phát hành ngoài");

        dist.IsExternalReceived = dto.IsReceived;
        dist.ExternalReceivedAt = dto.IsReceived ? (dto.ReceivedAt ?? DateTime.UtcNow) : null;
        if (dto.Notes != null) dist.Notes = dto.Notes;

        _unitOfWork.DocumentDistributions.Update(dist);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(dist);
    }

    public async Task<DocumentDistributionDto> UpdateStatusAsync(Guid distributionId, UpdateDistributionStatusDto dto, Guid userId)
    {
        var dist = await _unitOfWork.DocumentDistributions.GetByIdAsync(distributionId)
            ?? throw new ArgumentException("Không tìm thấy bản ghi phát hành");

        if (dist.DistributionType != DistributionType.Internal)
            throw new ArgumentException("Chỉ áp dụng cho phát hành nội bộ");

        dist.Status = dto.Status;
        if (dto.Notes != null) dist.Notes = dto.Notes;

        if (dto.Status == DistributionStatus.Received && dist.ReceivedAt == null)
            dist.ReceivedAt = DateTime.UtcNow;

        if (dto.Status == DistributionStatus.Completed && dist.CompletedAt == null)
            dist.CompletedAt = DateTime.UtcNow;

        _unitOfWork.DocumentDistributions.Update(dist);
        await _unitOfWork.SaveChangesAsync();

        // Notify Clerks about the status update
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        var doc = await _unitOfWork.Documents.GetByIdAsync(dist.DocumentId);
        var dept = dist.DepartmentId.HasValue 
            ? await _unitOfWork.Departments.GetByIdAsync(dist.DepartmentId.Value) 
            : null;

        string statusText = dto.Status switch {
            DistributionStatus.Received => "đã xác nhận nhận",
            DistributionStatus.InProgress => "đang triển khai",
            DistributionStatus.Completed => "đã hoàn thành",
            _ => "đã cập nhật trạng thái"
        };

        foreach (var clerk in clerks)
        {
            await _notificationService.CreateAndSendAsync(new CreateNotificationDto
            {
                UserId = clerk.Id,
                Title = "Cập nhật phát hành văn bản",
                Message = $"Khoa {dept?.Name ?? "N/A"} {statusText} văn bản '{doc?.Title}'",
                Type = NotificationType.General,
                Link = $"/outgoing-documents/view/{dist.DocumentId}",
                DocumentId = dist.DocumentId
            });
        }

        return MapToDto(dist);
    }

    public async Task<DocumentDistributionDto> UploadReportAsync(Guid distributionId, IFormFile reportFile, string? notes, Guid userId)
    {
        var dist = await _unitOfWork.DocumentDistributions.GetByIdAsync(distributionId)
            ?? throw new ArgumentException("Không tìm thấy bản ghi phát hành");

        if (dist.DistributionType != DistributionType.Internal)
            throw new ArgumentException("Chỉ áp dụng cho phát hành nội bộ");

        var fileName = $"REPORT_{distributionId}_{reportFile.FileName}";
        using var stream = reportFile.OpenReadStream();
        dist.ReportFilePath = await _storageService.UploadFileAsync(stream, fileName, reportFile.ContentType);
        dist.ReportFileName = reportFile.FileName;
        dist.ReportFileSize = reportFile.Length;

        // Auto-set to completed when report is uploaded
        dist.Status = DistributionStatus.Completed;
        if (dist.CompletedAt == null) dist.CompletedAt = DateTime.UtcNow;
        if (notes != null) dist.Notes = notes;

        _unitOfWork.DocumentDistributions.Update(dist);
        await _unitOfWork.SaveChangesAsync();

        // Notify Clerks about the report upload
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        var doc = await _unitOfWork.Documents.GetByIdAsync(dist.DocumentId);
        var dept = dist.DepartmentId.HasValue 
            ? await _unitOfWork.Departments.GetByIdAsync(dist.DepartmentId.Value) 
            : null;

        foreach (var clerk in clerks)
        {
            await _notificationService.CreateAndSendAsync(new CreateNotificationDto
            {
                UserId = clerk.Id,
                Title = "Báo cáo phát hành mới",
                Message = $"Khoa {dept?.Name ?? "N/A"} đã nộp báo cáo cho văn bản '{doc?.Title}'",
                Type = NotificationType.General,
                Link = $"/outgoing-documents/view/{dist.DocumentId}",
                DocumentId = dist.DocumentId
            });
        }

        return MapToDto(dist);
    }

    public async Task<IEnumerable<DocumentDistributionDto>> GetByDocumentIdAsync(Guid documentId)
    {
        var distributions = await _unitOfWork.DocumentDistributions.FindAsync(
            d => d.DocumentId == documentId);

        // Load navigation properties manually
        var result = new List<DocumentDistributionDto>();
        foreach (var d in distributions)
        {
            var dept = d.DepartmentId.HasValue
                ? await _unitOfWork.Departments.GetByIdAsync(d.DepartmentId.Value)
                : null;

            var sentBy = await _unitOfWork.Users.GetByIdAsync(d.SentById);

            result.Add(new DocumentDistributionDto
            {
                Id = d.Id,
                DocumentId = d.DocumentId,
                DistributionType = d.DistributionType.ToString(),
                DepartmentId = d.DepartmentId,
                DepartmentName = dept?.Name,
                Status = d.Status.ToString(),
                ReceivedAt = d.ReceivedAt,
                CompletedAt = d.CompletedAt,
                ReportFileName = d.ReportFileName,
                ReportFileSize = d.ReportFileSize,
                ExternalRecipientName = d.ExternalRecipientName,
                IsExternalReceived = d.IsExternalReceived,
                ExternalReceivedAt = d.ExternalReceivedAt,
                Notes = d.Notes,
                SentAt = d.SentAt,
                SentById = d.SentById,
                SentByName = sentBy?.FullName ?? "Không rõ"
            });
        }

        return result;
    }

    public async Task<(byte[] content, string contentType, string fileName)> GetReportFileAsync(Guid distributionId)
    {
        var dist = await _unitOfWork.DocumentDistributions.GetByIdAsync(distributionId)
            ?? throw new ArgumentException("Không tìm thấy bản ghi phát hành");

        if (string.IsNullOrEmpty(dist.ReportFilePath))
            throw new ArgumentException("Bản ghi này chưa có file báo cáo");

        var stream = await _storageService.GetFileStreamAsync(dist.ReportFilePath);
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);

        var contentType = "application/octet-stream";
        var ext = Path.GetExtension(dist.ReportFileName)?.ToLower();
        if (ext == ".pdf") contentType = "application/pdf";
        else if (ext == ".doc") contentType = "application/msword";
        else if (ext == ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (ext == ".xls") contentType = "application/vnd.ms-excel";
        else if (ext == ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        return (ms.ToArray(), contentType, dist.ReportFileName ?? "report.dat");
    }

    private static DocumentDistributionDto MapToDto(DocumentDistribution d) => new()
    {
        Id = d.Id,
        DocumentId = d.DocumentId,
        DistributionType = d.DistributionType.ToString(),
        DepartmentId = d.DepartmentId,
        DepartmentName = d.Department?.Name,
        Status = d.Status.ToString(),
        ReceivedAt = d.ReceivedAt,
        CompletedAt = d.CompletedAt,
        ReportFileName = d.ReportFileName,
        ReportFileSize = d.ReportFileSize,
        ExternalRecipientName = d.ExternalRecipientName,
        IsExternalReceived = d.IsExternalReceived,
        ExternalReceivedAt = d.ExternalReceivedAt,
        Notes = d.Notes,
        SentAt = d.SentAt,
        SentById = d.SentById,
        SentByName = d.SentBy?.FullName ?? "Không rõ"
    };
}
