using Minio;
using Minio.DataModel.Args;

namespace QLVB.Infrastructure.Storage;

/// <summary>
/// MinIO storage service implementation
/// </summary>
public class MinioStorageService : IStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly string _bucketName;

    public MinioStorageService(IMinioClient minioClient, string bucketName)
    {
        _minioClient = minioClient;
        _bucketName = bucketName;
    }

    public async Task EnsureBucketExistsAsync(CancellationToken cancellationToken = default)
    {
        var bucketExistsArgs = new BucketExistsArgs()
            .WithBucket(_bucketName);

        bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs, cancellationToken);

        if (!found)
        {
            var makeBucketArgs = new MakeBucketArgs()
                .WithBucket(_bucketName);

            await _minioClient.MakeBucketAsync(makeBucketArgs, cancellationToken);
        }

        // Always set the policy to public to ensure it's correct
        string policy = $@"{{
            ""Version"": ""2012-10-17"",
            ""Statement"": [
                {{
                    ""Action"": [""s3:GetBucketLocation"", ""s3:ListBucket""],
                    ""Effect"": ""Allow"",
                    ""Principal"": {{ ""AWS"": [""*""] }},
                    ""Resource"": [""arn:aws:s3:::{_bucketName}""]
                }},
                {{
                    ""Action"": [""s3:GetObject""],
                    ""Effect"": ""Allow"",
                    ""Principal"": {{ ""AWS"": [""*""] }},
                    ""Resource"": [""arn:aws:s3:::{_bucketName}/*"" ]
                }}
            ]
        }}";

        var setPolicyArgs = new SetPolicyArgs()
            .WithBucket(_bucketName)
            .WithPolicy(policy);

        await _minioClient.SetPolicyAsync(setPolicyArgs, cancellationToken);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        // Generate unique file path
        var objectName = $"{Guid.NewGuid()}/{fileName}";

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithStreamData(fileStream)
            .WithObjectSize(fileStream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs, cancellationToken);

        return objectName;
    }

    public Task<string> GetPresignedUrlAsync(string filePath, int expiryInSeconds = 3600, CancellationToken cancellationToken = default)
    {
        // Return a relative path that will be proxied through Nginx (/storage/bucket-name/file-path)
        // This avoids issues with internal Docker hostnames in presigned URLs
        return Task.FromResult($"/storage/{_bucketName}/{filePath}");
    }

    public async Task DeleteFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(filePath);

        await _minioClient.RemoveObjectAsync(removeObjectArgs, cancellationToken);
    }

    public async Task<Stream> GetFileStreamAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var memoryStream = new MemoryStream();
        var getObjectArgs = new GetObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(filePath)
            .WithCallbackStream(stream =>
            {
                stream.CopyTo(memoryStream);
            });

        await _minioClient.GetObjectAsync(getObjectArgs, cancellationToken);
        memoryStream.Position = 0;
        return memoryStream;
    }
}
