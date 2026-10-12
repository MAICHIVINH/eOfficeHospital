using QLVB.Application.DTOs.Documents;
using Microsoft.AspNetCore.Http;

namespace QLVB.Application.Services;

public interface IDocumentDistributionService
{
    /// <summary>
    /// Phát hành văn bản (nội bộ hoặc ra ngoài).
    /// Chuyển trạng thái document từ Issued → Sent.
    /// </summary>
    Task<IEnumerable<DocumentDistributionDto>> PublishAsync(Guid documentId, PublishDocumentDto dto, Guid clerkId);

    /// <summary>
    /// Văn thư xác nhận đối tác bên ngoài đã nhận văn bản.
    /// </summary>
    Task<DocumentDistributionDto> ConfirmExternalReceiptAsync(Guid distributionId, ConfirmExternalReceiptDto dto, Guid clerkId);

    /// <summary>
    /// Trưởng khoa/nhân viên cập nhật trạng thái xử lý văn bản nội bộ.
    /// (Đã nhận / Đang triển khai / Hoàn thành)
    /// </summary>
    Task<DocumentDistributionDto> UpdateStatusAsync(Guid distributionId, UpdateDistributionStatusDto dto, Guid userId);

    /// <summary>
    /// Trưởng khoa nộp file báo cáo kết quả
    /// </summary>
    Task<DocumentDistributionDto> UploadReportAsync(Guid distributionId, IFormFile reportFile, string? notes, Guid userId);

    /// <summary>
    /// Lấy danh sách tất cả bản ghi phát hành của một văn bản
    /// </summary>
    Task<IEnumerable<DocumentDistributionDto>> GetByDocumentIdAsync(Guid documentId);

    /// <summary>
    /// Tải xuống file báo cáo của bản ghi phát hành
    /// </summary>
    Task<(byte[] content, string contentType, string fileName)> GetReportFileAsync(Guid distributionId);
}
