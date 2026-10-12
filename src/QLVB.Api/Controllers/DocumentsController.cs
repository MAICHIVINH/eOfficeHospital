using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.DTOs.Documents;
using QLVB.Application.Services;
using QLVB.Domain.Constants;
using QLVB.Domain.Enums;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = CustomPermissions.Documents.View)]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost]
    [Authorize(Policy = CustomPermissions.Documents.Upload)]
    public async Task<ActionResult<DocumentDto>> UploadDocument([FromForm] CreateDocumentDto dto, IFormFile file)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        try
        {
            var result = await _documentService.UploadDocumentAsync(dto, file, userId);
            return CreatedAtAction(nameof(GetDocument), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetDocuments([FromQuery] DocumentFilterDto filter)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var departmentId = GetDepartmentId();
        var (items, totalCount) = await _documentService.GetDocumentsAsync(userId, role, departmentId, filter);
        
        return Ok(new
        {
            items,
            totalCount,
            pageNumber = filter.PageNumber,
            pageSize = filter.PageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentDto>> GetDocument(Guid id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var departmentId = GetDepartmentId();

        var document = await _documentService.GetDocumentByIdAsync(id, userId, role, departmentId);

        if (document == null)
            return NotFound();

        return Ok(document);
    }

    [HttpGet("{id}/preview")]
    public async Task<ActionResult<object>> GetPreviewUrl(Guid id)
    {
        var userId = GetUserId();

        try
        {
            var url = await _documentService.GetPreviewUrlAsync(id, userId);
            return Ok(new { url });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/download")]
    public async Task<ActionResult<object>> DownloadDocument(Guid id)
    {
        var userId = GetUserId();

        try
        {
            var url = await _documentService.GetPreviewUrlAsync(id, userId);
            return Ok(new { url });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/assign")]
    [Authorize(Policy = CustomPermissions.Documents.Assign)]
    public async Task<IActionResult> AssignDocument(Guid id, [FromBody] AssignDocumentBody body)
    {
        var userId = GetUserId();

        var dto = new AssignDocumentDto
        {
            DocumentId = id,
            ProcessingDeadline = body.ProcessingDeadline,
            Assignments = body.Assignments ?? new List<DepartmentAssignmentDto>()
        };

        try
        {
            await _documentService.AssignDocumentAsync(dto, userId);
            return Ok(new { message = "Phân công văn bản thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DocumentDto>> UpdateDocument(Guid id, [FromForm] UpdateDocumentDto dto, IFormFile? file)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        if (userId == Guid.Empty)
            return Unauthorized();

        try
        {
            var result = await _documentService.UpdateDocumentAsync(id, dto, userId, role, file);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        if (userId == Guid.Empty)
            return Unauthorized();

        try
        {
            await _documentService.DeleteDocumentAsync(id, userId, role);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<object>> GetStatistics()
    {
        var stats = await _documentService.GetSystemStatisticsAsync();
        return Ok(stats);
    }

    [HttpGet("export/incoming")]
    public async Task<IActionResult> ExportIncomingToExcel([FromQuery] DocumentFilterDto filter)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var departmentId = GetDepartmentId();

        var bytes = await _documentService.ExportIncomingToExcelAsync(userId, role, departmentId, filter);
        
        var fileName = $"So_VanBanDen_{DateTime.Now:yyyyMMdd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("export/outgoing")]
    public async Task<IActionResult> ExportOutgoingToExcel([FromQuery] DocumentFilterDto filter)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var departmentId = GetDepartmentId();

        var bytes = await _documentService.ExportOutgoingToExcelAsync(userId, role, departmentId, filter);
        
        var fileName = $"So_VanBanDi_{DateTime.Now:yyyyMMdd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("archive/statistics")]
    public async Task<ActionResult<List<MonthlyStatisticsDto>>> GetArchiveStatistics([FromQuery] int year, [FromQuery] DocumentCategory category)
    {
        var stats = await _documentService.GetMonthlyArchiveStatisticsAsync(year, category);
        return Ok(stats);
    }

    [HttpGet("archive/export")]
    public async Task<IActionResult> ExportArchiveToExcel([FromQuery] int year)
    {
        var bytes = await _documentService.ExportArchiveIncomingToExcelAsync(year);
        var fileName = $"Kho_VanBanDen_{year}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("archive/outgoing/export")]
    public async Task<IActionResult> ExportArchiveOutgoingToExcel([FromQuery] int year)
    {
        var bytes = await _documentService.ExportArchiveOutgoingToExcelAsync(year);
        var fileName = $"Kho_VanBanDi_{year}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    private string GetUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        return roleClaim ?? "STAFF"; // Default to STAFF if no role claim
    }

    private Guid? GetDepartmentId()
    {
        var deptClaim = User.FindFirst("DepartmentId")?.Value;
        return Guid.TryParse(deptClaim, out var deptId) ? deptId : null;
    }
}
