using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Entities;
using QLVB.Infrastructure.Data;

namespace QLVB.Application.Services;

public class PermissionService : IPermissionService
{
    private readonly ApplicationDbContext _context;

    public PermissionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PermissionDto>> GetPermissionsAsync(CancellationToken cancellationToken = default)
    {
        var permissions = await _context.Permissions
            .OrderBy(p => p.Category)
            .ThenBy(p => p.Name)
            .ToListAsync(cancellationToken);

        return permissions.Select(p => new PermissionDto(p.Id, p.Code, p.Name, p.Description, p.Category));
    }

    public async Task<PermissionDto?> GetPermissionByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var permission = await _context.Permissions.FindAsync(new object[] { id }, cancellationToken);
        if (permission == null) return null;

        return new PermissionDto(permission.Id, permission.Code, permission.Name, permission.Description, permission.Category);
    }

    public async Task<PermissionDto> CreatePermissionAsync(CreatePermissionDto dto, CancellationToken cancellationToken = default)
    {
        // Validation: Name and Code must not be empty
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên quyền không được để trống");
        
        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new ArgumentException("Mã quyền không được để trống");

        // Validation: Code must start with "Permissions."
        if (!dto.Code.StartsWith("Permissions.", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Mã quyền phải bắt đầu bằng 'Permissions.' (ví dụ: Permissions.Documents.View)");

        // Check if code already exists
        if (await _context.Permissions.AnyAsync(p => p.Code == dto.Code, cancellationToken))
            throw new ArgumentException($"Mã quyền '{dto.Code}' đã tồn tại trong hệ thống");

        var permission = new Permission
        {
            Id = Guid.NewGuid(),
            Code = dto.Code,
            Name = dto.Name,
            Description = dto.Description,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Khác" : dto.Category,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Permissions.AddAsync(permission, cancellationToken);
        
        // --- AUTO-ASSIGN TO ADMIN ROLE ---
        // Find ADMIN role (hardcoded in DbInitializer)
        var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var adminRole = await _context.Roles.FindAsync(new object[] { adminRoleId }, cancellationToken);
        
        if (adminRole != null)
        {
            await _context.RolePermissions.AddAsync(new RolePermission 
            { 
                RoleId = adminRole.Id, 
                PermissionId = permission.Id,
                AssignedAt = DateTime.UtcNow
            }, cancellationToken);
        }
        
        await _context.SaveChangesAsync(cancellationToken);

        return new PermissionDto(permission.Id, permission.Code, permission.Name, permission.Description, permission.Category);
    }

    public async Task UpdatePermissionAsync(Guid id, UpdatePermissionDto dto, CancellationToken cancellationToken = default)
    {
        var permission = await _context.Permissions.FindAsync(new object[] { id }, cancellationToken);
        if (permission == null)
            throw new ArgumentException("Không tìm thấy quyền");
            
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên quyền không được để trống");

        permission.Name = dto.Name;
        permission.Description = dto.Description;
        permission.Category = string.IsNullOrWhiteSpace(dto.Category) ? "Khác" : dto.Category;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeletePermissionAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var permission = await _context.Permissions
            .Include(p => p.RolePermissions)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (permission == null)
            throw new ArgumentException("Permission not found");

        if (permission.RolePermissions.Any())
            throw new InvalidOperationException($"Cannot delete permission '{permission.Name}' because it is assigned to {permission.RolePermissions.Count} role(s)");

        permission.IsDeleted = true;
        permission.DeletedAt = DateTime.UtcNow;

        _context.Permissions.Update(permission);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<string>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Permissions
            .Select(p => p.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(cancellationToken);
    }
}
