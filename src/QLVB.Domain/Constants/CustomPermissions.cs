namespace QLVB.Domain.Constants;

public static class CustomPermissions
{
    public static class Documents
    {
        public const string View = "Permissions.Documents.View";
        public const string Create = "Permissions.Documents.Create";
        public const string Edit = "Permissions.Documents.Edit";
        public const string Delete = "Permissions.Documents.Delete";
        public const string Assign = "Permissions.Documents.Assign";
        public const string Upload = "Permissions.Documents.Upload";
        public const string Approve = "Permissions.Documents.Approve";
        public const string Reject = "Permissions.Documents.Reject";
        public const string Archive = "Permissions.Documents.Archive";
    }

    public static class Users
    {
        public const string View = "Permissions.Users.View";
        public const string Create = "Permissions.Users.Create";
        public const string Edit = "Permissions.Users.Edit";
        public const string Delete = "Permissions.Users.Delete";
    }

    public static class Departments
    {
        public const string View = "Permissions.Departments.View";
        public const string Create = "Permissions.Departments.Create";
        public const string Edit = "Permissions.Departments.Edit";
        public const string Delete = "Permissions.Departments.Delete";
    }

    public static class Roles
    {
        public const string View = "Permissions.Roles.View";
        public const string Create = "Permissions.Roles.Create";
        public const string Edit = "Permissions.Roles.Edit";
        public const string Delete = "Permissions.Roles.Delete";
        public const string AssignPermissions = "Permissions.Roles.AssignPermissions";
    }

    public static class Permissions
    {
        public const string View = "Permissions.Permissions.View";
        public const string Create = "Permissions.Permissions.Create";
        public const string Edit = "Permissions.Permissions.Edit";
        public const string Delete = "Permissions.Permissions.Delete";
    }

    public static class AuditLogs
    {
        public const string View = "Permissions.AuditLogs.View";
        public const string Delete = "Permissions.AuditLogs.Delete";
    }

    public static class Outgoing
    {
        public const string Assign = "Permissions.Outgoing.Assign";
        public const string Draft = "Permissions.Outgoing.Draft";
        public const string Review = "Permissions.Outgoing.Review";
        public const string CheckFormat = "Permissions.Outgoing.CheckFormat";
        public const string Submit = "Permissions.Outgoing.Submit";
        public const string Sign = "Permissions.Outgoing.Sign";
        public const string Issue = "Permissions.Outgoing.Issue";
        public const string Publish = "Permissions.Outgoing.Publish";
        public const string Archive = "Permissions.Outgoing.Archive";
    }

    public static class Notifications
    {
        public const string View = "Permissions.Notifications.View";
        public const string Delete = "Permissions.Notifications.Delete";
    }

    public static class IssuingAgencies
    {
        public const string View = "Permissions.IssuingAgencies.View";
        public const string Create = "Permissions.IssuingAgencies.Create";
        public const string Edit = "Permissions.IssuingAgencies.Edit";
        public const string Delete = "Permissions.IssuingAgencies.Delete";
    }
}
