using QLVB.Domain.Entities;

namespace QLVB.Domain.Interfaces;

/// <summary>
/// User repository interface
/// </summary>
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsIgnoreFilterAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsIgnoreFilterAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetByDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailConfirmationTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetUsersByRoleAsync(string roleCode, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetUsersByDepartmentAsync(Guid departmentId, CancellationToken cancellationToken = default);
}
