using QLVB.Domain.Constants;
using QLVB.Domain.Enums;

namespace QLVB.Infrastructure.Security;

public static class PermissionProvider
{
    public static IEnumerable<string> GetPermissionsForRole(UserRole role)
    {
        return role switch
        {
            UserRole.Admin => GetAllPermissions(),
            UserRole.Manager => GetManagerPermissions(),
            UserRole.Staff => GetStaffPermissions(),
            _ => Enumerable.Empty<string>()
        };
    }

    private static IEnumerable<string> GetAllPermissions()
    {
        return new List<string>
        {
            CustomPermissions.Documents.View,
            CustomPermissions.Documents.Create,
            CustomPermissions.Documents.Edit,
            CustomPermissions.Documents.Delete,
            CustomPermissions.Documents.Assign,
            CustomPermissions.Documents.Upload,
            CustomPermissions.Users.View,
            CustomPermissions.Users.Create,
            CustomPermissions.Users.Edit,
            CustomPermissions.Users.Delete,
            CustomPermissions.Departments.View,
            CustomPermissions.Departments.Create,
            CustomPermissions.Departments.Edit,
            CustomPermissions.Departments.Delete,
            CustomPermissions.Roles.View,
            CustomPermissions.Roles.Create,
            CustomPermissions.Roles.Edit,
            CustomPermissions.Roles.Delete,
            CustomPermissions.Roles.AssignPermissions,
            CustomPermissions.Permissions.View,
            CustomPermissions.Permissions.Create,
            CustomPermissions.Permissions.Edit,
            CustomPermissions.Permissions.Delete,
            CustomPermissions.AuditLogs.View
        };
    }

    private static IEnumerable<string> GetManagerPermissions()
    {
        return new List<string>
        {
            CustomPermissions.Documents.View,
            CustomPermissions.Documents.Create,
            CustomPermissions.Documents.Assign,
            CustomPermissions.Documents.Upload,
            CustomPermissions.Departments.View
        };
    }

    private static IEnumerable<string> GetStaffPermissions()
    {
        return new List<string>
        {
            CustomPermissions.Documents.View,
            CustomPermissions.Departments.View
        };
    }
}
