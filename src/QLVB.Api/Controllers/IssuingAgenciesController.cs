using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.DTOs.IssuingAgencies;
using QLVB.Application.Services;
using QLVB.Domain.Constants;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IssuingAgenciesController : ControllerBase
{
    private readonly IIssuingAgencyService _issuingAgencyService;
    private readonly IUnitOfWork _unitOfWork;

    public IssuingAgenciesController(IIssuingAgencyService issuingAgencyService, IUnitOfWork unitOfWork)
    {
        _issuingAgencyService = issuingAgencyService;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy danh sách cơ quan ban hành
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IssuingAgencyDto>>> GetIssuingAgencies([FromQuery] bool activeOnly = false)
    {
        // View permission check
        if (!User.HasClaim("Permission", CustomPermissions.IssuingAgencies.View) && 
            !User.HasClaim("Permission", CustomPermissions.Documents.Create))
        {
            return Forbid();
        }

        var agencies = await _issuingAgencyService.GetAllAsync(activeOnly);
        return Ok(agencies);
    }

    /// <summary>
    /// Lấy thông tin chi tiết cơ quan ban hành
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Policy = CustomPermissions.IssuingAgencies.View)]
    public async Task<ActionResult<IssuingAgencyDto>> GetIssuingAgency(Guid id)
    {
        var agency = await _issuingAgencyService.GetByIdAsync(id);
        if (agency == null) return NotFound();
        return Ok(agency);
    }

    /// <summary>
    /// Tạo mới cơ quan ban hành
    /// </summary>
    [HttpPost]
    [Authorize(Policy = CustomPermissions.IssuingAgencies.Create)]
    public async Task<ActionResult<IssuingAgencyDto>> CreateIssuingAgency([FromBody] CreateIssuingAgencyDto dto)
    {
        try
        {
            var agency = await _issuingAgencyService.CreateAsync(dto);

            // Log action
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.CreateIssuingAgency,
                Details = $"Đã tạo cơ quan ban hành: {agency.Name} ({agency.Code})",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIssuingAgency), new { id = agency.Id }, agency);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật cơ quan ban hành
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = CustomPermissions.IssuingAgencies.Edit)]
    public async Task<IActionResult> UpdateIssuingAgency(Guid id, [FromBody] UpdateIssuingAgencyDto dto)
    {
        try
        {
            var agency = await _issuingAgencyService.UpdateAsync(id, dto);

            // Log action
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.UpdateIssuingAgency,
                Details = $"Đã cập nhật cơ quan ban hành: {agency.Name} ({agency.Code})",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();

            return Ok(agency);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa cơ quan ban hành (Soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = CustomPermissions.IssuingAgencies.Delete)]
    public async Task<IActionResult> DeleteIssuingAgency(Guid id)
    {
        try
        {
            var agency = await _issuingAgencyService.GetByIdAsync(id);
            if (agency == null) return NotFound();

            await _issuingAgencyService.DeleteAsync(id);

            // Log action
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.DeleteIssuingAgency,
                Details = $"Đã xóa cơ quan ban hành: {agency.Name}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
