using QLVB.Domain.Entities;
using QLVB.Domain.Enums;

namespace QLVB.Domain.Interfaces;

/// <summary>
/// Document repository interface
/// </summary>
public interface IDocumentRepository : IRepository<Document>
{
    Task<IEnumerable<Document>> GetByCreatorIdAsync(Guid creatorId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Document>> GetAssignedDocumentsAsync(Guid userId, Guid? departmentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Document>> GetByDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Document>> GetPublicSentDocumentsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Document>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Document>> GetByOpinionRequestedDepartmentIdAsync(Guid departmentId, CancellationToken cancellationToken = default);
    Task<Document?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
