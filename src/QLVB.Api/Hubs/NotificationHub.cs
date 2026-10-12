using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace QLVB.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time notifications
/// </summary>
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            Console.WriteLine($"User {userId} connected with ConnectionId: {Context.ConnectionId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            Console.WriteLine($"User {userId} disconnected");
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Mark notification as read (called from client)
    /// </summary>
    public async Task MarkAsRead(string notificationId)
    {
        // This will be handled by the NotificationService via API call
        await Task.CompletedTask;
    }
}
