using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QLVB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDocumentTypeSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DocumentType",
                table: "Documents");

            migrationBuilder.AddColumn<Guid>(
                name: "DocumentTypeId",
                table: "Documents",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "DocumentTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Symbol = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentTypes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "DocumentTypes",
                columns: new[] { "Id", "CreatedAt", "Description", "IsActive", "Name", "Symbol", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(3841), null, true, "Công văn chỉ đạo", "CV", null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4012), null, true, "Báo cáo", "BC", null },
                    { new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4015), null, true, "Quyết định", "QĐ", null },
                    { new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4017), null, true, "Thông báo", "TB", null },
                    { new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4019), null, true, "Quy trình", "QT", null },
                    { new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4020), null, true, "Biên bản", "BB", null },
                    { new Guid("77777777-7777-7777-7777-777777777777"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4022), null, true, "Kế hoạch", "KH", null },
                    { new Guid("88888888-8888-8888-8888-888888888888"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4023), null, true, "Tờ trình", "TTr", null },
                    { new Guid("99999999-9999-9999-9999-999999999999"), new DateTime(2026, 5, 7, 13, 20, 16, 884, DateTimeKind.Utc).AddTicks(4025), null, true, "Loại khác", "Khác", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DocumentTypeId",
                table: "Documents",
                column: "DocumentTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_DocumentTypes_DocumentTypeId",
                table: "Documents",
                column: "DocumentTypeId",
                principalTable: "DocumentTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_DocumentTypes_DocumentTypeId",
                table: "Documents");

            migrationBuilder.DropTable(
                name: "DocumentTypes");

            migrationBuilder.DropIndex(
                name: "IX_Documents_DocumentTypeId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "DocumentTypeId",
                table: "Documents");

            migrationBuilder.AddColumn<int>(
                name: "DocumentType",
                table: "Documents",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
