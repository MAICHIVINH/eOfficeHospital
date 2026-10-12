namespace QLVB.Application.DTOs.Dashboard;

public class AdminDashboardStatsDto
{
    public string Name { get; set; } = string.Empty;
    public int Incoming { get; set; }
    public int Outgoing { get; set; }
    public int Value { get; set; } // Total count for the pie chart
}
