using System.Net;
using System.Net.Sockets;
using System.Text.RegularExpressions;
using DnsClient;

namespace QLVB.Infrastructure.Services;

public interface IEmailValidator
{
    Task<bool> IsValidEmailAsync(string email);
}

public class EmailValidator : IEmailValidator
{
    private static readonly Regex EmailRegex = new(
        @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Common disposable/spam email domains
    private static readonly HashSet<string> DisposableDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "mailinator.com", "yopmail.com", "guerrillamail.com", "temp-mail.org", 
        "10minutemail.com", "throwawaymail.com", "guerrillamail.info", 
        "guerrillamail.biz", "guerrillamail.de", "guerrillamail.net", 
        "guerrillamail.org", "guerrillamailblock.com", "pokemail.net",
        "spam4.me", "grr.la", "sharklasers.com", "getairmail.com"
    };

    public async Task<bool> IsValidEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        // 1. Basic format check
        if (!EmailRegex.IsMatch(email))
            return false;

        var parts = email.Split('@');
        var domain = parts[1].ToLower();

        // 2. Block disposable email domains
        if (DisposableDomains.Contains(domain))
        {
            Console.WriteLine($"Blocked disposable email domain: {domain}");
            return false;
        }

        // 3. Domain verification (MX record check)
        try
        {
            var lookup = new LookupClient();
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            var result = await lookup.QueryAsync(domain, QueryType.MX, cancellationToken: cts.Token);
            
            if (result.HasError && result.ErrorMessage != "No record found")
            {
                Console.WriteLine($"DNS Lookup warning for {domain}: {result.ErrorMessage}. Assuming valid domain for robustness.");
                return true; 
            }

            var mxRecords = result.Answers.MxRecords()
                .OrderBy(m => m.Preference)
                .ToList();

            if (!mxRecords.Any())
            {
                // Fallback to A record
                using var ctsA = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                var aResult = await lookup.QueryAsync(domain, QueryType.A, cancellationToken: ctsA.Token);
                if (aResult.HasError || !aResult.Answers.ARecords().Any())
                {
                    Console.WriteLine($"A record Lookup failed for {domain}. Assuming valid to avoid blocking internal emails.");
                    return true;
                }
                
                // If only A record, we can't easily do SMTP check without a port 25 assumptions
                return true; 
            }

            // 4. SMTP Verification Attempt (Deep check)
            // Note: This is disabled for robustness as it's often blocked or failing in internal networks.
            // return await CheckMailboxExistsAsync(mxRecords.First().Exchange, email);
            return true;
        }
        catch (Exception ex)
        {
            // If DNS/MX verification fails due to connectivity issues, we assume the email is valid for robustness
            // rather than blocking account management.
            Console.WriteLine($"Email verification skipped due to network/DNS error for {email}: {ex.Message}");
            return true;
        }
    }

    private async Task<bool> CheckMailboxExistsAsync(string mailServer, string email)
    {
        try
        {
            using var client = new TcpClient();
            // Use a shorter timeout for connection
            var connectTask = client.ConnectAsync(mailServer, 25);
            if (await Task.WhenAny(connectTask, Task.Delay(3000)) != connectTask)
            {
                Console.WriteLine($"SMTP Connection timeout for {mailServer}");
                return true; // Timeout, assume valid domain at least
            }

            if (client.Client == null || !client.Connected)
                return true;

            using var stream = client.GetStream();
            using var reader = new StreamReader(stream);
            using var writer = new StreamWriter(stream) { AutoFlush = true };

            var response = await reader.ReadLineAsync();
            if (response == null || !response.StartsWith("220")) return true;

            await writer.WriteLineAsync("HELO hospital.com");
            response = await reader.ReadLineAsync();
            if (response == null || !response.StartsWith("250")) return true;

            // Use null sender (standard for verification)
            await writer.WriteLineAsync("MAIL FROM:<>");
            response = await reader.ReadLineAsync();
            if (response == null || !response.StartsWith("250")) return true;

            await writer.WriteLineAsync($"RCPT TO:<{email}>");
            response = await reader.ReadLineAsync();
            
            // Log response for debugging
            Console.WriteLine($"SMTP RCPT TO response for {email}: {response}");

            // 550, 551, 554 usually mean mailbox does not exist or is rejected
            if (response != null && (response.StartsWith("550") || response.StartsWith("551") || response.StartsWith("554")))
            {
                // But some servers reject RCPT TO if the sender is empty or untrusted
                // We only block if we are reasonably sure it's a "User unknown" error
                if (response.Contains("unknown", StringComparison.OrdinalIgnoreCase) || 
                    response.Contains("not exist", StringComparison.OrdinalIgnoreCase) ||
                    response.Contains("No such user", StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            await writer.WriteLineAsync("QUIT");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SMTP check skipped due to error for {email}: {ex.Message}");
            return true; 
        }
    }
}
