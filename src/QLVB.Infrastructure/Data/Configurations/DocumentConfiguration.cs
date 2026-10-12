using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QLVB.Domain.Entities;
using QLVB.Domain.Enums;

namespace QLVB.Infrastructure.Data.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.Description)
            .HasMaxLength(1000);

        builder.Property(d => d.FilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(d => d.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.FileSize)
            .IsRequired();

        builder.Property(d => d.DocumentType)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(d => d.Category)
            .IsRequired()
            .HasDefaultValue(DocumentCategory.Incoming)
            .HasConversion<int>();

        builder.Property(d => d.WorkflowStatus)
            .HasConversion<int>();

        builder.Property(d => d.DocumentNumber)
            .HasMaxLength(50);

        builder.Property(d => d.SecurityLevel)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(d => d.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(d => d.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Indexes
        builder.HasIndex(d => d.CreatedById);
        builder.HasIndex(d => d.Category);
        builder.HasIndex(d => d.WorkflowStatus);
        builder.HasIndex(d => d.DocumentNumber).IsUnique().HasFilter("\"DocumentNumber\" IS NOT NULL");
        builder.HasIndex(d => d.CreatedAt);
        builder.HasIndex(d => d.IsDeleted);

        // Relationships
        builder.HasOne(d => d.CreatedBy)
            .WithMany(u => u.CreatedDocuments)
            .HasForeignKey(d => d.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.SignedBy)
            .WithMany()
            .HasForeignKey(d => d.SignedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.IssuedBy)
            .WithMany()
            .HasForeignKey(d => d.IssuedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.RejectedBy)
            .WithMany()
            .HasForeignKey(d => d.RejectedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(d => d.RejectionReason)
            .HasMaxLength(1000);

        builder.HasMany(d => d.Assignments)
            .WithOne(a => a.Document)
            .HasForeignKey(a => a.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(d => d.AuditLogs)
            .WithOne(a => a.Document)
            .HasForeignKey(a => a.DocumentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.IssuingAgency)
            .WithMany(ia => ia.Documents)
            .HasForeignKey(d => d.IssuingAgencyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(d => d.IssuingAgencyId);
    }
}
