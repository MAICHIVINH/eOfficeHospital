using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QLVB.Application.Services;
using QLVB.Domain.Enums;
using QLVB.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using QLVB.Application.DTOs.Notifications;

namespace QLVB.Api.Services;

public class DeadlineReminderService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DeadlineReminderService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(24);

    public DeadlineReminderService(IServiceProvider serviceProvider, ILogger<DeadlineReminderService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Deadline Reminder Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing deadline reminders.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task ProcessRemindersAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // Lấy tất cả phân công chưa hoàn thành và có hạn xử lý
        var pendingAssignments = await unitOfWork.DocumentAssignments
            .FindAsync(a => a.Status != AssignmentStatus.Completed 
                         && !a.IsDeleted 
                         && a.Deadline.HasValue, cancellationToken);

        foreach (var assignment in pendingAssignments)
        {
            if (!assignment.Deadline.HasValue) continue;
            
            var deadline = assignment.Deadline.Value.Date;
            string title = "";
            string message = "";
            
            var docTitle = assignment.Document?.Title ?? "Văn bản không tiêu đề";
            
            if (deadline < today)
            {
                title = "Văn bản QUÁ HẠN xử lý";
                message = $"Văn bản '{docTitle}' đã quá hạn từ ngày {deadline:dd/MM/yyyy}. Vui lòng hoàn thành ngay!";
            }
            else if (deadline == today)
            {
                title = "Văn bản HẾT HẠN hôm nay";
                message = $"Hôm nay là hạn cuối xử lý văn bản '{docTitle}'.";
            }
            else if (deadline == tomorrow)
            {
                title = "Văn bản sắp hết hạn";
                message = $"Văn bản '{docTitle}' sẽ hết hạn vào ngày mai ({deadline:dd/MM/yyyy}).";
            }

            if (!string.IsNullOrEmpty(title))
            {
                // Gửi cho người được giao trực tiếp
                if (assignment.AssignedToUserId.HasValue)
                {
                    await notificationService.CreateAndSendAsync(new CreateNotificationDto
                    {
                        UserId = assignment.AssignedToUserId.Value,
                        Title = title,
                        Message = message,
                        Type = NotificationType.DeadlineReminder,
                        Link = $"/documents/view/{assignment.DocumentId}",
                        DocumentId = assignment.DocumentId
                    });
                }
                
                // Nếu là trễ hạn, gửi thêm cho người giao (Trưởng khoa/Văn thư) để biết
                if (deadline <= today)
                {
                    await notificationService.CreateAndSendAsync(new CreateNotificationDto
                    {
                        UserId = assignment.AssignedById,
                        Title = $"Nhắc nhở: {title}",
                        Message = $"Nhân viên được giao xử lý văn bản '{assignment.Document?.Title ?? "N/A"}' đang bị trễ hạn hoặc hết hạn.",
                        Type = NotificationType.DeadlineReminder,
                        Link = $"/documents/view/{assignment.DocumentId}",
                        DocumentId = assignment.DocumentId
                    });
                }
            }
        }
    }
}
