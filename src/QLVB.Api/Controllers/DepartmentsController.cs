using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using QLVB.Api.Hubs;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Domain.Constants;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    // private readonly IHubContext<NotificationHub> _hubContext;

    public DepartmentsController(IUnitOfWork unitOfWork/*, IHubContext<NotificationHub> hubContext*/)
    {
        _unitOfWork = unitOfWork;
        // _hubContext = hubContext;
    }

    /// <summary>
    /// Get all departments
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetDepartments([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        // Allow access if user has Departments.View OR Users.View
        if (!User.HasClaim("Permission", CustomPermissions.Departments.View) && 
            !User.HasClaim("Permission", CustomPermissions.Users.View))
        {
            return Forbid();
        }

        var (departments, totalCount) = await _unitOfWork.Departments.GetPagedAsync(
            pageNumber, 
            pageSize, 
            orderBy: q => q.OrderBy(d => d.Name));
        
        var items = departments.Select(d => new
        {
            d.Id,
            d.Name,
            d.Code,
            d.Description,
            d.IsActive,
            d.CreatedAt
        });

        return Ok(new
        {
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    /// <summary>
    /// Get department by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Policy = CustomPermissions.Departments.View)]
    public async Task<ActionResult<object>> GetDepartment(Guid id)
    {
        var department = await _unitOfWork.Departments.GetByIdAsync(id);

        if (department == null)
            return NotFound();

        return Ok(new
        {
            department.Id,
            department.Name,
            department.Code,
            department.Description,
            department.IsActive,
            department.CreatedAt
        });
    }

    /// <summary>
    /// Create new department (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = CustomPermissions.Departments.Create)]
    public async Task<ActionResult<object>> CreateDepartment([FromBody] CreateDepartmentDto dto)
    {
        // Check if code already exists
        var exists = await _unitOfWork.Departments.AnyAsync(d => d.Code == dto.Code);
        if (exists)
            return BadRequest(new { message = "Mã phòng ban đã tồn tại" });

        var department = new Department
        {
            Name = dto.Name,
            Code = dto.Code,
            Description = dto.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Departments.AddAsync(department);
        await _unitOfWork.SaveChangesAsync();

        // Log department creation
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            Action = AuditAction.CreateDepartment,
            Details = $"Đã tạo phòng ban: {department.Name} ({department.Code})",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        /*
        // Broadcast notification to all admins
        await _hubContext.Clients.All.SendAsync("DepartmentCreated", new
        {
            departmentId = department.Id,
            departmentName = department.Name,
            departmentCode = department.Code,
            message = $"Phòng ban mới {department.Name} ({department.Code}) đã được tạo"
        });
        */

        return CreatedAtAction(nameof(GetDepartment), new { id = department.Id }, new
        {
            department.Id,
            department.Name,
            department.Code,
            department.Description,
            department.IsActive,
            department.CreatedAt
        });
    }

    /// <summary>
    /// Update department (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = CustomPermissions.Departments.Edit)]
    public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentDto dto)
    {
        var department = await _unitOfWork.Departments.GetByIdAsync(id);

        if (department == null)
            return NotFound();

        // Check if new code conflicts with another department
        if (dto.Code != department.Code)
        {
            var exists = await _unitOfWork.Departments.AnyAsync(d => d.Code == dto.Code && d.Id != id);
            if (exists)
                return BadRequest(new { message = "Mã phòng ban đã tồn tại" });
        }

        var oldName = department.Name;
        department.Name = dto.Name;
        department.Code = dto.Code;
        department.Description = dto.Description;
        department.IsActive = dto.IsActive;

        _unitOfWork.Departments.Update(department);
        await _unitOfWork.SaveChangesAsync();

        // Log department update
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            Action = AuditAction.UpdateDepartment,
            Details = $"Đã cập nhật phòng ban: {oldName} → {department.Name} ({department.Code})",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        /*
        // Broadcast notification to all admins
        await _hubContext.Clients.All.SendAsync("DepartmentUpdated", new
        {
            departmentId = department.Id,
            departmentName = department.Name,
            departmentCode = department.Code,
            message = $"Phòng ban {department.Name} ({department.Code}) đã được cập nhật"
        });
        */

        return NoContent();
    }

    /// <summary>
    /// Delete department (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = CustomPermissions.Departments.Delete)]
    public async Task<IActionResult> DeleteDepartment(Guid id)
    {
        var department = await _unitOfWork.Departments.GetByIdAsync(id);

        if (department == null)
            return NotFound();


        var departmentName = department.Name;
        _unitOfWork.Departments.SoftDelete(department);
        await _unitOfWork.SaveChangesAsync();

        // Log department deletion
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            Action = AuditAction.DeleteDepartment,
            Details = $"Đã xóa phòng ban: {departmentName}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        /*
        // Broadcast notification to all admins
        await _hubContext.Clients.All.SendAsync("DepartmentDeleted", new
        {
            departmentId = id,
            departmentName = departmentName,
            message = $"Phòng ban {departmentName} đã bị xóa"
        });
        */

        return NoContent();
    }
}

public class CreateDepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateDepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
