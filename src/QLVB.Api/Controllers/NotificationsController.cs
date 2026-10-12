using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.DTOs.Notifications;
using QLVB.Application.Services;
using System.Security.Claims;
using QLVB.Domain.Interfaces;
using QLVB.Domain.Enums;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationsController(INotificationService notificationService, IUnitOfWork unitOfWork)
    {
        _notificationService = notificationService;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy tóm tắt thông báo (số chưa đọc + danh sách gần nhất)
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<NotificationSummaryDto>> GetSummary()
    {
        var userId = GetCurrentUserId();
        var summary = await _notificationService.GetNotificationSummaryAsync(userId);
        return Ok(summary);
    }

    /// <summary>
    /// Lấy danh sách thông báo
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetNotifications([FromQuery] int limit = 20)
    {
        var userId = GetCurrentUserId();
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, limit);
        return Ok(notifications);
    }

    /// <summary>
    /// Đánh dấu thông báo đã đọc
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAsReadAsync(id, userId);
        return Ok(new { message = "Đã đánh dấu đọc thông báo" });
    }

    /// <summary>
    /// Đánh dấu tất cả đã đọc
    /// </summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(new { message = "Đã đánh dấu đọc tất cả thông báo" });
    }

    /// <summary>
    /// Xóa thông báo
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        var userId = GetCurrentUserId();
        await _notificationService.DeleteNotificationAsync(id, userId);
        return Ok(new { message = "Đã xóa thông báo" });
    }
    
    [HttpPost("broadcast")]
    [Authorize(Policy = QLVB.Domain.Constants.CustomPermissions.Users.Create)] // Using a high-level perm as proxy for Admin
    public async Task<IActionResult> Broadcast([FromBody] CreateNotificationDto dto)
    {
        var allUsers = await _unitOfWork.Users.FindAsync(u => u.IsActive && !u.IsDeleted);
        foreach (var user in allUsers)
        {
            await _notificationService.CreateAndSendAsync(new CreateNotificationDto
            {
                UserId = user.Id,
                Title = dto.Title ?? "Thông báo hệ thống",
                Message = dto.Message,
                Type = NotificationType.SystemMaintenance,
                Link = dto.Link
            });
        }
        return Ok(new { message = $"Đã gửi thông báo tới {allUsers.Count()} người dùng" });
    }

    /// <summary>
    /// Lấy toàn bộ thông báo hệ thống (Admin)
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Policy = QLVB.Domain.Constants.CustomPermissions.Notifications.View)]
    public async Task<ActionResult<List<NotificationDto>>> GetAdminNotifications([FromQuery] int limit = 100)
    {
        var notifications = await _notificationService.GetAllNotificationsAsync(limit);
        return Ok(notifications);
    }

    /// <summary>
    /// Xóa bất kỳ thông báo nào (Admin)
    /// </summary>
    [HttpDelete("admin/{id}")]
    [Authorize(Policy = QLVB.Domain.Constants.CustomPermissions.Notifications.Delete)]
    public async Task<IActionResult> AdminDeleteNotification(Guid id)
    {
        await _notificationService.AdminDeleteAsync(id);
        return Ok(new { message = "Đã xóa thông báo hệ thống" });
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Không tìm thấy thông tin người dùng");
        }
        return userId;
    }
}
