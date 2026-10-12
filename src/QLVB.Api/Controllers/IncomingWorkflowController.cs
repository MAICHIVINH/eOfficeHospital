using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.DTOs.Documents;
using QLVB.Application.Services;
using QLVB.Domain.Constants;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/incoming-workflow")]
[Authorize]
public class IncomingWorkflowController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public IncomingWorkflowController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost("{id}/approve")]
    [Authorize(Policy = CustomPermissions.Documents.Approve)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] WorkflowTransitionDto dto)
    {
        dto.DocumentId = id;
        var userId = GetUserId();
        
        try
        {
            await _documentService.ApproveIncomingDocumentAsync(dto, userId);
            return Ok(new { message = "Đã duyệt văn bản đến thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    [Authorize(Policy = CustomPermissions.Documents.Reject)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectDocumentDto dto)
    {
        dto.DocumentId = id;
        var userId = GetUserId();
        
        try
        {
            await _documentService.RejectIncomingDocumentAsync(dto, userId);
            return Ok(new { message = "Đã từ chối văn bản đến" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/archive")]
    [Authorize(Policy = CustomPermissions.Documents.Archive)]
    public async Task<IActionResult> Archive(Guid id, [FromBody] WorkflowTransitionDto dto)
    {
        dto.DocumentId = id;
        var userId = GetUserId();

        try
        {
            await _documentService.ArchiveIncomingDocumentAsync(dto, userId);
            return Ok(new { message = "Đã lưu trữ văn bản đến thành công" });
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
