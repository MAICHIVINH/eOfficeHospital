using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Entities;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Data;

namespace QLVB.Infrastructure.Repositories;

public class AuditLogRepository : Repository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(ApplicationDbContext context) : base(context)
    {
    }

    public IQueryable<AuditLog> GetQueryableWithDetails()
    {
        return _dbSet
            .Include(a => a.User)
                .ThenInclude(u => u.Role)
            .Include(a => a.Document)
            .AsQueryable();
    }

    public async Task<IEnumerable<AuditLog>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.User)
                .ThenInclude(u => u.Role)
            .Include(a => a.Document)
            .ToListAsync(cancellationToken);
    }

    public override async Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.User)
            .Include(a => a.Document)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<AuditLog>> GetByDocumentIdAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.User)
            .Where(a => a.DocumentId == documentId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync(cancellationToken);
    }
}
