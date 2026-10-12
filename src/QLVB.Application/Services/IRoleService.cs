using QLVB.Application.DTOs.Auth;
using QLVB.Domain.Entities;

namespace QLVB.Application.Services;

// DTOs
public record RoleDto(Guid Id, string Code, string Name, string Description, bool IsSystemRole, DateTime CreatedAt, IEnumerable<PermissionDto> Permissions);
public record CreateRoleDto(string Code, string Name, string Description);
public record UpdateRoleDto(string Name, string Description);
public record AssignPermissionsDto(List<Guid> PermissionIds);
public class RoleFilterDto
{
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public interface IRoleService
{
    Task<(IEnumerable<RoleDto> Items, int TotalCount)> GetRolesAsync(RoleFilterDto filter, CancellationToken cancellationToken = default);
    Task<RoleDto?> GetRoleByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RoleDto> CreateRoleAsync(CreateRoleDto dto, CancellationToken cancellationToken = default);
    Task UpdateRoleAsync(Guid id, UpdateRoleDto dto, CancellationToken cancellationToken = default);
    Task DeleteRoleAsync(Guid id, CancellationToken cancellationToken = default);
    Task AssignPermissionsToRoleAsync(Guid roleId, AssignPermissionsDto dto, CancellationToken cancellationToken = default);
    Task<IEnumerable<UserDto>> GetRoleUsersAsync(Guid roleId, CancellationToken cancellationToken = default);
}
