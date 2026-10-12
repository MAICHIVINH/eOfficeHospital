using Microsoft.EntityFrameworkCore.Storage;
using QLVB.Domain.Entities;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Data;

namespace QLVB.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    public IUserRepository Users { get; }
    public IDocumentRepository Documents { get; }
    public IRepository<Department> Departments { get; }
    public IRepository<DocumentAssignment> DocumentAssignments { get; }
    public IRepository<DocumentDistribution> DocumentDistributions { get; }
    public IRepository<Role> Roles { get; }
    public IRepository<Permission> Permissions { get; }
    public IAuditLogRepository AuditLogs { get; }
    public IRepository<IssuingAgency> IssuingAgencies { get; }
    public IRepository<DepartmentOpinion> DepartmentOpinions { get; }

    public UnitOfWork(
        ApplicationDbContext context,
        IUserRepository userRepository,
        IDocumentRepository documentRepository)
    {
        _context = context;
        Users = userRepository;
        Documents = documentRepository;
        Departments = new Repository<Department>(context);
        DocumentAssignments = new Repository<DocumentAssignment>(context);
        DocumentDistributions = new Repository<DocumentDistribution>(context);
        Roles = new Repository<Role>(context);
        Permissions = new Repository<Permission>(context);
        AuditLogs = new AuditLogRepository(context);
        IssuingAgencies = new Repository<IssuingAgency>(context);
        DepartmentOpinions = new Repository<DepartmentOpinion>(context);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
