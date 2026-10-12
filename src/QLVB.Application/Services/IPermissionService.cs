using QLVB.Domain.Entities;

namespace QLVB.Application.Services;

// DTOs
public record PermissionDto(Guid Id, string Code, string Name, string Description, string Category);
public record CreatePermissionDto(string Code, string Name, string Description, string Category);
public record UpdatePermissionDto(string Name, string Description, string Category);

public interface IPermissionService
{
    Task<IEnumerable<PermissionDto>> GetPermissionsAsync(CancellationToken cancellationToken = default);
    Task<PermissionDto?> GetPermissionByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PermissionDto> CreatePermissionAsync(CreatePermissionDto dto, CancellationToken cancellationToken = default);
    Task UpdatePermissionAsync(Guid id, UpdatePermissionDto dto, CancellationToken cancellationToken = default);
    Task DeletePermissionAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<string>> GetCategoriesAsync(CancellationToken cancellationToken = default);
}
