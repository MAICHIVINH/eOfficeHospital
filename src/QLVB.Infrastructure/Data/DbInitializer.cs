using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Entities;
using QLVB.Domain.Constants;
using QLVB.Infrastructure.Security;

namespace QLVB.Infrastructure.Data;

public static class DbInitializer
{
    // Định nghĩa Guid cố định cho 3 role chính
    public static readonly Guid AdminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid ManagerRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid StaffRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid ClerkRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid DirectorRoleId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // ... (Migrations check remains same)
        await context.Database.MigrateAsync();

        // One-time fix: Confirm email for all existing users
        await context.Database.ExecuteSqlRawAsync("UPDATE \"Users\" SET \"IsEmailConfirmed\" = true WHERE \"IsEmailConfirmed\" = false");

        // Cleanup old permissions (Refactor: Incoming -> Documents)
        var oldPermissionCodes = new[] { "Permissions.Incoming.Approve", "Permissions.Incoming.Reject" };
        var oldPermissions = await context.Permissions.IgnoreQueryFilters().Where(p => oldPermissionCodes.Contains(p.Code)).ToListAsync();
        if (oldPermissions.Any())
        {
            var oldPermIds = oldPermissions.Select(p => p.Id).ToList();
            var oldRolePerms = await context.RolePermissions.Where(rp => oldPermIds.Contains(rp.PermissionId)).ToListAsync();
            if (oldRolePerms.Any()) context.RolePermissions.RemoveRange(oldRolePerms);
            context.Permissions.RemoveRange(oldPermissions);
            await context.SaveChangesAsync();
        }

        // Seed Permissions
        var existingPermissions = await context.Permissions.IgnoreQueryFilters().ToListAsync();
        var permissionsToSeed = new List<Permission>
        {
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.View, Name = "Xem văn bản", Description = "Quyền xem văn bản", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Create, Name = "Tạo văn bản", Description = "Quyền tạo văn bản mới", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Edit, Name = "Sửa văn bản", Description = "Quyền chỉnh sửa văn bản", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Delete, Name = "Xóa văn bản", Description = "Quyền xóa văn bản", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Assign, Name = "Phân công văn bản", Description = "Quyền phân công văn bản cho phòng ban", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Upload, Name = "Upload văn bản", Description = "Quyền upload file văn bản", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Approve, Name = "Duyệt văn bản đến", Description = "Quyền phê duyệt văn bản đến từ văn thư", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Reject, Name = "Từ chối văn bản đến", Description = "Quyền từ chối văn bản đến từ văn thư", Category = "Documents" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Documents.Archive, Name = "Kho lưu trữ văn bản đến", Description = "Quyền truy cập kho lưu trữ văn bản đến", Category = "Documents" },
            
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.View, Name = "Xem người dùng", Description = "Quyền xem danh sách người dùng", Category = "Users" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.Create, Name = "Thêm người dùng", Description = "Quyền thêm người dùng mới", Category = "Users" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.Edit, Name = "Sửa người dùng", Description = "Quyền sửa thông tin người dùng", Category = "Users" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.Delete, Name = "Xóa người dùng", Description = "Quyền xóa người dùng", Category = "Users" },
            
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Departments.View, Name = "Xem phòng ban", Description = "Quyền xem danh sách phòng ban", Category = "Departments" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Departments.Create, Name = "Thêm phòng ban", Description = "Quyền thêm phòng ban mới", Category = "Departments" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Departments.Edit, Name = "Sửa phòng ban", Description = "Quyền sửa thông tin phòng ban", Category = "Departments" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Departments.Delete, Name = "Xóa phòng ban", Description = "Quyền xóa phòng ban", Category = "Departments" },
            
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.View, Name = "Xem vai trò", Description = "Quyền xem danh sách vai trò", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.Create, Name = "Thêm vai trò", Description = "Quyền thêm vai trò mới", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.Edit, Name = "Sửa vai trò", Description = "Quyền sửa thông tin vai trò", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.Delete, Name = "Xóa vai trò", Description = "Quyền xóa vai trò", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.AssignPermissions, Name = "Gán quyền", Description = "Quyền gán quyền cho vai trò", Category = "Roles" },

            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.View, Name = "Xem quyền", Description = "Quyền xem danh sách quyền", Category = "Permissions" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.Create, Name = "Thêm quyền", Description = "Quyền thêm quyền mới", Category = "Permissions" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.Edit, Name = "Sửa quyền", Description = "Quyền sửa thông tin quyền", Category = "Permissions" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.Delete, Name = "Xóa quyền", Description = "Quyền xóa quyền", Category = "Permissions" },

            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.AuditLogs.View, Name = "Xem nhật ký", Description = "Quyền xem nhật ký hệ thống", Category = "AuditLogs" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.AuditLogs.Delete, Name = "Xóa nhật ký", Description = "Quyền xóa nhật ký hệ thống", Category = "AuditLogs" },

            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Assign, Name = "Phân công soạn thảo văn bản đi", Description = "Quyền phân công soạn thảo văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Draft, Name = "Soạn thảo văn bản đi", Description = "Quyền soạn thảo văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Review, Name = "Duyệt nội dung văn bản đi", Description = "Quyền duyệt nội dung văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.CheckFormat, Name = "Kiểm tra thể thức", Description = "Quyền kiểm tra thể thức văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Submit, Name = "Trình ký văn bản đi", Description = "Quyền trình ký văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Sign, Name = "Ký văn bản đi", Description = "Quyền ký văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Issue, Name = "Cấp số văn bản đi", Description = "Quyền cấp số văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Publish, Name = "Phát hành văn bản đi", Description = "Quyền phát hành văn bản đi", Category = "Outgoing" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Outgoing.Archive, Name = "Lưu trữ văn bản đi", Description = "Quyền lưu trữ văn bản đi", Category = "Outgoing" },

            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Notifications.View, Name = "Xem thông báo toàn hệ thống", Description = "Quyền xem toàn bộ thông báo trong hệ thống", Category = "Notifications" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Notifications.Delete, Name = "Xóa thông báo toàn hệ thống", Description = "Quyền xóa bất kỳ thông báo nào trong hệ thống", Category = "Notifications" },

            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.IssuingAgencies.View, Name = "Xem cơ quan ban hành", Description = "Quyền xem danh sách cơ quan ban hành", Category = "IssuingAgencies" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.IssuingAgencies.Create, Name = "Thêm cơ quan ban hành", Description = "Quyền thêm cơ quan ban hành mới", Category = "IssuingAgencies" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.IssuingAgencies.Edit, Name = "Sửa cơ quan ban hành", Description = "Quyền sửa thông tin cơ quan ban hành", Category = "IssuingAgencies" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.IssuingAgencies.Delete, Name = "Xóa cơ quan ban hành", Description = "Quyền xóa cơ quan ban hành", Category = "IssuingAgencies" },
        };

        foreach (var p in permissionsToSeed)
        {
            if (!existingPermissions.Any(x => x.Code == p.Code))
            {
                await context.Permissions.AddAsync(p);
            }
        }
        await context.SaveChangesAsync();

        // Refresh existingPermissions
        existingPermissions = await context.Permissions.IgnoreQueryFilters().ToListAsync();

        // Seed Roles
        var existingRoles = await context.Roles.IgnoreQueryFilters().ToListAsync();
        var rolesToSeed = new List<Role>
        {
            new Role { Id = AdminRoleId, Code = "ADMIN", Name = "Quản trị viên", Description = "Quản trị viên hệ thống - có toàn quyền", IsSystemRole = true },
            new Role { Id = ManagerRoleId, Code = "MANAGER", Name = "Quản lý", Description = "Quản lý phòng ban - quyền do Admin cấp", IsSystemRole = true },
            new Role { Id = StaffRoleId, Code = "STAFF", Name = "Nhân viên", Description = "Nhân viên - quyền do Admin cấp", IsSystemRole = true },
            new Role { Id = ClerkRoleId, Code = "CLERK", Name = "Văn thư", Description = "Văn thư bệnh viện", IsSystemRole = true },
            new Role { Id = DirectorRoleId, Code = "DIRECTOR", Name = "Ban Giám đốc", Description = "Ban Giám đốc bệnh viện", IsSystemRole = true }
        };

        foreach (var r in rolesToSeed)
        {
            if (!existingRoles.Any(x => x.Code == r.Code))
            {
                await context.Roles.AddAsync(r);
            }
        }
        await context.SaveChangesAsync();

        // Refresh existingRoles
        existingRoles = await context.Roles.IgnoreQueryFilters().ToListAsync();

        // Seed RolePermissions for ADMIN (Ensure Admin always has ALL permissions)
        var adminRole = existingRoles.FirstOrDefault(r => r.Code == "ADMIN");
        if (adminRole != null)
        {
            var currentAdminPermIds = await context.RolePermissions
                .Where(rp => rp.RoleId == adminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            foreach (var p in existingPermissions)
            {
                if (!currentAdminPermIds.Contains(p.Id))
                {
                    await context.RolePermissions.AddAsync(new RolePermission { RoleId = adminRole.Id, PermissionId = p.Id });
                }
            }
            await context.SaveChangesAsync();
        }

        // Optional: Seed Manager/Staff/Clerk/Director if they are empty
        if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId != AdminRoleId))
        {
            var rolePermissions = new List<RolePermission>();

            // Manager: Review + standard doc control
            var managerPermissionCodes = new[] 
            { 
                CustomPermissions.Documents.View, 
                CustomPermissions.Documents.Create,
                CustomPermissions.Documents.Upload,
                CustomPermissions.Documents.Edit,
                CustomPermissions.Documents.Assign,
                CustomPermissions.Users.View,
                CustomPermissions.Departments.View,
                CustomPermissions.Outgoing.Assign,
                CustomPermissions.Outgoing.Review 
            };
            foreach (var code in managerPermissionCodes)
            {
                var p = existingPermissions.FirstOrDefault(x => x.Code == code);
                if (p != null) rolePermissions.Add(new RolePermission { RoleId = ManagerRoleId, PermissionId = p.Id });
            }

            // Staff: Draft + standard view/upload
            var staffPermissionCodes = new[] 
            { 
                CustomPermissions.Documents.View, 
                CustomPermissions.Documents.Upload,
                CustomPermissions.Outgoing.Draft 
            };
            foreach (var code in staffPermissionCodes)
            {
                var p = existingPermissions.FirstOrDefault(x => x.Code == code);
                if (p != null) rolePermissions.Add(new RolePermission { RoleId = StaffRoleId, PermissionId = p.Id });
            }

            // Clerk: CheckFormat, Submit, Issue, Publish + Full Doc Access
            var clerkPermissionCodes = new[] 
            { 
                CustomPermissions.Documents.View, 
                CustomPermissions.Documents.Upload,
                CustomPermissions.Documents.Edit,
                CustomPermissions.Documents.Assign,
                CustomPermissions.Users.View,
                CustomPermissions.Departments.View,
                CustomPermissions.Outgoing.Assign,
                CustomPermissions.Outgoing.CheckFormat, 
                CustomPermissions.Outgoing.Submit, 
                CustomPermissions.Outgoing.Issue, 
                CustomPermissions.Outgoing.Publish,
                CustomPermissions.Outgoing.Archive,
                CustomPermissions.Documents.Archive,
                CustomPermissions.IssuingAgencies.View,
                CustomPermissions.IssuingAgencies.Create,
                CustomPermissions.IssuingAgencies.Edit,
                CustomPermissions.IssuingAgencies.Delete
            };
            foreach (var code in clerkPermissionCodes)
            {
                var p = existingPermissions.FirstOrDefault(x => x.Code == code);
                if (p != null) rolePermissions.Add(new RolePermission { RoleId = ClerkRoleId, PermissionId = p.Id });
            }

            // Director: Sign + View + Incoming Workflow
            var directorPermissionCodes = new[] 
            { 
                CustomPermissions.Documents.View, 
                CustomPermissions.Outgoing.Sign,
                CustomPermissions.Documents.Approve,
                CustomPermissions.Documents.Reject,
                CustomPermissions.Documents.Archive
            };
            foreach (var code in directorPermissionCodes)
            {
                var p = existingPermissions.FirstOrDefault(x => x.Code == code);
                if (p != null) rolePermissions.Add(new RolePermission { RoleId = DirectorRoleId, PermissionId = p.Id });
            }

            await context.RolePermissions.AddRangeAsync(rolePermissions);
            await context.SaveChangesAsync();
        }
        else
        {
            // Update Director permissions if they already have some but are missing the new ones
            var directorRole = existingRoles.FirstOrDefault(r => r.Code == "DIRECTOR");
            if (directorRole != null)
            {
                var currentDirectorPermIds = await context.RolePermissions
                    .Where(rp => rp.RoleId == directorRole.Id)
                    .Select(rp => rp.PermissionId)
                    .ToListAsync();

                var newIncomingPerms = existingPermissions.Where(p => 
                    p.Code == CustomPermissions.Documents.Approve || 
                    p.Code == CustomPermissions.Documents.Reject);

                foreach (var p in newIncomingPerms)
                {
                    if (!currentDirectorPermIds.Contains(p.Id))
                    {
                        await context.RolePermissions.AddAsync(new RolePermission { RoleId = directorRole.Id, PermissionId = p.Id });
                    }
                }
                await context.SaveChangesAsync();
            }

            // Update Manager permissions
            var managerRole = existingRoles.FirstOrDefault(r => r.Code == "MANAGER");
            if (managerRole != null)
            {
                var currentPermIds = await context.RolePermissions.Where(rp => rp.RoleId == managerRole.Id).Select(rp => rp.PermissionId).ToListAsync();
                var assignPerm = existingPermissions.FirstOrDefault(p => p.Code == CustomPermissions.Outgoing.Assign);
                if (assignPerm != null && !currentPermIds.Contains(assignPerm.Id))
                {
                    await context.RolePermissions.AddAsync(new RolePermission { RoleId = managerRole.Id, PermissionId = assignPerm.Id });
                }
                await context.SaveChangesAsync();
            }

            // Update Clerk permissions
            var clerkRole = existingRoles.FirstOrDefault(r => r.Code == "CLERK");
            if (clerkRole != null)
            {
                var currentPermIds = await context.RolePermissions.Where(rp => rp.RoleId == clerkRole.Id).Select(rp => rp.PermissionId).ToListAsync();
                var assignPerm = existingPermissions.FirstOrDefault(p => p.Code == CustomPermissions.Outgoing.Assign);
                if (assignPerm != null && !currentPermIds.Contains(assignPerm.Id))
                {
                    await context.RolePermissions.AddAsync(new RolePermission { RoleId = clerkRole.Id, PermissionId = assignPerm.Id });
                }
                await context.SaveChangesAsync();
            }
        }

        // Check if already seeded users
        var userCount = await context.Users.IgnoreQueryFilters().CountAsync();
        if (userCount > 0)
        {
            var usernames = await context.Users.IgnoreQueryFilters().Select(u => u.Username).ToListAsync();
            Console.WriteLine($"Database already has {userCount} users: {string.Join(", ", usernames)}");
            Console.WriteLine("Skipping user seeding.");
            return;
        }

        Console.WriteLine("Seeding departments and users...");

        // Create departments
        var departments = new List<Department>
        {
            new Department
            {
                Id = Guid.NewGuid(),
                Name = "Khoa Nội",
                Code = "KN",
                Description = "Khoa Nội tổng hợp",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Department
            {
                Id = Guid.NewGuid(),
                Name = "Khoa Ngoại",
                Code = "KNG",
                Description = "Khoa Ngoại tổng hợp",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Department
            {
                Id = Guid.NewGuid(),
                Name = "Khoa Sản",
                Code = "KS",
                Description = "Khoa Sản",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Department
            {
                Id = Guid.NewGuid(),
                Name = "Phòng Hành chính",
                Code = "HC",
                Description = "Phòng Hành chính - Tổng hợp",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Departments.AddRangeAsync(departments);
        await context.SaveChangesAsync();

        // Create users
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                PasswordHash = PasswordHasher.HashPassword("Admin@123"),
                FullName = "Quản trị viên",
                Email = "admin@hospital.com",
                RoleId = AdminRoleId,
                DepartmentId = null,
                IsActive = true,
                IsEmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "manager1",
                PasswordHash = PasswordHasher.HashPassword("Manager@123"),
                FullName = "Trưởng phòng Hành chính",
                Email = "manager1@hospital.com",
                RoleId = ManagerRoleId,
                DepartmentId = departments[3].Id, // Phòng HC
                IsActive = true,
                IsEmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "staff1",
                PasswordHash = PasswordHasher.HashPassword("Staff@123"),
                FullName = "Nhân viên Khoa Nội",
                Email = "staff1@hospital.com",
                RoleId = StaffRoleId,
                DepartmentId = departments[0].Id, // Khoa Nội
                IsActive = true,
                IsEmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "staff2",
                PasswordHash = PasswordHasher.HashPassword("Staff@123"),
                FullName = "Nhân viên Khoa Ngoại",
                Email = "staff2@hospital.com",
                RoleId = StaffRoleId,
                DepartmentId = departments[1].Id, // Khoa Ngoại
                IsActive = true,
                IsEmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "clerk1",
                PasswordHash = PasswordHasher.HashPassword("Clerk@123"),
                FullName = "Văn thư Bệnh viện",
                Email = "clerk1@hospital.com",
                RoleId = ClerkRoleId,
                DepartmentId = departments[3].Id, // Phòng Hành chính
                IsActive = true,
                IsEmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                Username = "director1",
                PasswordHash = PasswordHasher.HashPassword("Director@123"),
                FullName = "Giám đốc Bệnh viện",
                Email = "director1@hospital.com",
                RoleId = DirectorRoleId,
                DepartmentId = null,
                IsActive = true,
                IsEmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();
        Console.WriteLine("Departments and users seeded successfully.");
    }
}
