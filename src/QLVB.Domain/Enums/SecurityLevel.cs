namespace QLVB.Domain.Enums;

/// <summary>
/// Mức độ bảo mật văn bản
/// </summary>
public enum SecurityLevel
{
    /// <summary>
    /// Công khai
    /// </summary>
    Public = 1,
    
    /// <summary>
    /// Nội bộ
    /// </summary>
    Internal = 2,
    
    /// <summary>
    /// Mật
    /// </summary>
    Confidential = 3
}
