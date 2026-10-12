namespace QLVB.Domain.Enums;

/// <summary>
/// Hành động được ghi audit log
/// </summary>
public enum AuditAction
{
    /// <summary>
    /// Đăng nhập
    /// </summary>
    Login = 1,
    
    /// <summary>
    /// Đăng xuất
    /// </summary>
    Logout = 2,
    
    /// <summary>
    /// Upload văn bản
    /// </summary>
    Upload = 3,
    
    /// <summary>
    /// Xem văn bản
    /// </summary>
    View = 4,
    
    /// <summary>
    /// Tải văn bản
    /// </summary>
    Download = 5,
    
    /// <summary>
    /// Chia sẻ văn bản
    /// </summary>
    Share = 6,
    
    /// <summary>
    /// Phân công văn bản
    /// </summary>
    Assign = 7,
    
    /// <summary>
    /// Cập nhật văn bản
    /// </summary>
    Update = 8,
    
    /// <summary>
    /// Cập nhật trạng thái
    /// </summary>
    UpdateStatus = 9,
    
    /// <summary>
    /// Xóa văn bản
    /// </summary>
    Delete = 10,
    
    /// <summary>
    /// Tạo người dùng
    /// </summary>
    CreateUser = 11,
    
    /// <summary>
    /// Cập nhật người dùng
    /// </summary>
    UpdateUser = 12,
    
    /// <summary>
    /// Xóa người dùng
    /// </summary>
    DeleteUser = 13,
    
    /// <summary>
    /// Đổi mật khẩu
    /// </summary>
    ChangePassword = 14,
    
    /// <summary>
    /// Tạo phòng ban
    /// </summary>
    CreateDepartment = 15,
    
    /// <summary>
    /// Cập nhật phòng ban
    /// </summary>
    UpdateDepartment = 16,
    
    /// <summary>
    /// Xóa phòng ban
    /// </summary>
    DeleteDepartment = 17,
    
    /// <summary>
    /// Tạo vai trò
    /// </summary>
    CreateRole = 18,
    
    /// <summary>
    /// Cập nhật vai trò
    /// </summary>
    UpdateRole = 19,
    
    /// <summary>
    /// Xóa vai trò
    /// </summary>
    DeleteRole = 20,
    
    /// <summary>
    /// Gán quyền cho vai trò
    /// </summary>
    AssignPermissions = 21,
    
    /// <summary>
    /// Tạo quyền
    /// </summary>
    CreatePermission = 22,
    
    /// <summary>
    /// Cập nhật quyền
    /// </summary>
    UpdatePermission = 23,
    
    /// <summary>
    /// Xóa quyền
    /// </summary>
    DeletePermission = 24,
    
    /// <summary>
    /// Xóa phân công
    /// </summary>
    DeleteAssignment = 25,

    /// <summary>
    /// Tạo cơ quan ban hành
    /// </summary>
    CreateIssuingAgency = 26,

    /// <summary>
    /// Cập nhật cơ quan ban hành
    /// </summary>
    UpdateIssuingAgency = 27,

    /// <summary>
    /// Xóa cơ quan ban hành
    /// </summary>
    DeleteIssuingAgency = 28
}

