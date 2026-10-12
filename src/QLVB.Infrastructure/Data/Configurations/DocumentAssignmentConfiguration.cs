using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QLVB.Domain.Entities;

namespace QLVB.Infrastructure.Data.Configurations;

public class DocumentAssignmentConfiguration : IEntityTypeConfiguration<DocumentAssignment>
{
    public void Configure(EntityTypeBuilder<DocumentAssignment> builder)
    {
        builder.ToTable("DocumentAssignments");

        builder.HasKey(da => da.Id);

        builder.Property(da => da.AssignedRole)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(da => da.Status)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(Domain.Enums.AssignmentStatus.Pending);

        builder.Property(da => da.AssignedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(da => da.Notes)
            .HasMaxLength(1000);

        // Indexes
        builder.HasIndex(da => da.DocumentId);
        builder.HasIndex(da => da.DepartmentId);
        builder.HasIndex(da => da.AssignedToUserId);
        builder.HasIndex(da => da.Status);

        // Relationships
        builder.HasOne(da => da.Document)
            .WithMany(d => d.Assignments)
            .HasForeignKey(da => da.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(da => da.Department)
            .WithMany(d => d.DocumentAssignments)
            .HasForeignKey(da => da.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(da => da.AssignedTo)
            .WithMany()
            .HasForeignKey(da => da.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(da => da.AssignedBy)
            .WithMany(u => u.AssignedDocuments)
            .HasForeignKey(da => da.AssignedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
