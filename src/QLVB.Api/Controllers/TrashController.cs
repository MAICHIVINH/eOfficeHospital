using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Domain.Entities;
using QLVB.Domain.Interfaces;
using QLVB.Domain.Constants;
using System.Security.Claims;
using QLVB.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using QLVB.Infrastructure.Data;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrashController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;

    public TrashController(IUnitOfWork unitOfWork, ApplicationDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    [HttpGet("documents")]
    public async Task<ActionResult<IEnumerable<object>>> GetDeletedDocuments()
    {
        var documents = await _unitOfWork.Documents.GetDeletedAsync();
        return Ok(documents.Select(d => new
        {
            d.Id,
            d.Title,
            d.FileName,
            d.FileSize,
            d.DocumentType,
            d.Category,
            d.DeletedAt,
            DeletedBy = "System" // Could be improved if we track who deleted
        }));
    }

    [HttpGet("users")]
    [Authorize(Policy = CustomPermissions.Users.View)]
    public async Task<ActionResult<IEnumerable<object>>> GetDeletedUsers()
    {
        var users = await _unitOfWork.Users.GetDeletedAsync();
        return Ok(users.Select(u => new
        {
            u.Id,
            u.Username,
            u.FullName,
            u.Email,
            u.DeletedAt
        }));
    }

    [HttpGet("departments")]
    [Authorize(Policy = CustomPermissions.Departments.View)]
    public async Task<ActionResult<IEnumerable<object>>> GetDeletedDepartments()
    {
        var departments = await _unitOfWork.Departments.GetDeletedAsync();
        return Ok(departments.Select(d => new
        {
            d.Id,
            d.Name,
            d.Code,
            d.DeletedAt
        }));
    }

    [HttpGet("assignments")]
    public async Task<ActionResult<IEnumerable<object>>> GetDeletedAssignments()
    {
        var assignments = await _context.DocumentAssignments
            .IgnoreQueryFilters()
            .Include(a => a.Document)
            .Include(a => a.Department)
            .Where(a => a.IsDeleted)
            .ToListAsync();

        return Ok(assignments.Select(a => new
        {
            a.Id,
            a.DocumentId,
            DocumentTitle = a.Document?.Title,
            a.DepartmentId,
            DepartmentName = a.Department?.Name,
            a.Status,
            a.DeletedAt
        }));
    }

    [HttpGet("roles")]
    [Authorize(Policy = CustomPermissions.Roles.View)]
    public async Task<ActionResult<IEnumerable<object>>> GetDeletedRoles()
    {
        var roles = await _unitOfWork.Roles.GetDeletedAsync();
        return Ok(roles.Select(r => new
        {
            r.Id,
            r.Name,
            r.Code,
            r.DeletedAt
        }));
    }

    [HttpGet("auditlogs")]
    [Authorize(Policy = CustomPermissions.AuditLogs.View)]
    public async Task<ActionResult<IEnumerable<object>>> GetDeletedAuditLogs()
    {
        var logs = await _context.AuditLogs
            .IgnoreQueryFilters()
            .Include(a => a.User)
            .Where(a => a.IsDeleted)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        return Ok(logs.Select(a => new
        {
            a.Id,
            Username = a.User?.Username ?? "N/A",
            UserFullName = a.User?.FullName ?? "Unknown",
            Action = a.Action.ToString(),
            a.Details,
            a.IpAddress,
            a.Timestamp,
            a.DeletedAt
        }));
    }

    [HttpPost("{entityType}/{id}/restore")]
    public async Task<IActionResult> Restore(string entityType, Guid id)
    {
        switch (entityType.ToLower())
        {
            case "document":
                await _unitOfWork.Documents.RestoreAsync(id);
                // Also restore associated assignments
                var assignments = await _unitOfWork.DocumentAssignments.GetDeletedAsync();
                foreach (var assignment in assignments.Where(a => a.DocumentId == id))
                {
                    await _unitOfWork.DocumentAssignments.RestoreAsync(assignment.Id);
                }
                break;
            case "user":
                if (!User.HasClaim(ClaimTypes.Role, "ADMIN")) return Forbid();
                await _unitOfWork.Users.RestoreAsync(id);
                break;
            case "department":
                if (!User.HasClaim(ClaimTypes.Role, "ADMIN")) return Forbid();
                await _unitOfWork.Departments.RestoreAsync(id);
                break;
            case "assignment":
                await _unitOfWork.DocumentAssignments.RestoreAsync(id);
                break;
            case "role":
                if (!User.HasClaim(ClaimTypes.Role, "ADMIN")) return Forbid();
                await _unitOfWork.Roles.RestoreAsync(id);
                break;
            case "auditlog":
                if (!User.HasClaim(ClaimTypes.Role, "ADMIN")) return Forbid();
                await _unitOfWork.AuditLogs.RestoreAsync(id);
                break;
            default:
                return BadRequest(new { message = "Loại thực thể không hợp lệ" });
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { message = "Khôi phục thành công" });
    }

    [HttpDelete("{entityType}/{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> PermanentDelete(string entityType, Guid id)
    {
        switch (entityType.ToLower())
        {
            case "document":
                await _unitOfWork.Documents.PermanentDeleteAsync(id);
                break;
            case "user":
                // Check if user is associated with any documents (creator, signer, issuer, rejecter)
                // We use _context directly to easily use IgnoreQueryFilters() and check across all statuses
                var isAssociatedWithDocuments = await _context.Documents.IgnoreQueryFilters()
                    .AnyAsync(d => d.CreatedById == id || d.SignedById == id || d.IssuedById == id || d.RejectedById == id);
                
                if (isAssociatedWithDocuments)
                    return BadRequest(new { message = "Không thể xóa vĩnh viễn người dùng đang liên quan đến các văn bản (với vai trò người tạo, người ký hoặc người ban hành). Cần bàn giao lại các mục này trước." });

                // Check if user is associated with any assignments (as assigner)
                var isAssociatedWithAssignments = await _context.DocumentAssignments.IgnoreQueryFilters()
                    .AnyAsync(a => a.AssignedById == id);

                if (isAssociatedWithAssignments)
                    return BadRequest(new { message = "Không thể xóa vĩnh viễn người dùng đã thực hiện phân công văn bản cho người khác." });

                // Delete associated audit logs first due to foreign key constraint Restrict
                var userAuditLogs = await _context.AuditLogs.Where(a => a.UserId == id).ToListAsync();
                if (userAuditLogs.Any())
                {
                    _context.AuditLogs.RemoveRange(userAuditLogs);
                    // We don't SaveChanges here yet, let the final SaveChanges at the end of the method do it in one transaction
                }

                await _unitOfWork.Users.PermanentDeleteAsync(id);
                break;
            case "department":
                // Check for users before permanent delete
                var hasUsers = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.DepartmentId == id);
                if (hasUsers)
                    return BadRequest(new { message = "Không thể xóa vĩnh viễn phòng ban đang có người dùng. Cần chuyển người dùng sang phòng ban khác trước." });
                
                // Check for assignments before permanent delete
                var hasDepartmentAssignments = await _context.DocumentAssignments.IgnoreQueryFilters().AnyAsync(da => da.DepartmentId == id);
                if (hasDepartmentAssignments)
                    return BadRequest(new { message = "Không thể xóa vĩnh viễn phòng ban đã có lịch sử phân công văn bản." });

                await _unitOfWork.Departments.PermanentDeleteAsync(id);
                break;
            case "assignment":
                await _unitOfWork.DocumentAssignments.PermanentDeleteAsync(id);
                break;
            case "role":
                // Check if role has users before permanent delete (including soft-deleted ones)
                var hasUsersForRole = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.RoleId == id);
                if (hasUsersForRole)
                    return BadRequest(new { message = "Không thể xóa vĩnh viễn vai trò đang có người dùng. Cần chuyển người dùng sang vai trò khác trước." });
                await _unitOfWork.Roles.PermanentDeleteAsync(id);
                break;
            case "auditlog":
                await _unitOfWork.AuditLogs.PermanentDeleteAsync(id);
                break;
            default:
                return BadRequest(new { message = "Loại thực thể không hợp lệ" });
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { message = "Đã xóa vĩnh viễn" });
    }

    [HttpPost("{entityType}/bulk-delete")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> BulkPermanentDelete(string entityType, [FromBody] BulkDeleteDto dto)
    {
        if (dto.Ids == null || !dto.Ids.Any())
            return BadRequest(new { message = "Danh sách ID không được để trống" });

        foreach (var id in dto.Ids)
        {
            switch (entityType.ToLower())
            {
                case "document":
                    await _unitOfWork.Documents.PermanentDeleteAsync(id);
                    break;
                case "user":
                    var isAssociatedWithDocuments = await _context.Documents.IgnoreQueryFilters()
                        .AnyAsync(d => d.CreatedById == id || d.SignedById == id || d.IssuedById == id || d.RejectedById == id);
                    if (isAssociatedWithDocuments) continue;

                    var isAssociatedWithAssignments = await _context.DocumentAssignments.IgnoreQueryFilters()
                        .AnyAsync(a => a.AssignedById == id);
                    if (isAssociatedWithAssignments) continue;

                    var userAuditLogs = await _context.AuditLogs.Where(a => a.UserId == id).ToListAsync();
                    if (userAuditLogs.Any()) _context.AuditLogs.RemoveRange(userAuditLogs);

                    await _unitOfWork.Users.PermanentDeleteAsync(id);
                    break;
                case "department":
                    var hasUsers = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.DepartmentId == id);
                    if (hasUsers) continue;

                    var hasDepartmentAssignments = await _context.DocumentAssignments.IgnoreQueryFilters().AnyAsync(da => da.DepartmentId == id);
                    if (hasDepartmentAssignments) continue;

                    await _unitOfWork.Departments.PermanentDeleteAsync(id);
                    break;
                case "assignment":
                    await _unitOfWork.DocumentAssignments.PermanentDeleteAsync(id);
                    break;
                case "role":
                    var hasUsersForRole = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.RoleId == id);
                    if (hasUsersForRole) continue;
                    await _unitOfWork.Roles.PermanentDeleteAsync(id);
                    break;
                case "auditlog":
                    await _unitOfWork.AuditLogs.PermanentDeleteAsync(id);
                    break;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { message = $"Đã xóa vĩnh viễn {dto.Ids.Count} mục" });
    }
}

public class BulkDeleteDto
{
    public List<Guid> Ids { get; set; } = new();
}
