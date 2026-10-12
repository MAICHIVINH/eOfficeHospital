using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLVB.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParentAssignmentId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentAssignmentId",
                table: "DocumentAssignments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAssignments_ParentAssignmentId",
                table: "DocumentAssignments",
                column: "ParentAssignmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentAssignments_DocumentAssignments_ParentAssignmentId",
                table: "DocumentAssignments",
                column: "ParentAssignmentId",
                principalTable: "DocumentAssignments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentAssignments_DocumentAssignments_ParentAssignmentId",
                table: "DocumentAssignments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentAssignments_ParentAssignmentId",
                table: "DocumentAssignments");

            migrationBuilder.DropColumn(
                name: "ParentAssignmentId",
                table: "DocumentAssignments");
        }
    }
}
