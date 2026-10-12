using PuppeteerSharp;
using PuppeteerSharp.Media;
using QLVB.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using System.Reflection;

namespace QLVB.Infrastructure.Services;

public class PuppeteerPdfService : IPdfService
{
    private readonly ILogger<PuppeteerPdfService> _logger;

    // Cache base64 fonts to avoid re-reading embedded resources on every call
    private static string? _fontFaceCss;
    private static readonly object _fontLock = new();

    public PuppeteerPdfService(ILogger<PuppeteerPdfService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Reads an embedded font resource and returns its base64 representation.
    /// Resource name format: QLVB.Infrastructure.Assets.Fonts.{filename}
    /// </summary>
    private static string ReadEmbeddedFontAsBase64(string resourceName)
    {
        var assembly = typeof(PuppeteerPdfService).Assembly;
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new FileNotFoundException($"Embedded font resource not found: {resourceName}");
        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        return Convert.ToBase64String(ms.ToArray());
    }

    /// <summary>
    /// Builds the @font-face CSS block from embedded Noto Serif fonts.
    /// Result is cached after first call.
    /// </summary>
    private static string BuildFontFaceCss()
    {
        if (_fontFaceCss is not null) return _fontFaceCss;

        lock (_fontLock)
        {
            if (_fontFaceCss is not null) return _fontFaceCss;

            const string ns = "QLVB.Infrastructure.Assets.Fonts";

            var regular    = ReadEmbeddedFontAsBase64($"{ns}.NotoSerif-Regular.ttf");
            var bold       = ReadEmbeddedFontAsBase64($"{ns}.NotoSerif-Bold.ttf");
            var italic     = ReadEmbeddedFontAsBase64($"{ns}.NotoSerif-Italic.ttf");
            var boldItalic = ReadEmbeddedFontAsBase64($"{ns}.NotoSerif-BoldItalic.ttf");

            _fontFaceCss = $@"
@font-face {{
    font-family: 'Noto Serif';
    font-style: normal;
    font-weight: 400;
    src: url('data:font/truetype;base64,{regular}') format('truetype');
}}
@font-face {{
    font-family: 'Noto Serif';
    font-style: normal;
    font-weight: 700;
    src: url('data:font/truetype;base64,{bold}') format('truetype');
}}
@font-face {{
    font-family: 'Noto Serif';
    font-style: italic;
    font-weight: 400;
    src: url('data:font/truetype;base64,{italic}') format('truetype');
}}
@font-face {{
    font-family: 'Noto Serif';
    font-style: italic;
    font-weight: 700;
    src: url('data:font/truetype;base64,{boldItalic}') format('truetype');
}}";
        }

        return _fontFaceCss!;
    }

    public async Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent)
    {
        try
        {
            _logger.LogInformation("Generating PDF from HTML content using PuppeteerSharp...");

            // Build offline @font-face CSS from embedded resources (cached after first call)
            var fontFaceCss = BuildFontFaceCss();

            // Download browser if not exists (only at the first time)
            var browserFetcher = new BrowserFetcher();
            await browserFetcher.DownloadAsync();

            await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox" }
            });

            await using var page = await browser.NewPageAsync();

            // Build full HTML with embedded fonts — fully offline, no CDN required
            var styledHtml = $@"<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <style>
        {fontFaceCss}

        * {{
            font-family: 'Noto Serif', 'Times New Roman', serif !important;
        }}
        body, p, td, th, span, li, div, h1, h2, h3, h4, h5, h6 {{
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
        }}
        body {{
            margin: 0;
            padding: 0;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        td, th {{
            border: none;
            padding: 2px 4px;
            vertical-align: top;
        }}
        p {{
            margin: 0;
        }}
        strong, b {{
            font-weight: bold;
        }}
        em, i {{
            font-style: italic;
        }}
        u {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    {htmlContent}
</body>
</html>";

            // Set content — no network needed since fonts are embedded in CSS
            await page.SetContentAsync(styledHtml, new NavigationOptions
            {
                WaitUntil = new[] { WaitUntilNavigation.DOMContentLoaded }
            });

            // Wait for fonts to be fully parsed and ready
            await page.EvaluateExpressionAsync("document.fonts.ready");

            // Generate PDF with precise administrative margins (Vietnamese standard)
            var pdfOptions = new PdfOptions
            {
                Format = PaperFormat.A4,
                PrintBackground = true,
                MarginOptions = new MarginOptions
                {
                    Top    = "20mm",
                    Bottom = "20mm",
                    Left   = "30mm",
                    Right  = "20mm"
                }
            };

            var pdfData = await page.PdfDataAsync(pdfOptions);
            _logger.LogInformation("PDF generated successfully. Size: {Size} bytes", pdfData.Length);

            return pdfData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF from HTML: {Message}", ex.Message);
            throw;
        }
    }
}

