using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Constants;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Data;
using QLVB.Infrastructure.Storage;
using System.Security.Claims;
using QLVB.Application.Services;
using QLVB.Application.DTOs.Dashboard;
using QLVB.Application.DTOs.Notifications;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = CustomPermissions.Documents.View)]
public class AssignmentsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public AssignmentsController(
        IUnitOfWork unitOfWork, 
        ApplicationDbContext context, 
        IStorageService storageService,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _storageService = storageService;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Get all assignments (Admin sees all, Manager sees only their assignments)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = CustomPermissions.Documents.Assign)]
    public async Task<ActionResult<IEnumerable<object>>> GetAllAssignments()
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        IQueryable<DocumentAssignment> query = _context.DocumentAssignments
            .Include(a => a.Document)
            .Include(a => a.Department)
            .Include(a => a.AssignedTo)
            .Include(a => a.AssignedBy);

        // Admin can see all assignments
        if (userRole == "ADMIN")
        {
            // No filter
        }
        else if (userRole == "MANAGER" || userRole == "CLERK" || userRole == "DIRECTOR")
        {
            // These roles only see assignments they created in the "All" view
            query = query.Where(a => a.AssignedById == userId);
        }
        else // STAFF and others
        {
            query = query.Where(a => a.AssignedToUserId == userId || a.AssignedById == userId);
        }

        var assignments = await query
            .OrderByDescending(a => a.AssignedAt)
            .ToListAsync();

        var result = assignments.Select(a => new
        {
            a.Id,
            a.DocumentId,
            DocumentTitle = a.Document?.Title,
            DocumentType = a.Document?.DocumentType.ToString(),
            DocumentCategory = a.Document?.Category.ToString(),
            a.DepartmentId,
            DepartmentName = a.Department?.Name,
            a.AssignedToUserId,
            AssignedToUserName = a.AssignedTo?.FullName,
            AssignedRole = a.AssignedRole.ToString(),
            Status = a.Status.ToString(),
            a.AssignedById,
            AssignedByName = a.AssignedBy?.FullName,
            a.Notes,
            a.AssignedAt,
            a.Deadline,
            a.CompletedAt,
            a.ReportFilePath,
            a.ReportFileName,
            a.ReportFileSize
        });

        return Ok(result);
    }

    /// <summary>
    /// Get assignments for a document
    /// </summary>
    [HttpGet("document/{documentId}")]
    public async Task<ActionResult<IEnumerable<object>>> GetDocumentAssignments(Guid documentId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var departmentIdClaim = User.FindFirst("DepartmentId")?.Value;
        Guid.TryParse(departmentIdClaim, out var userDeptId);

        var query = _context.DocumentAssignments
            .Include(a => a.Department)
            .Include(a => a.AssignedTo)
            .Include(a => a.AssignedBy)
            .Where(a => a.DocumentId == documentId);

        // Filter based on role
        if (userRole == "STAFF")
        {
            // Staff only see their personal assignments
            query = query.Where(a => a.AssignedToUserId == userId);
        }
        else if (userRole == "MANAGER")
        {
            // Managers see assignments for their department OR assignments they created
            query = query.Where(a => a.DepartmentId == userDeptId || a.AssignedById == userId);
        }
        // Admin, Clerk, Director see all

        var assignments = await query.ToListAsync();

        var result = assignments.Select(a => new
        {
            a.Id,
            a.DocumentId,
            DocumentTitle = a.Document?.Title,
            DocumentCategory = a.Document?.Category.ToString(),
            a.DepartmentId,
            DepartmentName = a.Department?.Name,
            a.AssignedToUserId,
            AssignedToUserName = a.AssignedTo?.FullName,
            AssignedRole = a.AssignedRole.ToString(),
            Status = a.Status.ToString(),
            a.AssignedById,
            AssignedByName = a.AssignedBy?.FullName,
            a.Notes,
            a.AssignedAt,
            a.Deadline,
            a.CompletedAt,
            a.ReportFilePath,
            a.ReportFileName,
            a.ReportFileSize
        });

        return Ok(result);
    }

    /// <summary>
    /// Get assignments for current user's department (or all if Admin/Manager without department)
    /// </summary>
    [HttpGet("my-department")]
    public async Task<ActionResult<IEnumerable<object>>> GetMyDepartmentAssignments()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        
        IQueryable<DocumentAssignment> query = _context.DocumentAssignments
            .Include(a => a.Document)
            .Include(a => a.AssignedTo)
            .Include(a => a.AssignedBy);

        // All users see individual assignments + department assignments if applicable
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var departmentIdClaim = User.FindFirst("DepartmentId")?.Value;

        if (!string.IsNullOrEmpty(departmentIdClaim) && Guid.TryParse(departmentIdClaim, out var departmentId))
        {
            if (userRole == "STAFF")
            {
                // Staff ONLY see their own assignments
                query = query.Where(a => a.AssignedToUserId == userId);
            }
            else
            {
                // Managers see all department assignments
                query = query.Where(a => a.DepartmentId == departmentId || a.AssignedToUserId == userId);
            }
        }
        else
        {
            query = query.Where(a => a.AssignedToUserId == userId);
        }

        // If Admin/Manager/Director/Clerk, they might see more in the "All" tab anyway,
        // but here we keep it to what is specifically assigned to them or their department.

        var assignments = await query
            .OrderByDescending(a => a.AssignedAt)
            .ToListAsync();

        var result = assignments.Select(a => new
        {
            a.Id,
            a.DocumentId,
            DocumentTitle = a.Document?.Title,
            DocumentType = a.Document?.DocumentType.ToString(),
            DocumentCategory = a.Document?.Category.ToString(),
            a.DepartmentId,
            DepartmentName = a.Department?.Name,
            a.AssignedToUserId,
            AssignedToUserName = a.AssignedTo?.FullName,
            AssignedRole = a.AssignedRole.ToString(),
            Status = a.Status.ToString(),
            AssignedByName = a.AssignedBy?.FullName,
            a.Notes,
            a.AssignedAt,
            a.Deadline,
            a.CompletedAt,
            a.ReportFilePath,
            a.ReportFileName,
            a.ReportFileSize
        });

        return Ok(result);
    }

    /// <summary>
    /// Update assignment status
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateAssignmentStatus(Guid id, [FromForm] UpdateAssignmentStatusDto dto, IFormFile? reportFile)
    {
        var assignment = await _context.DocumentAssignments
            .Include(a => a.Document)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null)
            return NotFound();

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var departmentIdClaim = User.FindFirst("DepartmentId")?.Value;
        Guid.TryParse(departmentIdClaim, out var userDeptId);

        bool isAuthorized = userRole == "ADMIN" || userRole == "DIRECTOR" || userRole == "CLERK" ||
                           (assignment.AssignedToUserId.HasValue && assignment.AssignedToUserId == userId) ||
                           (assignment.DepartmentId.HasValue && assignment.DepartmentId == userDeptId) ||
                           (userRole == "MANAGER" && (assignment.DepartmentId == userDeptId || assignment.AssignedById == userId));

        if (!isAuthorized)
            return Forbid();

        var oldStatus = assignment.Status;
        assignment.Status = dto.Status;
        
        if (dto.Status == AssignmentStatus.Completed)
        {
            assignment.CompletedAt = DateTime.UtcNow;
            
            // Handle report file upload if provided
            if (reportFile != null && reportFile.Length > 0)
            {
                try
                {
                    using var stream = reportFile.OpenReadStream();
                    var filePath = await _storageService.UploadFileAsync(
                        stream, 
                        reportFile.FileName, 
                        reportFile.ContentType
                    );
                    
                    assignment.ReportFilePath = filePath;
                    assignment.ReportFileName = reportFile.FileName;
                    assignment.ReportFileSize = reportFile.Length;
                }
                catch (Exception ex)
                {
                    return BadRequest(new { message = $"Tải file báo cáo thất bại: {ex.Message}" });
                }
            }

            // Sync with parent department assignment (Bubbling)
            // Only mark the department assignment as completed if ALL sub-assignments are completed
            if (assignment.AssignedToUserId.HasValue)
            {
                DocumentAssignment? parentAssignment = null;
                List<DocumentAssignment> siblings = new();

                if (assignment.ParentAssignmentId.HasValue)
                {
                    parentAssignment = await _context.DocumentAssignments.FindAsync(assignment.ParentAssignmentId.Value);
                    siblings = await _context.DocumentAssignments
                        .Where(a => a.ParentAssignmentId == assignment.ParentAssignmentId.Value 
                                 && a.Id != assignment.Id 
                                 && !a.IsDeleted)
                        .ToListAsync();
                }
                else // Fallback for old records or manually assigned without parent ID
                {
                    var deptId = assignment.DepartmentId;
                    if (!deptId.HasValue)
                    {
                        var assignedUser = await _context.Users.FindAsync(assignment.AssignedToUserId.Value);
                        deptId = assignedUser?.DepartmentId;
                    }

                    if (deptId.HasValue)
                    {
                        parentAssignment = await _context.DocumentAssignments
                            .FirstOrDefaultAsync(a => a.DocumentId == assignment.DocumentId 
                                                   && a.DepartmentId == deptId 
                                                   && !a.AssignedToUserId.HasValue
                                                   && !a.IsDeleted);
                        
                        siblings = await _context.DocumentAssignments
                            .Where(a => a.DocumentId == assignment.DocumentId 
                                     && a.DepartmentId == deptId 
                                     && a.AssignedToUserId.HasValue 
                                     && a.Id != assignment.Id
                                     && !a.IsDeleted)
                            .ToListAsync();
                    }
                }

                if (parentAssignment != null)
                {
                    bool allCompleted = siblings.All(a => a.Status == AssignmentStatus.Completed);

                    if (allCompleted && parentAssignment.Status != AssignmentStatus.Completed)
                    {
                        parentAssignment.Status = AssignmentStatus.Completed;
                        parentAssignment.CompletedAt = DateTime.UtcNow;
                        parentAssignment.ReportFilePath = assignment.ReportFilePath;
                        parentAssignment.ReportFileName = assignment.ReportFileName;
                        parentAssignment.ReportFileSize = assignment.ReportFileSize;
                        _unitOfWork.DocumentAssignments.Update(parentAssignment);
                    }
                }
            }
        }

        _unitOfWork.DocumentAssignments.Update(assignment);
        await _unitOfWork.SaveChangesAsync();

        // Log status update
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var details = reportFile != null 
            ? $"Đã cập nhật trạng thái phân công: {oldStatus} → {dto.Status} (kèm báo cáo: {reportFile.FileName})"
            : $"Đã cập nhật trạng thái phân công: {oldStatus} → {dto.Status}";
            
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            DocumentId = assignment.DocumentId,
            Action = AuditAction.UpdateStatus,
            Details = details,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        // Notify the assigner and relevant stakeholders (Clerks, Directors) about the status update
        string sourceName = "Cá nhân";
        if (assignment.DepartmentId.HasValue)
        {
            var department = await _unitOfWork.Departments.GetByIdAsync(assignment.DepartmentId.Value);
            sourceName = department?.Name ?? "N/A";
        }
        
        var updater = await _unitOfWork.Users.GetByIdAsync(currentUserId);
        
        // 1. Gather all recipients
        var recipientIds = new List<Guid> { assignment.AssignedById };
        
        // 2. Add all Clerks and Directors to get real-time update
        var clerks = await _unitOfWork.Users.GetUsersByRoleAsync("CLERK");
        var directors = await _unitOfWork.Users.GetUsersByRoleAsync("DIRECTOR");
        
        recipientIds.AddRange(clerks.Select(u => u.Id));
        recipientIds.AddRange(directors.Select(u => u.Id));
        
        // 3. Filter: Distinct and Not the person who made the update
        var finalRecipients = recipientIds.Distinct().Where(rid => rid != currentUserId).ToList();

        // 4. Status text in Vietnamese
        string statusText = dto.Status switch
        {
            AssignmentStatus.InProgress => "Đang xử lý",
            AssignmentStatus.Completed => "Hoàn thành",
            AssignmentStatus.Rejected => "Từ chối",
            _ => dto.Status.ToString()
        };

        // 5. Send notifications
        foreach (var recipientId in finalRecipients)
        {
            await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = recipientId,
                Title = "Cập nhật tiến độ xử lý văn bản",
                Message = $"{sourceName} ({updater?.FullName ?? "N/A"}) đã chuyển trạng thái văn bản '{assignment.Document?.Title}' sang: {statusText}",
                Type = Domain.Enums.NotificationType.General,
                Link = $"/documents/view/{assignment.DocumentId}",
                DocumentId = assignment.DocumentId
            });
        }

        return Ok(new { message = "Cập nhật trạng thái phân công thành công" });
    }

    /// <summary>
    /// Delete assignment (Manager/Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = CustomPermissions.Documents.Assign)]
    public async Task<IActionResult> DeleteAssignment(Guid id)
    {
        var assignment = await _unitOfWork.DocumentAssignments.GetByIdAsync(id);

        if (assignment == null)
            return NotFound();

        var documentId = assignment.DocumentId;
        _unitOfWork.DocumentAssignments.SoftDelete(assignment);
        await _unitOfWork.SaveChangesAsync();

        // Log assignment deletion
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var auditLog = new AuditLog
        {
            UserId = currentUserId,
            DocumentId = documentId,
            Action = AuditAction.DeleteAssignment,
            Details = $"Đã xóa phân công cho văn bản",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
            UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
            Timestamp = DateTime.UtcNow
        };
        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();

        // Notify the department or individual that the assignment has been removed
        var document = await _unitOfWork.Documents.GetByIdAsync(documentId);
        string docTitle = document?.Title ?? "N/A";

        if (assignment.AssignedToUserId.HasValue)
        {
            await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
            {
                UserId = assignment.AssignedToUserId.Value,
                Title = "Thu hồi phân công cá nhân",
                Message = $"Văn bản '{docTitle}' đã được thu hồi phân công đích danh cho bạn.",
                Type = Domain.Enums.NotificationType.General,
                Link = "/documents",
                DocumentId = documentId
            });
        }
        else if (assignment.DepartmentId.HasValue)
        {
            var departmentUsers = await _unitOfWork.Users.GetUsersByDepartmentAsync(assignment.DepartmentId.Value);
            foreach (var user in departmentUsers)
            {
                await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
                {
                    UserId = user.Id,
                    Title = "Thu hồi phân công phòng ban",
                    Message = $"Văn bản '{docTitle}' đã được thu hồi phân công cho phòng ban của bạn.",
                    Type = Domain.Enums.NotificationType.General,
                    Link = "/assignments/my-department",
                    DocumentId = documentId
                });
            }
        }

        return NoContent();
    }

    /// <summary>
    /// Get assignment statistics for a department
    /// </summary>
    [HttpGet("department/{departmentId}/statistics")]
    public async Task<ActionResult<object>> GetDepartmentStatistics(Guid departmentId)
    {
        var assignments = await _context.DocumentAssignments
            .Where(a => a.DepartmentId == departmentId)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var today = now.Date;
        var in3Days = today.AddDays(4);

        var statistics = new
        {
            TotalAssignments = assignments.Count,
            Pending = assignments.Count(a => a.Status == AssignmentStatus.Pending),
            InProgress = assignments.Count(a => a.Status == AssignmentStatus.InProgress),
            Completed = assignments.Count(a => a.Status == AssignmentStatus.Completed),
            Rejected = assignments.Count(a => a.Status == AssignmentStatus.Rejected),
            MainRole = assignments.Count(a => a.AssignedRole == AssignmentRole.Main),
            SupportRole = assignments.Count(a => a.AssignedRole == AssignmentRole.Support),
            DeadlineStats = new
            {
                Overdue = assignments.Count(a => a.Deadline.HasValue && a.Deadline.Value.Date < today && a.Status != AssignmentStatus.Completed),
                DueToday = assignments.Count(a => a.Deadline.HasValue && a.Deadline.Value.Date == today && a.Status != AssignmentStatus.Completed),
                NearingDeadline = assignments.Count(a => a.Deadline.HasValue && a.Deadline.Value.Date > today && a.Deadline.Value.Date < in3Days.Date && a.Status != AssignmentStatus.Completed)
            }
        };

        return Ok(statistics);
    }

    /// <summary>
    /// Get report file preview URL
    /// </summary>
    [HttpGet("{id}/report")]
    public async Task<ActionResult<object>> GetReportFileUrl(Guid id)
    {
        var assignment = await _unitOfWork.DocumentAssignments.GetByIdAsync(id);

        if (assignment == null)
            return NotFound(new { message = "Không tìm thấy thông tin phân công" });

        if (string.IsNullOrEmpty(assignment.ReportFilePath))
            return NotFound(new { message = "Không có file báo cáo nào được tải lên cho phân công này" });

        // Check if user is authorized to view this report
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var departmentIdClaim = User.FindFirst("DepartmentId")?.Value;
        Guid.TryParse(departmentIdClaim, out var userDeptId);

        bool isAuthorized = userRole == "ADMIN" || userRole == "DIRECTOR" || userRole == "CLERK" ||
                           (assignment.AssignedToUserId.HasValue && assignment.AssignedToUserId == userId) ||
                           (assignment.DepartmentId.HasValue && assignment.DepartmentId == userDeptId) ||
                           (userRole == "MANAGER" && (assignment.DepartmentId == userDeptId || assignment.AssignedById == userId));

        if (!isAuthorized)
            return Forbid();

        try
        {
            var url = await _storageService.GetPresignedUrlAsync(assignment.ReportFilePath);
            return Ok(new 
            { 
                url,
                fileName = assignment.ReportFileName,
                fileSize = assignment.ReportFileSize
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Không thể lấy URL file báo cáo: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get aggregated statistics for Admin Dashboard
    /// Incoming: Counted by assigned department
    /// Outgoing: Counted by creator's department
    /// </summary>
    [HttpGet("admin-dashboard-stats")]
    [Authorize(Roles = "ADMIN,DIRECTOR")]
    public async Task<ActionResult<IEnumerable<AdminDashboardStatsDto>>> GetAdminDashboardStats()
    {
        var departments = await _context.Departments
            .Where(d => !d.IsDeleted)
            .ToListAsync();

        // 1. Incoming documents grouped by Assigned Department
        var incomingStats = await _context.DocumentAssignments
            .Where(a => a.Document != null && a.Document.Category == DocumentCategory.Incoming && !a.Document.IsDeleted)
            .GroupBy(a => a.DepartmentId)
            .Select(g => new { DepartmentId = g.Key, Count = g.Count() })
            .ToListAsync();

        // 2. Outgoing documents grouped by Creator's Department
        var outgoingStats = await _context.Documents
            .Where(d => d.Category == DocumentCategory.Outgoing && !d.IsDeleted)
            .Include(d => d.CreatedBy)
            .GroupBy(d => d.CreatedBy.DepartmentId)
            .Select(g => new { DepartmentId = g.Key, Count = g.Count() })
            .ToListAsync();

        var result = departments.Select(d => {
            var inc = incomingStats.FirstOrDefault(s => s.DepartmentId == d.Id)?.Count ?? 0;
            var outg = outgoingStats.FirstOrDefault(s => s.DepartmentId == d.Id)?.Count ?? 0;
            return new AdminDashboardStatsDto
            {
                Name = d.Name,
                Incoming = inc,
                Outgoing = outg,
                Value = inc + outg 
            };
        })
        .Where(r => r.Value > 0)
        .OrderByDescending(r => r.Value)
        .ToList();

        return Ok(result);
    }

    [HttpPost("trigger-reminders")]
    [Authorize]
    public async Task<IActionResult> TriggerReminders()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var departmentIdClaim = User.FindFirst("DepartmentId")?.Value;
        Guid.TryParse(departmentIdClaim, out var userDeptId);

        // Kiểm tra quyền: Chỉ Admin, Văn thư hoặc Trưởng khoa mới được dùng tính năng này
        if (userRole != "ADMIN" && userRole != "CLERK" && userRole != "MANAGER")
        {
            return Forbid();
        }

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // Lấy danh sách cần nhắc dựa trên quyền
        IEnumerable<DocumentAssignment> assignmentsToRemind;

        if (userRole == "ADMIN" || userRole == "CLERK")
        {
            // Admin/Văn thư: Nhắc toàn bộ hệ thống
            assignmentsToRemind = await _unitOfWork.DocumentAssignments
                .FindAsync(a => a.Status != AssignmentStatus.Completed 
                             && !a.IsDeleted 
                             && a.Deadline.HasValue 
                             && a.Deadline.Value.Date <= tomorrow);
        }
        else
        {
            // Trưởng khoa: Chỉ nhắc nhân viên trong khoa mình
            assignmentsToRemind = await _unitOfWork.DocumentAssignments
                .FindAsync(a => a.Status != AssignmentStatus.Completed 
                             && !a.IsDeleted 
                             && a.DepartmentId == userDeptId
                             && a.Deadline.HasValue 
                             && a.Deadline.Value.Date <= tomorrow);
        }

        int count = 0;
        foreach (var assignment in assignmentsToRemind)
        {
            if (assignment.AssignedToUserId.HasValue)
            {
                await _notificationService.CreateAndSendAsync(new Application.DTOs.Notifications.CreateNotificationDto
                {
                    UserId = assignment.AssignedToUserId.Value,
                    Title = "NHẮC HẸN: Xử lý văn bản",
                    Message = $"Bạn có văn bản '{assignment.Document?.Title ?? "N/A"}' sắp hết hạn hoặc đã quá hạn xử lý. Vui lòng kiểm tra!",
                    Type = NotificationType.DeadlineReminder,
                    Link = $"/documents/view/{assignment.DocumentId}",
                    DocumentId = assignment.DocumentId
                });
                count++;
            }
        }

        return Ok(new { message = $"Đã gửi {count} thông báo nhắc hẹn thành công." });
    }
}

public class UpdateAssignmentStatusDto
{
    public AssignmentStatus Status { get; set; }
}
