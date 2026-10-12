using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Data;
using System.Linq.Expressions;

namespace QLVB.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task<(IEnumerable<T> Items, int TotalCount)> GetPagedAsync(
        int pageNumber, 
        int pageSize, 
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<T> query = _dbSet;

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

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(predicate).ToListAsync(cancellationToken);
    }

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddRangeAsync(entities, cancellationToken);
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Remove(T entity)
    {
        _dbSet.Remove(entity);
    }

    public void RemoveRange(IEnumerable<T> entities)
    {
        _dbSet.RemoveRange(entities);
    }

    public virtual void SoftDelete(T entity)
    {
        var isDeletedProp = entity.GetType().GetProperty("IsDeleted");
        var deletedAtProp = entity.GetType().GetProperty("DeletedAt");

        if (isDeletedProp != null && isDeletedProp.PropertyType == typeof(bool))
        {
            isDeletedProp.SetValue(entity, true);
        }

        if (deletedAtProp != null && (deletedAtProp.PropertyType == typeof(DateTime) || deletedAtProp.PropertyType == typeof(DateTime?)))
        {
            deletedAtProp.SetValue(entity, DateTime.UtcNow);
        }

        _dbSet.Update(entity);
    }

    public virtual async Task<IEnumerable<T>> GetDeletedAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters()
            .Where(e => EF.Property<bool>(e, "IsDeleted") == true)
            .ToListAsync(cancellationToken);
    }

    public virtual async Task<T?> GetDeletedByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id && EF.Property<bool>(e, "IsDeleted") == true, cancellationToken);
    }

    public virtual async Task RestoreAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetDeletedByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            var isDeletedProp = entity.GetType().GetProperty("IsDeleted");
            var deletedAtProp = entity.GetType().GetProperty("DeletedAt");

            if (isDeletedProp != null) isDeletedProp.SetValue(entity, false);
            if (deletedAtProp != null) deletedAtProp.SetValue(entity, (DateTime?)null);

            _dbSet.Update(entity);
        }
    }

    public virtual async Task PermanentDeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbSet.IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id, cancellationToken);
        
        if (entity != null)
        {
            _dbSet.Remove(entity);
        }
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        if (predicate == null)
            return await _dbSet.CountAsync(cancellationToken);

        return await _dbSet.CountAsync(predicate, cancellationToken);
    }

    public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(predicate, cancellationToken);
    }
}
