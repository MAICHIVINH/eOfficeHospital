using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.Services;
using QLVB.Domain.Constants;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = CustomPermissions.Permissions.View)]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly IUnitOfWork _unitOfWork;

    public PermissionsController(IPermissionService permissionService, IUnitOfWork unitOfWork)
    {
        _permissionService = permissionService;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy danh sách tất cả permissions
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PermissionDto>>> GetPermissions()
    {
        var permissions = await _permissionService.GetPermissionsAsync();
        return Ok(permissions);
    }

    /// <summary>
    /// Lấy thông tin permission theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PermissionDto>> GetPermission(Guid id)
    {
        var permission = await _permissionService.GetPermissionByIdAsync(id);
        if (permission == null) return NotFound(new { message = "Không tìm thấy quyền" });
        return Ok(permission);
    }

    /// <summary>
    /// Tạo permission mới
    /// </summary>
    [HttpPost]
    [Authorize(Policy = CustomPermissions.Permissions.Create)]
    public async Task<ActionResult<PermissionDto>> CreatePermission([FromBody] CreatePermissionDto dto)
    {
        try
        {
            var permission = await _permissionService.CreatePermissionAsync(dto);
            
            // Log permission creation
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.CreatePermission,
                Details = $"Đã tạo quyền: {permission.Name} ({permission.Code})",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetPermission), new { id = permission.Id }, permission);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin permission
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = CustomPermissions.Permissions.Edit)]
    public async Task<IActionResult> UpdatePermission(Guid id, [FromBody] UpdatePermissionDto dto)
    {
        try
        {
            var permissionBeforeUpdate = await _permissionService.GetPermissionByIdAsync(id);
            await _permissionService.UpdatePermissionAsync(id, dto);
            
            // Log permission update
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.UpdatePermission,
                Details = $"Đã cập nhật quyền: {permissionBeforeUpdate?.Name} → {dto.Name}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();
            
            return Ok(new { message = "Cập nhật quyền thành công" });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa permission
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = CustomPermissions.Permissions.Delete)]
    public async Task<IActionResult> DeletePermission(Guid id)
    {
        try
        {
            var permissionBeforeDelete = await _permissionService.GetPermissionByIdAsync(id);
            await _permissionService.DeletePermissionAsync(id);
            
            // Log permission deletion
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.DeletePermission,
                Details = $"Đã xóa quyền: {permissionBeforeDelete?.Name}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();
            
            return Ok(new { message = "Xóa quyền thành công" });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _permissionService.GetCategoriesAsync();
        return Ok(categories);
    }
}
