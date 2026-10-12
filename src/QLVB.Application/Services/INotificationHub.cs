namespace QLVB.Application.Services;

/// <summary>
/// Abstraction for sending real-time notifications (implemented in Api layer)
/// </summary>
public interface INotificationSender
{
    Task SendToUserAsync(string userId, object notification);
}
