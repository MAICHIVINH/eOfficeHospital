namespace QLVB.Domain.Interfaces;

/// <summary>
/// Unit of Work pattern interface
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IDocumentRepository Documents { get; }
    IRepository<Entities.Department> Departments { get; }
    IRepository<Entities.DocumentAssignment> DocumentAssignments { get; }
    IRepository<Entities.DocumentDistribution> DocumentDistributions { get; }
    IRepository<Entities.Role> Roles { get; }
    IRepository<Entities.Permission> Permissions { get; }
    IAuditLogRepository AuditLogs { get; }
    IRepository<Entities.IssuingAgency> IssuingAgencies { get; }
    IRepository<Entities.DepartmentOpinion> DepartmentOpinions { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}

