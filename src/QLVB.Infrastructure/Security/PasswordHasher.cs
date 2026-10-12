namespace QLVB.Infrastructure.Security;

/// <summary>
/// Password hashing service using BCrypt
/// </summary>
public class PasswordHasher
{
    /// <summary>
    /// Hash a password using BCrypt with 12 work factor
    /// </summary>
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    }

    /// <summary>
    /// Verify a password against a hash
    /// </summary>
    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
