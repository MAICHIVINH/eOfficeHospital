using Microsoft.EntityFrameworkCore;
using QLVB.Application.DTOs.Auth;
using QLVB.Domain.Entities;
using QLVB.Infrastructure.Data;

namespace QLVB.Application.Services;

public class RoleService : IRoleService
{
    private readonly ApplicationDbContext _context;

    public RoleService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<RoleDto> Items, int TotalCount)> GetRolesAsync(RoleFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var searchTerm = filter.Search.ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(searchTerm) || r.Code.ToLower().Contains(searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var roles = await query
            .OrderBy(r => r.Code)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var items = roles.Select(r => new RoleDto(
            r.Id,
            r.Code,
            r.Name,
            r.Description,
            r.IsSystemRole,
            r.CreatedAt,
            r.RolePermissions.Select(rp => new PermissionDto(
                rp.Permission.Id,
                rp.Permission.Code,
                rp.Permission.Name,
                rp.Permission.Description,
                rp.Permission.Category
            ))
        ));

        return (items, totalCount);
    }

    public async Task<RoleDto?> GetRoleByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (role == null) return null;

        return new RoleDto(
            role.Id,
            role.Code,
            role.Name,
            role.Description,
            role.IsSystemRole,
            role.CreatedAt,
            role.RolePermissions.Select(rp => new PermissionDto(
                rp.Permission.Id,
                rp.Permission.Code,
                rp.Permission.Name,
                rp.Permission.Description,
                rp.Permission.Category
            ))
        );
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleDto dto, CancellationToken cancellationToken = default)
    {
        // Check if code already exists
        if (await _context.Roles.AnyAsync(r => r.Code == dto.Code, cancellationToken))
            throw new ArgumentException($"Vai trò với mã '{dto.Code}' đã tồn tại");

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            Description = dto.Description,
            IsSystemRole = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Roles.AddAsync(role, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new RoleDto(role.Id, role.Code, role.Name, role.Description, role.IsSystemRole, role.CreatedAt, Enumerable.Empty<PermissionDto>());
    }

    public async Task UpdateRoleAsync(Guid id, UpdateRoleDto dto, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles.FindAsync(new object[] { id }, cancellationToken);
        if (role == null)
            throw new ArgumentException("Không tìm thấy vai trò");

        if (role.IsSystemRole)
            throw new InvalidOperationException("Không thể chỉnh sửa vai trò hệ thống");

        role.Name = dto.Name;
        role.Description = dto.Description;
        role.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteRoleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.Users)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (role == null)
            throw new ArgumentException("Không tìm thấy vai trò");

        if (role.IsSystemRole)
            throw new InvalidOperationException("Không thể xóa các vai trò hệ thống (ADMIN, MANAGER, STAFF)");


        role.IsDeleted = true;
        role.DeletedAt = DateTime.UtcNow;
        role.UpdatedAt = DateTime.UtcNow;

        _context.Roles.Update(role);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AssignPermissionsToRoleAsync(Guid roleId, AssignPermissionsDto dto, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

        if (role == null)
            throw new ArgumentException("Không tìm thấy vai trò");

        // Admin role always has all permissions - cannot be modified
        if (role.Code == "ADMIN")
            throw new InvalidOperationException("Không thể chỉnh sửa quyền của vai trò Admin - Admin luôn có đầy đủ tất cả các quyền");

        // Remove existing permissions
        _context.RolePermissions.RemoveRange(role.RolePermissions);

        // Add new permissions
        var newPermissions = dto.PermissionIds.Distinct().Select(permissionId => new RolePermission
        {
            RoleId = roleId,
            PermissionId = permissionId,
            AssignedAt = DateTime.UtcNow
        });

        await _context.RolePermissions.AddRangeAsync(newPermissions, cancellationToken);
        role.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<UserDto>> GetRoleUsersAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        var users = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Department)
            .Where(u => u.RoleId == roleId)
            .ToListAsync(cancellationToken);

        return users.Select(u => new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            FullName = u.FullName,
            Email = u.Email,
            Role = u.Role.Name,
            DepartmentId = u.DepartmentId,
            DepartmentName = u.Department?.Name
        });
    }
}
