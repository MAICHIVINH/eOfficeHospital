using QLVB.Domain.Entities;

namespace QLVB.Domain.Interfaces;

public interface IAuditLogRepository : IRepository<AuditLog>
{
    Task<IEnumerable<AuditLog>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<AuditLog>> GetByDocumentIdAsync(Guid documentId, CancellationToken cancellationToken = default);
    IQueryable<AuditLog> GetQueryableWithDetails();
}
