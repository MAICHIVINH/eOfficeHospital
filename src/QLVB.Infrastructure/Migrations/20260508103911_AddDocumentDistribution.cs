using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLVB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentDistribution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DocumentDistributions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    DistributionType = table.Column<int>(type: "integer", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ReportFilePath = table.Column<string>(type: "text", nullable: true),
                    ReportFileName = table.Column<string>(type: "text", nullable: true),
                    ReportFileSize = table.Column<long>(type: "bigint", nullable: true),
                    ExternalRecipientName = table.Column<string>(type: "text", nullable: true),
                    IsExternalReceived = table.Column<bool>(type: "boolean", nullable: false),
                    ExternalReceivedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    SentById = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentDistributions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentDistributions_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DocumentDistributions_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentDistributions_Users_SentById",
                        column: x => x.SentById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentDistributions_DepartmentId",
                table: "DocumentDistributions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentDistributions_DocumentId",
                table: "DocumentDistributions",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentDistributions_SentById",
                table: "DocumentDistributions",
                column: "SentById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentDistributions");
        }
    }
}
