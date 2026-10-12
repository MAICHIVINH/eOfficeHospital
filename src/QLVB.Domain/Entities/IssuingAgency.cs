namespace QLVB.Domain.Entities;

/// <summary>
/// Cơ quan ban hành văn bản đến
/// </summary>
public class IssuingAgency
{
    public Guid Id { get; set; }

    /// <summary>
    /// Tên cơ quan ban hành
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Mã rút gọn (VD: SYT-DN, BYT, UBND-TDN)
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Loại cơ quan ban hành (VD: Bộ, Sở, UBND, Bệnh viện, Khác)
    /// </summary>
    public string AgencyType { get; set; } = string.Empty;

    /// <summary>
    /// Địa chỉ cơ quan
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Số điện thoại liên hệ
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Ghi chú thêm
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Trạng thái hoạt động
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Soft delete
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
