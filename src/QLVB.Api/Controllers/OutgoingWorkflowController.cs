 using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.DTOs.Documents;
using QLVB.Application.Services;
using QLVB.Domain.Constants;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/document-workflow")]
[Authorize]
public class OutgoingWorkflowController : ControllerBase
{
    private readonly IOutgoingDocumentService _workflowService;

    public OutgoingWorkflowController(IOutgoingDocumentService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpPost("assign")]
    [Authorize(Policy = CustomPermissions.Outgoing.Assign)]
    public async Task<ActionResult<DocumentDto>> AssignDrafting([FromBody] AssignDraftingDto dto)
    {
        try
        {
            var result = await _workflowService.AssignDraftingAsync(dto, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("draft")]
    [Authorize(Policy = CustomPermissions.Outgoing.Draft)]
    public async Task<ActionResult<DocumentDto>> CreateDraft([FromForm] CreateDocumentDto dto)
    {
        try
        {
            var result = await _workflowService.CreateDraftAsync(dto, dto.File, GetUserId());
            return CreatedAtAction("GetDocument", "Documents", new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Bước 1: Trưởng khoa duyệt nội dung bản thảo (ký nháy)
    /// </summary>
    [HttpPost("{id}/review-content")]
    [Authorize(Policy = CustomPermissions.Outgoing.Review)]
    public async Task<ActionResult<DocumentDto>> ReviewContent(Guid id, [FromBody] WorkflowTransitionDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.ReviewContentAsync(dto, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Bước 2: Văn thư in trình ký, scan và upload bản đã ký chính thức
    /// </summary>
    [HttpPost("{id}/sign")]
    [Authorize(Policy = CustomPermissions.Outgoing.CheckFormat)]
    public async Task<ActionResult<DocumentDto>> Sign(Guid id, [FromForm] WorkflowTransitionDto dto, Microsoft.AspNetCore.Http.IFormFile? scanFile)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.SignDocumentAsync(dto, scanFile, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Bước 3: Văn thư kiểm tra thể thức và cấp số văn bản
    /// </summary>
    [HttpPost("{id}/issue")]
    [Authorize(Policy = CustomPermissions.Outgoing.Issue)]
    public async Task<ActionResult<DocumentDto>> Issue(Guid id, [FromBody] WorkflowTransitionDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.IssueDocumentAsync(dto, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/publish")]
    [Authorize(Policy = CustomPermissions.Outgoing.Publish)]
    public async Task<ActionResult<DocumentDto>> Publish(Guid id, [FromBody] WorkflowTransitionDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.PublishDocumentAsync(dto, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/archive")]
    [Authorize(Policy = CustomPermissions.Outgoing.Archive)]
    public async Task<ActionResult<DocumentDto>> Archive(Guid id, [FromBody] WorkflowTransitionDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.ArchiveDocumentAsync(dto, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<WorkflowHistoryDto>>> GetHistory(Guid id)
    {
        return Ok(await _workflowService.GetWorkflowHistoryAsync(id));
    }

    /// <summary>
    /// Trưởng khoa từ chối bản thảo → trả về nhân viên soạn lại
    /// Áp dụng cho cả Draft và PendingDepartmentOpinion
    /// </summary>
    [HttpPost("{id}/reject-content")]
    [Authorize(Policy = CustomPermissions.Outgoing.Review)]
    public async Task<ActionResult<DocumentDto>> RejectContent(Guid id, [FromBody] RejectDocumentDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.RejectContentReviewAsync(dto, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Quản lý gửi yêu cầu lấy ý kiến các phòng ban (DRAFT → PENDING_DEPARTMENT_OPINION)
    /// </summary>
    [HttpPost("{id}/request-opinions")]
    [Authorize(Policy = CustomPermissions.Outgoing.Review)]
    public async Task<ActionResult<DocumentDto>> RequestOpinions(Guid id, [FromBody] RequestDepartmentOpinionsDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.RequestDepartmentOpinionsAsync(dto, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Trưởng phòng ban phản hồi ý kiến (Đồng ý / Không đồng ý)
    /// </summary>
    [HttpPost("{id}/respond-opinion")]
    [Authorize(Policy = CustomPermissions.Outgoing.Review)]
    public async Task<ActionResult<DepartmentOpinionDto>> RespondOpinion(Guid id, [FromBody] RespondDepartmentOpinionDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.RespondDepartmentOpinionAsync(dto, GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách ý kiến phòng ban của một văn bản
    /// </summary>
    [HttpGet("{id}/opinions")]
    public async Task<ActionResult<IEnumerable<DepartmentOpinionDto>>> GetOpinions(Guid id)
    {
        return Ok(await _workflowService.GetDepartmentOpinionsAsync(id));
    }


    /// <summary>
    /// Văn thư từ chối thể thức → trả về nhân viên soạn lại
    /// (Áp dụng khi: UnitReviewed hoặc Signed)
    /// </summary>
    [HttpPost("{id}/reject-format")]
    [Authorize(Policy = CustomPermissions.Outgoing.CheckFormat)]
    public async Task<ActionResult<DocumentDto>> RejectFormat(Guid id, [FromBody] RejectDocumentDto dto)
    {
        dto.DocumentId = id;
        try
        {
            return Ok(await _workflowService.RejectFormatCheckAsync(dto, GetUserId()));
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
