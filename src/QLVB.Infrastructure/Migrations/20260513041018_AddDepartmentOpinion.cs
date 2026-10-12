using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLVB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentOpinion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DepartmentOpinions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedById = table.Column<Guid>(type: "uuid", nullable: false),
                    RespondedById = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    Deadline = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepartmentOpinions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DepartmentOpinions_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DepartmentOpinions_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DepartmentOpinions_Users_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DepartmentOpinions_Users_RespondedById",
                        column: x => x.RespondedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentOpinions_DepartmentId",
                table: "DepartmentOpinions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentOpinions_DocumentId",
                table: "DepartmentOpinions",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentOpinions_RequestedById",
                table: "DepartmentOpinions",
                column: "RequestedById");

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentOpinions_RespondedById",
                table: "DepartmentOpinions",
                column: "RespondedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DepartmentOpinions");
        }
    }
}
