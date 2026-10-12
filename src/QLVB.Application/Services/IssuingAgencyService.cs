using QLVB.Application.DTOs.IssuingAgencies;
using QLVB.Domain.Entities;
using QLVB.Domain.Interfaces;

namespace QLVB.Application.Services;

public interface IIssuingAgencyService
{
    Task<IEnumerable<IssuingAgencyDto>> GetAllAsync(bool activeOnly = false, CancellationToken cancellationToken = default);
    Task<IssuingAgencyDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IssuingAgencyDto> CreateAsync(CreateIssuingAgencyDto dto, CancellationToken cancellationToken = default);
    Task<IssuingAgencyDto> UpdateAsync(Guid id, UpdateIssuingAgencyDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class IssuingAgencyService : IIssuingAgencyService
{
    private readonly IUnitOfWork _unitOfWork;

    public IssuingAgencyService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<IssuingAgencyDto>> GetAllAsync(bool activeOnly = false, CancellationToken cancellationToken = default)
    {
        var agencies = await _unitOfWork.IssuingAgencies.GetAllAsync(cancellationToken);

        if (activeOnly)
            agencies = agencies.Where(a => a.IsActive);

        return agencies.OrderBy(a => a.Name).Select(a => new IssuingAgencyDto
        {
            Id = a.Id,
            Name = a.Name,
            Code = a.Code,
            AgencyType = a.AgencyType,
            Address = a.Address,
            PhoneNumber = a.PhoneNumber,
            Notes = a.Notes,
            IsActive = a.IsActive,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,
            DocumentCount = a.Documents?.Count ?? 0
        });
    }

    public async Task<IssuingAgencyDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var agency = await _unitOfWork.IssuingAgencies.GetByIdAsync(id, cancellationToken);
        if (agency == null) return null;

        return new IssuingAgencyDto
        {
            Id = agency.Id,
            Name = agency.Name,
            Code = agency.Code,
            AgencyType = agency.AgencyType,
            Address = agency.Address,
            PhoneNumber = agency.PhoneNumber,
            Notes = agency.Notes,
            IsActive = agency.IsActive,
            CreatedAt = agency.CreatedAt,
            UpdatedAt = agency.UpdatedAt,
            DocumentCount = agency.Documents?.Count ?? 0
        };
    }

    public async Task<IssuingAgencyDto> CreateAsync(CreateIssuingAgencyDto dto, CancellationToken cancellationToken = default)
    {
        // Check for duplicate code
        bool codeExists = await _unitOfWork.IssuingAgencies.AnyAsync(a => a.Code == dto.Code, cancellationToken);
        if (codeExists)
            throw new ArgumentException($"Mã cơ quan '{dto.Code}' đã tồn tại trong hệ thống.");

        var agency = new IssuingAgency
        {
            Name = dto.Name.Trim(),
            Code = dto.Code.Trim().ToUpper(),
            AgencyType = dto.AgencyType.Trim(),
            Address = dto.Address?.Trim(),
            PhoneNumber = dto.PhoneNumber?.Trim(),
            Notes = dto.Notes?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.IssuingAgencies.AddAsync(agency, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new IssuingAgencyDto
        {
            Id = agency.Id,
            Name = agency.Name,
            Code = agency.Code,
            AgencyType = agency.AgencyType,
            Address = agency.Address,
            PhoneNumber = agency.PhoneNumber,
            Notes = agency.Notes,
            IsActive = agency.IsActive,
            CreatedAt = agency.CreatedAt
        };
    }

    public async Task<IssuingAgencyDto> UpdateAsync(Guid id, UpdateIssuingAgencyDto dto, CancellationToken cancellationToken = default)
    {
        var agency = await _unitOfWork.IssuingAgencies.GetByIdAsync(id, cancellationToken);
        if (agency == null)
            throw new ArgumentException("Không tìm thấy cơ quan ban hành.");

        // Check for duplicate code (excluding self)
        bool codeExists = await _unitOfWork.IssuingAgencies.AnyAsync(a => a.Code == dto.Code && a.Id != id, cancellationToken);
        if (codeExists)
            throw new ArgumentException($"Mã cơ quan '{dto.Code}' đã tồn tại trong hệ thống.");

        agency.Name = dto.Name.Trim();
        agency.Code = dto.Code.Trim().ToUpper();
        agency.AgencyType = dto.AgencyType.Trim();
        agency.Address = dto.Address?.Trim();
        agency.PhoneNumber = dto.PhoneNumber?.Trim();
        agency.Notes = dto.Notes?.Trim();
        agency.IsActive = dto.IsActive;
        agency.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.IssuingAgencies.Update(agency);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new IssuingAgencyDto
        {
            Id = agency.Id,
            Name = agency.Name,
            Code = agency.Code,
            AgencyType = agency.AgencyType,
            Address = agency.Address,
            PhoneNumber = agency.PhoneNumber,
            Notes = agency.Notes,
            IsActive = agency.IsActive,
            CreatedAt = agency.CreatedAt,
            UpdatedAt = agency.UpdatedAt
        };
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var agency = await _unitOfWork.IssuingAgencies.GetByIdAsync(id, cancellationToken);
        if (agency == null)
            throw new ArgumentException("Không tìm thấy cơ quan ban hành.");

        agency.IsDeleted = true;
        agency.DeletedAt = DateTime.UtcNow;
        _unitOfWork.IssuingAgencies.Update(agency);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
