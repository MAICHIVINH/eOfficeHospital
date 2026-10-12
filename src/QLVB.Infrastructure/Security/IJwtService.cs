using QLVB.Domain.Entities;

namespace QLVB.Infrastructure.Security;

public interface IJwtService
{
    string GenerateToken(User user);
    Guid? ValidateToken(string token);
    Guid? GetUserIdFromToken(string token);
}
