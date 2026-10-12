using QLVB.Application.DTOs.Notifications;
using QLVB.Domain.Enums;

namespace QLVB.Application.Services;

public interface INotificationService
{
    /// <summary>
    /// Tạo và gửi thông báo real-time
    /// </summary>
    Task<NotificationDto> CreateAndSendAsync(CreateNotificationDto dto);

    /// <summary>
    /// Lấy danh sách thông báo của user
    /// </summary>
    Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 20);

    /// <summary>
    /// Lấy tóm tắt thông báo (số chưa đọc + danh sách gần nhất)
    /// </summary>
    Task<NotificationSummaryDto> GetNotificationSummaryAsync(Guid userId);

    /// <summary>
    /// Đánh dấu đã đọc
    /// </summary>
    Task MarkAsReadAsync(Guid notificationId, Guid userId);

    /// <summary>
    /// Đánh dấu tất cả đã đọc
    /// </summary>
    Task MarkAllAsReadAsync(Guid userId);

    /// <summary>
    /// Xóa thông báo
    /// </summary>
    Task DeleteNotificationAsync(Guid notificationId, Guid userId);

    /// <summary>
    /// Lấy tất cả thông báo (Admin)
    /// </summary>
    Task<List<NotificationDto>> GetAllNotificationsAsync(int limit = 100);

    /// <summary>
    /// Xóa bất kỳ thông báo nào (Admin)
    /// </summary>
    Task AdminDeleteAsync(Guid notificationId);
}
