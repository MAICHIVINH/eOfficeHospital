using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Data;

namespace QLVB.Infrastructure.Repositories;

public class DocumentRepository : Repository<Document>, IDocumentRepository
{
    public DocumentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Document>> GetByCreatorIdAsync(Guid creatorId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.CreatedById == creatorId)
            .Include(d => d.CreatedBy)
            .Include(d => d.SignedBy)
            .Include(d => d.IssuedBy)
            .Include(d => d.RejectedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Department)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedTo)
            .Include(d => d.DepartmentOpinions)
            .Include(d => d.IssuingAgency)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Document>> GetAssignedDocumentsAsync(Guid userId, Guid? departmentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.Assignments.Any(a => 
                (a.AssignedToUserId == userId) || 
                (departmentId.HasValue && a.DepartmentId == departmentId.Value)
            ) || d.Distributions.Any(dist => 
                departmentId.HasValue && dist.DepartmentId == departmentId.Value
            ))
            .Include(d => d.CreatedBy)
            .Include(d => d.SignedBy)
            .Include(d => d.IssuedBy)
            .Include(d => d.RejectedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Department)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedTo)
            .Include(d => d.DepartmentOpinions)
            .Include(d => d.Distributions)
            .Include(d => d.IssuingAgency)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Document>> GetByDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.CreatedBy.DepartmentId == departmentId || 
                       d.Distributions.Any(dist => dist.DepartmentId == departmentId))
            .Include(d => d.CreatedBy)
            .Include(d => d.SignedBy)
            .Include(d => d.IssuedBy)
            .Include(d => d.RejectedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Department)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedTo)
            .Include(d => d.DepartmentOpinions)
            .Include(d => d.Distributions)
            .Include(d => d.IssuingAgency)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Document>> GetPublicSentDocumentsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.SecurityLevel == SecurityLevel.Public && 
                  (d.WorkflowStatus == DocumentWorkflowStatus.Sent || d.WorkflowStatus == DocumentWorkflowStatus.IncomingApproved))
            .Include(d => d.CreatedBy)
            .Include(d => d.SignedBy)
            .Include(d => d.IssuedBy)
            .Include(d => d.RejectedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Department)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedTo)
            .Include(d => d.DepartmentOpinions)
            .Include(d => d.IssuingAgency)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Document>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(d => d.CreatedBy)
            .Include(d => d.SignedBy)
            .Include(d => d.IssuedBy)
            .Include(d => d.RejectedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Department)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedTo)
            .Include(d => d.DepartmentOpinions)
            .Include(d => d.IssuingAgency)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Document?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(d => d.CreatedBy)
                .ThenInclude(u => u.Department)
            .Include(d => d.SignedBy)
            .Include(d => d.IssuedBy)
            .Include(d => d.RejectedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Department)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedTo)
            .Include(d => d.DepartmentOpinions)
            .Include(d => d.IssuingAgency)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Document>> GetByOpinionRequestedDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.DepartmentOpinions.Any(o => o.DepartmentId == departmentId))
            .Include(d => d.CreatedBy)
            .Include(d => d.SignedBy)
            .Include(d => d.IssuedBy)
            .Include(d => d.RejectedBy)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.Department)
            .Include(d => d.Assignments)
                .ThenInclude(a => a.AssignedTo)
            .Include(d => d.DepartmentOpinions)
            .Include(d => d.IssuingAgency)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
