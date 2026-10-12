using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QLVB.Domain.Entities;

namespace QLVB.Infrastructure.Data.Configurations;

public class IssuingAgencyConfiguration : IEntityTypeConfiguration<IssuingAgency>
{
    public void Configure(EntityTypeBuilder<IssuingAgency> builder)
    {
        builder.ToTable("IssuingAgencies");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.AgencyType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Address)
            .HasMaxLength(500);

        builder.Property(a => a.PhoneNumber)
            .HasMaxLength(20);

        builder.Property(a => a.Notes)
            .HasMaxLength(1000);

        builder.Property(a => a.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(a => a.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Indexes
        builder.HasIndex(a => a.Code).IsUnique();
        builder.HasIndex(a => a.IsDeleted);

        // Relationships
        builder.HasMany(a => a.Documents)
            .WithOne(d => d.IssuingAgency)
            .HasForeignKey(d => d.IssuingAgencyId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
