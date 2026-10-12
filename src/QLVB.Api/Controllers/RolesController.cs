using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using QLVB.Api.Hubs;
using QLVB.Application.DTOs.Auth;
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
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly IUnitOfWork _unitOfWork;
    // private readonly IHubContext<NotificationHub> _hubContext;

    public RolesController(IRoleService roleService, IUnitOfWork unitOfWork/*, IHubContext<NotificationHub> hubContext*/)
    {
        _roleService = roleService;
        _unitOfWork = unitOfWork;
        // _hubContext = hubContext;
    }

    /// <summary>
    /// Lấy danh sách tất cả roles
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetRoles([FromQuery] RoleFilterDto filter)
    {
        // Allow access if user has Roles.View OR Users.View
        if (!User.HasClaim("Permission", CustomPermissions.Roles.View) && 
            !User.HasClaim("Permission", CustomPermissions.Users.View))
        {
            return Forbid();
        }

        var (items, totalCount) = await _roleService.GetRolesAsync(filter);
        return Ok(new
        {
            items,
            totalCount,
            pageNumber = filter.PageNumber,
            pageSize = filter.PageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        });
    }

    /// <summary>
    /// Lấy thông tin role theo ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Policy = CustomPermissions.Roles.View)]
    public async Task<ActionResult<RoleDto>> GetRole(Guid id)
    {
        var role = await _roleService.GetRoleByIdAsync(id);
        if (role == null) return NotFound(new { message = "Không tìm thấy vai trò" });
        return Ok(role);
    }

    /// <summary>
    /// Tạo role mới
    /// </summary>
    [HttpPost]
    [Authorize(Policy = CustomPermissions.Roles.Create)]
    public async Task<ActionResult<RoleDto>> CreateRole([FromBody] CreateRoleDto dto)
    {
        try
        {
            var role = await _roleService.CreateRoleAsync(dto);
            
            // Log role creation
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.CreateRole,
                Details = $"Đã tạo vai trò: {role.Name} ({role.Code})",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();
            
            /*
            // Broadcast notification to all admins
            await _hubContext.Clients.All.SendAsync("RoleCreated", new
            {
                roleId = role.Id,
                roleName = role.Name,
                roleCode = role.Code,
                message = $"Vai trò mới {role.Name} ({role.Code}) đã được tạo"
            });
            */
            
            return CreatedAtAction(nameof(GetRole), new { id = role.Id }, role);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin role
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = CustomPermissions.Roles.Edit)]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleDto dto)
    {
        try
        {
            var roleBeforeUpdate = await _roleService.GetRoleByIdAsync(id);
            await _roleService.UpdateRoleAsync(id, dto);
            
            // Log role update
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.UpdateRole,
                Details = $"Đã cập nhật vai trò: {roleBeforeUpdate?.Name} → {dto.Name}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();
            
            /*
            // Broadcast notification to all admins
            await _hubContext.Clients.All.SendAsync("RoleUpdated", new
            {
                roleId = id,
                roleName = dto.Name,
                message = $"Vai trò {dto.Name} đã được cập nhật"
            });
            */
            
            return Ok(new { message = "Cập nhật vai trò thành công" });
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
    /// Xóa role
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = CustomPermissions.Roles.Delete)]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        try
        {
            var roleBeforeDelete = await _roleService.GetRoleByIdAsync(id);
            await _roleService.DeleteRoleAsync(id);
            
            // Log role deletion
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.DeleteRole,
                Details = $"Đã xóa vai trò: {roleBeforeDelete?.Name}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();
            
            /*
            // Broadcast notification to all admins
            await _hubContext.Clients.All.SendAsync("RoleDeleted", new
            {
                roleId = id,
                roleName = roleBeforeDelete?.Name,
                message = $"Vai trò {roleBeforeDelete?.Name} đã bị xóa"
            });
            */
            
            return Ok(new { message = "Xóa vai trò thành công" });
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
    /// Gán permissions cho role
    /// </summary>
    [HttpPost("{id}/permissions")]
    [Authorize(Policy = CustomPermissions.Roles.AssignPermissions)]
    public async Task<IActionResult> AssignPermissions(Guid id, [FromBody] AssignPermissionsDto dto)
    {
        try
        {
            var role = await _roleService.GetRoleByIdAsync(id);
            await _roleService.AssignPermissionsToRoleAsync(id, dto);
            
            // Log permission assignment
            var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var auditLog = new AuditLog
            {
                UserId = currentUserId,
                Action = AuditAction.AssignPermissions,
                Details = $"Đã gán {dto.PermissionIds.Count} quyền cho vai trò: {role?.Name}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.UtcNow
            };
            await _unitOfWork.AuditLogs.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();
            
            return Ok(new { message = "Gán quyền thành công. Người dùng cần đăng nhập lại để cập nhật dữ liệu." });
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
    /// Lấy danh sách users có role này
    /// </summary>
    [HttpGet("{id}/users")]
    [Authorize(Policy = CustomPermissions.Roles.View)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetRoleUsers(Guid id)
    {
        var users = await _roleService.GetRoleUsersAsync(id);
        return Ok(users);
    }
}
