namespace QLVB.Application.DTOs.Dashboard;

public class DeadlineStatsDto
{
    public int Overdue { get; set; }
    public int DueToday { get; set; }
    public int NearingDeadline { get; set; } // Next 3 days
}
