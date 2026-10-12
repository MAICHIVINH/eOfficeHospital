using Microsoft.EntityFrameworkCore;
using QLVB.Application.DTOs.Notifications;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Infrastructure.Data;

namespace QLVB.Application.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationSender _notificationSender;

    public NotificationService(
        ApplicationDbContext context,
        INotificationSender notificationSender)
    {
        _context = context;
        _notificationSender = notificationSender;
    }

    public async Task<NotificationDto> CreateAndSendAsync(CreateNotificationDto dto)
    {
        // Create notification in database
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            Title = dto.Title,
            Message = dto.Message,
            Type = dto.Type,
            Link = dto.Link,
            DocumentId = dto.DocumentId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Send real-time notification via SignalR to specific user
        try
        {
            await _notificationSender.SendToUserAsync(dto.UserId.ToString(), MapToSignalRObject(notification));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SignalR send failed for user {dto.UserId}: {ex.Message}");
        }

        // CC to all other Admins (except the recipient if they are an admin)
        var adminUsers = await _context.Users
            .Where(u => u.Role.Code == "ADMIN" && u.Id != dto.UserId && u.IsActive && !u.IsDeleted)
            .ToListAsync();

        foreach (var admin in adminUsers)
        {
            var adminCopy = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = admin.Id,
                Title = $"[CC] {dto.Title}",
                Message = $"Gửi tới {(_context.Users.Find(dto.UserId)?.FullName ?? "người dùng")}: {dto.Message}",
                Type = dto.Type,
                Link = dto.Link,
                DocumentId = dto.DocumentId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(adminCopy);
            
            try
            {
                await _notificationSender.SendToUserAsync(admin.Id.ToString(), MapToSignalRObject(adminCopy));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SignalR send failed for admin {admin.Id}: {ex.Message}");
            }
        }
        await _context.SaveChangesAsync();

        return MapToDto(notification);
    }

    private object MapToSignalRObject(Notification n) => new
    {
        id = n.Id,
        title = n.Title,
        message = n.Message,
        type = n.Type.ToString(),
        link = n.Link,
        isRead = n.IsRead,
        createdAt = n.CreatedAt
    };

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 20)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return notifications.Select(MapToDto).ToList();
    }

    public async Task<NotificationSummaryDto> GetNotificationSummaryAsync(Guid userId)
    {
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        var recentNotifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();

        return new NotificationSummaryDto
        {
            UnreadCount = unreadCount,
            RecentNotifications = recentNotifications.Select(MapToDto).ToList()
        };
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeleteNotificationAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null)
        {
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<NotificationDto>> GetAllNotificationsAsync(int limit = 100)
    {
        var notifications = await _context.Notifications
            .Include(n => n.User)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return notifications.Select(n => {
            var dto = MapToDto(n);
            dto.UserId = n.UserId;
            dto.UserFullName = n.User?.FullName;
            return dto;
        }).ToList();
    }

    public async Task AdminDeleteAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
        }
    }

    private static NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type,
            Link = notification.Link,
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            CreatedAt = notification.CreatedAt,
            DocumentId = notification.DocumentId,
            UserId = notification.UserId,
            UserFullName = notification.User?.FullName
        };
    }
}
