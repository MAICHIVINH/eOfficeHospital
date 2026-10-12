using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Entities;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Data;
using System.Linq.Expressions;

namespace QLVB.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.Department)
            .ToListAsync(cancellationToken);
    }

    public override async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<bool> UsernameExistsIgnoreFilterAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters().AnyAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<bool> EmailExistsIgnoreFilterAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters().AnyAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<IEnumerable<User>> GetByDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(u => u.DepartmentId == departmentId)
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .Include(u => u.Department)
            .ToListAsync(cancellationToken);
    }

    public override async Task<(IEnumerable<User> Items, int TotalCount)> GetPagedAsync(
        int pageNumber, 
        int pageSize, 
        Expression<Func<User, bool>>? predicate = null,
        Func<IQueryable<User>, IOrderedQueryable<User>>? orderBy = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<User> query = _dbSet
            .Include(u => u.Role)
            .Include(u => u.Department);

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        int totalCount = await query.CountAsync(cancellationToken);

        if (orderBy != null)
        {
            query = orderBy(query);
        }

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
    public async Task<User?> GetByEmailConfirmationTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.EmailConfirmationToken == token, cancellationToken);
    }

    public async Task<IEnumerable<User>> GetUsersByRoleAsync(string roleCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.Department)
            .Where(u => u.Role != null && u.Role.Code == roleCode && u.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<User>> GetUsersByDepartmentAsync(Guid departmentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.Department)
            .Where(u => u.DepartmentId == departmentId && u.IsActive)
            .ToListAsync(cancellationToken);
    }
}
