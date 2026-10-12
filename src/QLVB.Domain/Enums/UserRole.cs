namespace QLVB.Domain.Enums;

/// <summary>
/// Vai trò người dùng trong hệ thống
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Quản trị viên - Toàn quyền
    /// </summary>
    Admin = 1,
    
    /// <summary>
    /// Quản lý - Upload, phân công văn bản
    /// </summary>
    Manager = 2,
    
    /// <summary>
    /// Nhân viên - Chỉ xem văn bản được phân công
    /// </summary>
    Staff = 3
}
