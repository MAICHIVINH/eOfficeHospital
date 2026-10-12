namespace QLVB.Domain.Enums;

/// <summary>
/// Loại phát hành văn bản đi
/// </summary>
public enum DistributionType
{
    /// <summary>
    /// Phát hành nội bộ (chuyển khoa/phòng trong bệnh viện)
    /// </summary>
    Internal = 0,

    /// <summary>
    /// Phát hành ra ngoài (đối tác, cơ quan bên ngoài)
    /// </summary>
    External = 1
}
