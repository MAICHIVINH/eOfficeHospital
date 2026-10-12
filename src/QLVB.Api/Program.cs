using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Minio;
using QLVB.Api.Hubs;
using QLVB.Application.Services;
using QLVB.Domain.Constants;
using QLVB.Domain.Interfaces;
using QLVB.Infrastructure.Data;
using QLVB.Infrastructure.Repositories;
using QLVB.Infrastructure.Security;
using QLVB.Infrastructure.Storage;
using QLVB.Infrastructure.Services;
using Microsoft.AspNetCore.HttpOverrides;
using System.Text;
using QLVB.Api.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Load environment variables from .env file
LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

// Configure Kestrel to allow large file uploads (50MB)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 52428800;
});

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// Configure Form options to allow large multipart body (50MB)
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800;
});

// Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "QLVB Hospital API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        
        // Allow SignalR to use JWT from query string (for WebSocket connections)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IOutgoingDocumentService, OutgoingDocumentService>();
builder.Services.AddScoped<IDocumentDistributionService, DocumentDistributionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationSender, SignalRNotificationSender>();
builder.Services.AddScoped<IPdfService, PuppeteerPdfService>();
builder.Services.AddScoped<IIssuingAgencyService, IssuingAgencyService>();

builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

// MinIO
var minioSettings = builder.Configuration.GetSection("MinioSettings");
builder.Services.AddMinio(configureClient => configureClient
    .WithEndpoint(minioSettings["Endpoint"])
    .WithCredentials(minioSettings["AccessKey"], minioSettings["SecretKey"])
    .WithSSL(bool.Parse(minioSettings["UseSSL"] ?? "false"))
    .Build());

// Register services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IEmailValidator, EmailValidator>();
builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddScoped<IStorageService>(sp =>
{
    var minioClient = sp.GetRequiredService<IMinioClient>();
    var bucketName = minioSettings["BucketName"] ?? "hospital-documents";
    return new MinioStorageService(minioClient, bucketName);
});

builder.Services.AddScoped<IJwtService>(sp =>
{
    var context = sp.GetRequiredService<ApplicationDbContext>();
    return new JwtService(
        secretKey,
        jwtSettings["Issuer"] ?? "QLVB.Hospital",
        jwtSettings["Audience"] ?? "QLVB.Hospital.Users",
        context,
        int.Parse(jwtSettings["ExpirationHours"] ?? "8")
    );
});

// SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
});

// Background Services
builder.Services.AddHostedService<DeadlineReminderService>();

// Configure SignalR to use NameIdentifier claim as UserId
builder.Services.AddSingleton<IUserIdProvider, NameIdentifierUserIdProvider>();

// CORS (Optimized for Internal Network Deployment)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any origin for internal network (IP-based)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR
    });
});

var app = builder.Build();

// Ensure MinIO bucket exists and seed database with retry logic for Docker
using (var scope = app.Services.CreateScope())
{
    var retryCount = 10;
    var delay = TimeSpan.FromSeconds(3);
    var services = scope.ServiceProvider;

    for (int i = 1; i <= retryCount; i++)
    {
        try
        {
            Console.WriteLine($"Initialization attempt {i} of {retryCount}...");
            
            var storageService = services.GetRequiredService<IStorageService>();
            await storageService.EnsureBucketExistsAsync();
            Console.WriteLine("MinIO storage bucket initialized.");
            
            // Seed database with default data
            var context = services.GetRequiredService<ApplicationDbContext>();
            await DbInitializer.SeedAsync(context);
            
            Console.WriteLine("Database and Storage initialized successfully.");
            break; // Success, exit loop
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Attempt {i} failed: {ex.Message}");
            if (i < retryCount)
            {
                Console.WriteLine($"Waiting {delay.TotalSeconds} seconds before next attempt...");
                await Task.Delay(delay);
            }
            else
            {
                Console.WriteLine("All initialization attempts failed. Moving on...");
            }
        }
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Trust Nginx reverse proxy — read real client IP from X-Forwarded-For
// Clear default restrictions so all Docker internal network IPs are trusted
var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedOptions.KnownNetworks.Clear();
forwardedOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedOptions);

app.UseResponseCompression();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<QLVB.Api.Hubs.NotificationHub>("/hubs/notifications");

app.Run();

// Helper method to load .env file into environment variables
static void LoadDotEnv()
{
    var current = Directory.GetCurrentDirectory();
    var baseDir = AppContext.BaseDirectory;
    var candidateDirs = new[]
    {
        current,
        Path.Combine(current, ".."),
        Path.Combine(current, "..", ".."),
        baseDir,
        Path.Combine(baseDir, "..", "..", ".."),
        Path.Combine(baseDir, "..", "..", "..", "..")
    };

    foreach (var dir in candidateDirs)
    {
        try
        {
            var envPath = Path.Combine(dir, ".env");
            if (File.Exists(envPath))
            {
                foreach (var rawLine in File.ReadAllLines(envPath))
                {
                    var line = rawLine.Trim();
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                        continue;

                    var idx = line.IndexOf('=');
                    if (idx > 0)
                    {
                        var key = line.Substring(0, idx).Trim();
                        var val = line.Substring(idx + 1).Trim();

                        if ((val.StartsWith("\"") && val.EndsWith("\"")) ||
                            (val.StartsWith("'") && val.EndsWith("'")))
                        {
                            val = val.Substring(1, val.Length - 2);
                        }

                        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                        {
                            Environment.SetEnvironmentVariable(key, val);
                        }
                    }
                }
                break;
            }
        }
        catch
        {
            // Ignore directory search errors
        }
    }
}
