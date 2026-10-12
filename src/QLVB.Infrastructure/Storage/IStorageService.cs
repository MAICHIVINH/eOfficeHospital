namespace QLVB.Infrastructure.Storage;

/// <summary>
/// Storage service interface for file operations
/// </summary>
public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<string> GetPresignedUrlAsync(string filePath, int expiryInSeconds = 3600, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string filePath, CancellationToken cancellationToken = default);
    Task EnsureBucketExistsAsync(CancellationToken cancellationToken = default);
    Task<Stream> GetFileStreamAsync(string filePath, CancellationToken cancellationToken = default);
}
