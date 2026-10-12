using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;

using QLVB.Domain.Constants;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = CustomPermissions.AuditLogs.View)]
public class AuditLogsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public AuditLogsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Get audit logs with filtering (Admin only)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetAuditLogs(
        [FromQuery] Guid? userId = null,
        [FromQuery] Guid? documentId = null,
        [FromQuery] AuditAction? action = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (pageSize > 100) pageSize = 100; // Max 100 items per page

        var query = await _unitOfWork.AuditLogs.GetAllWithDetailsAsync();
        var filteredLogs = query.AsQueryable();

        // Apply filters
        if (userId.HasValue)
            filteredLogs = filteredLogs.Where(a => a.UserId == userId.Value);

        if (documentId.HasValue)
            filteredLogs = filteredLogs.Where(a => a.DocumentId == documentId.Value);

        if (action.HasValue)
            filteredLogs = filteredLogs.Where(a => a.Action == action.Value);

        if (fromDate.HasValue)
            filteredLogs = filteredLogs.Where(a => a.Timestamp >= fromDate.Value);

        if (toDate.HasValue)
            filteredLogs = filteredLogs.Where(a => a.Timestamp <= toDate.Value);

        // Order by timestamp descending (newest first)
        filteredLogs = filteredLogs.OrderByDescending(a => a.Timestamp);

        // Get total count
        var totalCount = filteredLogs.Count();

        // Apply pagination
        var logs = filteredLogs
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.UserId,
                Username = a.User != null ? a.User.Username : "N/A",
                UserFullName = a.User != null ? a.User.FullName : "Unknown",
                a.DocumentId,
                DocumentTitle = a.Document != null ? a.Document.Title : null,
                Action = a.Action.ToString(),
                a.Details,
                a.IpAddress,
                a.UserAgent,
                a.Timestamp
            })
            .ToList();

        return Ok(new
        {
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            Data = logs
        });
    }

    /// <summary>
    /// Get audit log by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetAuditLog(Guid id)
    {
        var log = await _unitOfWork.AuditLogs.GetByIdAsync(id);

        if (log == null)
            return NotFound();

        return Ok(new
        {
            log.Id,
            log.UserId,
            Username = log.User?.Username,
            UserFullName = log.User?.FullName,
            log.DocumentId,
            DocumentTitle = log.Document?.Title,
            Action = log.Action.ToString(),
            log.Details,
            log.IpAddress,
            log.UserAgent,
            log.Timestamp
        });
    }

    /// <summary>
    /// Get audit logs for a specific user (Admin only)
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<object>>> GetUserAuditLogs(Guid userId, [FromQuery] int limit = 50)
    {
        var logs = await _unitOfWork.AuditLogs.FindAsync(a => a.UserId == userId);

        var result = logs
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .Select(a => new
            {
                a.Id,
                Action = a.Action.ToString(),
                a.DocumentId,
                DocumentTitle = a.Document?.Title,
                a.Details,
                a.IpAddress,
                a.Timestamp
            });

        return Ok(result);
    }

    /// <summary>
    /// Get audit logs for a specific document (Admin only)
    /// </summary>
    [HttpGet("document/{documentId}")]
    public async Task<ActionResult<IEnumerable<object>>> GetDocumentAuditLogs(Guid documentId)
    {
        var logs = await _unitOfWork.AuditLogs.FindAsync(a => a.DocumentId == documentId);

        var result = logs
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new
            {
                a.Id,
                a.UserId,
                Username = a.User?.Username,
                UserFullName = a.User?.FullName,
                Action = a.Action.ToString(),
                a.Details,
                a.IpAddress,
                a.Timestamp
            });

        return Ok(result);
    }

    /// <summary>
    /// Get audit statistics (Admin only)
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<object>> GetStatistics([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
    {
        var logs = await _unitOfWork.AuditLogs.GetAllWithDetailsAsync();
        var filteredLogs = logs.AsQueryable();

        if (fromDate.HasValue)
            filteredLogs = filteredLogs.Where(a => a.Timestamp >= fromDate.Value);

        if (toDate.HasValue)
            filteredLogs = filteredLogs.Where(a => a.Timestamp <= toDate.Value);

        var statistics = new
        {
            TotalActions = filteredLogs.Count(),
            ActionsByType = filteredLogs
                .GroupBy(a => a.Action)
                .Select(g => new { Action = g.Key.ToString(), Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList(),
            TopUsers = filteredLogs
                .GroupBy(a => new { UserId = a.UserId, Username = a.User != null ? a.User.Username : "N/A", FullName = a.User != null ? a.User.FullName : "Unknown" })
                .Select(g => new
                {
                    UserId = g.Key.UserId,
                    Username = g.Key.Username,
                    FullName = g.Key.FullName,
                    ActionCount = g.Count()
                })
                .OrderByDescending(x => x.ActionCount)
                .Take(10)
                .ToList(),
            RecentActivity = filteredLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(20)
                .Select(a => new
                {
                    Action = a.Action.ToString(),
                    Username = a.User != null ? a.User.Username : "N/A",
                    a.Timestamp
                })
                .ToList()
        };

        return Ok(statistics);
    }

    /// <summary>
    /// Get Clerk document view logs (Admin only)
    /// </summary>
    /// <param name="timeRange">Time range filter: 'day' (default), 'week', or 'month'</param>
    /// <param name="limit">Maximum number of records to return</param>
    [HttpGet("clerk-views")]
    public async Task<ActionResult<IEnumerable<object>>> GetClerkDocumentViews(
        [FromQuery] string timeRange = "day",
        [FromQuery] int limit = 30)
    {
        var query = _unitOfWork.AuditLogs.GetQueryableWithDetails();

        // Calculate date filter based on timeRange
        DateTime startDate;
        var now = DateTime.UtcNow;
        
        switch (timeRange.ToLower())
        {
            case "week":
                startDate = now.AddDays(-7);
                break;
            case "month":
                startDate = now.AddMonths(-1);
                break;
            case "day":
            default:
                // Use last 24 hours to ensure "Today" work is visible across timezones
                // Alternatively: startDate = now.AddHours(-12); or specialized "Today" logic
                // Using AddDays(-1) covers anyone who viewed in the last 24h.
                startDate = now.AddDays(-1); 
                break;
        }

        // Filter for View actions by Clerk role users within the time range
        var clerkViews = await query
            .Where(a => a.Action == AuditAction.View 
                && a.User != null 
                && a.User.Role != null 
                && a.User.Role.Code.ToUpper() == "CLERK"
                && a.Timestamp >= startDate)
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .Select(a => new
            {
                a.Id,
                ClerkId = a.UserId,
                ClerkName = a.User!.FullName,
                ClerkUsername = a.User.Username,
                a.DocumentId,
                DocumentTitle = a.Document != null ? a.Document.Title : "Unknown Document",
                ViewedAt = a.Timestamp,
                a.IpAddress
            })
            .ToListAsync();

        return Ok(clerkViews);
    }

    /// <summary>
    /// Soft delete audit log (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = CustomPermissions.AuditLogs.Delete)]
    public async Task<IActionResult> DeleteAuditLog(Guid id)
    {
        var log = await _unitOfWork.AuditLogs.GetByIdAsync(id);

        if (log == null)
            return NotFound();

        _unitOfWork.AuditLogs.SoftDelete(log);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }
}
