using Microsoft.EntityFrameworkCore;
using QLVB.Domain.Entities;

namespace QLVB.Infrastructure.Data;

/// <summary>
/// Application DbContext - EF Core database context
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentAssignment> DocumentAssignments => Set<DocumentAssignment>();
    public DbSet<DocumentDistribution> DocumentDistributions => Set<DocumentDistribution>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<IssuingAgency> IssuingAgencies => Set<IssuingAgency>();
    public DbSet<DepartmentOpinion> DepartmentOpinions => Set<DepartmentOpinion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Global query filter for soft delete
        modelBuilder.Entity<Document>().HasQueryFilter(d => !d.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<Department>().HasQueryFilter(d => !d.IsDeleted);
        modelBuilder.Entity<DocumentAssignment>().HasQueryFilter(da => !da.IsDeleted);
        modelBuilder.Entity<Role>().HasQueryFilter(r => !r.IsDeleted);
        modelBuilder.Entity<Permission>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<AuditLog>().HasQueryFilter(a => !a.IsDeleted);
        modelBuilder.Entity<IssuingAgency>().HasQueryFilter(ia => !ia.IsDeleted);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Automatically set UpdatedAt for modified entities
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is User user)
            {
                user.UpdatedAt = DateTime.UtcNow;
            }
            else if (entry.Entity is Document document)
            {
                document.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
