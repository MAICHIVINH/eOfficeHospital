namespace QLVB.Infrastructure.Services;

public interface IPdfService
{
    /// <summary>
    /// Generates a PDF byte array from HTML content
    /// </summary>
    /// <param name="htmlContent">The HTML string to convert</param>
    /// <returns>PDF file bytes</returns>
    Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent);
}
