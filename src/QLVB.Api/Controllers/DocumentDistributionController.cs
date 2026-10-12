using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.DTOs.Documents;
using QLVB.Application.Services;
using QLVB.Domain.Constants;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/document-distribution")]
[Authorize]
public class DocumentDistributionController : ControllerBase
{
    private readonly IDocumentDistributionService _distributionService;

    public DocumentDistributionController(IDocumentDistributionService distributionService)
    {
        _distributionService = distributionService;
    }

    /// <summary>
    /// Văn thư phát hành văn bản (nội bộ hoặc ra ngoài).
    /// Trạng thái văn bản chuyển từ Issued → Sent.
    /// </summary>
    [HttpPost("{documentId}/publish")]
    [Authorize(Policy = CustomPermissions.Outgoing.Publish)]
    public async Task<ActionResult<IEnumerable<DocumentDistributionDto>>> Publish(
        Guid documentId, [FromBody] PublishDocumentDto dto)
    {
        try
        {
            var result = await _distributionService.PublishAsync(documentId, dto, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Văn thư xác nhận đối tác bên ngoài đã nhận văn bản.
    /// </summary>
    [HttpPut("{distributionId}/confirm-external")]
    [Authorize(Policy = CustomPermissions.Outgoing.Publish)]
    public async Task<ActionResult<DocumentDistributionDto>> ConfirmExternalReceipt(
        Guid distributionId, [FromBody] ConfirmExternalReceiptDto dto)
    {
        try
        {
            var result = await _distributionService.ConfirmExternalReceiptAsync(distributionId, dto, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Trưởng khoa cập nhật trạng thái xử lý văn bản nội bộ.
    /// </summary>
    [HttpPut("{distributionId}/status")]
    [Authorize(Policy = CustomPermissions.Outgoing.Review)]
    public async Task<ActionResult<DocumentDistributionDto>> UpdateStatus(
        Guid distributionId, [FromBody] UpdateDistributionStatusDto dto)
    {
        try
        {
            var result = await _distributionService.UpdateStatusAsync(distributionId, dto, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Trưởng khoa/nhân viên nộp file báo cáo kết quả thực hiện.
    /// </summary>
    [HttpPost("{distributionId}/report")]
    [Authorize(Policy = CustomPermissions.Outgoing.Review)]
    public async Task<ActionResult<DocumentDistributionDto>> UploadReport(
        Guid distributionId, IFormFile reportFile, [FromForm] string? notes)
    {
        try
        {
            var result = await _distributionService.UploadReportAsync(distributionId, reportFile, notes, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách phát hành của một văn bản.
    /// </summary>
    [HttpGet("{documentId}/list")]
    public async Task<ActionResult<IEnumerable<DocumentDistributionDto>>> GetList(Guid documentId)
    {
        var result = await _distributionService.GetByDocumentIdAsync(documentId);
        return Ok(result);
    }

    /// <summary>
    /// Tải xuống file báo cáo kết quả thực hiện.
    /// </summary>
    [HttpGet("{distributionId}/report/download")]
    public async Task<IActionResult> DownloadReport(Guid distributionId)
    {
        try
        {
            var (content, contentType, fileName) = await _distributionService.GetReportFileAsync(distributionId);
            return File(content, contentType, fileName);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
