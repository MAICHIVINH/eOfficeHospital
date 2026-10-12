using Microsoft.AspNetCore.SignalR;
using QLVB.Application.Services;

namespace QLVB.Api.Hubs;

/// <summary>
/// SignalR implementation of INotificationSender
/// </summary>
public class SignalRNotificationSender : INotificationSender
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationSender(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUserAsync(string userId, object notification)
    {
        await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification", notification);
    }
}
