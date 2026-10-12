using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace QLVB.Api.Hubs;

/// <summary>
/// Custom UserIdProvider for SignalR to use NameIdentifier claim
/// </summary>
public class NameIdentifierUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
