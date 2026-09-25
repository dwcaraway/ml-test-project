using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Xunit;

namespace TestProject.Tests.Integration
{
    public sealed class UploadTestDataFixture : IDisposable
    {
        public string StorageRoot { get; }
        public string TestSubdir { get; }

        public UploadTestDataFixture()
        {
            StorageRoot = ResolveStorageRoot();
            TestSubdir = Path.Combine(StorageRoot, "upload-test-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(TestSubdir);
        }

        private string ResolveStorageRoot()
        {
            var candidates = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "storage"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "storage"),
                Path.Combine(AppContext.BaseDirectory, "storage"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "storage"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "storage")
            };

            foreach (var candidate in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var fullPath = Path.GetFullPath(candidate);
                if (Directory.Exists(fullPath))
                {
                    return fullPath;
                }
            }

            var fallback = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "storage"));
            Directory.CreateDirectory(fallback);
            return fallback;
        }

        public void Dispose()
        {
            if (Directory.Exists(TestSubdir))
            {
                try
                {
                    Directory.Delete(TestSubdir, recursive: true);
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }
        }
    }

    [Collection("WebRootCollection")]
    public class UploadEndpointTests : IClassFixture<UploadTestDataFixture>
    {
        private readonly HttpClient _client;
        private readonly UploadTestDataFixture _fixture;

        public UploadEndpointTests(TestAppFactory factory, UploadTestDataFixture fixture)
        {
            WebRootTestBootstrapper.EnsureIndexHtmlExists();
            _client = factory.CreateClient();
            _fixture = fixture;
        }

        private static MultipartFormDataContent CreateMultipartContent(string fileName, string content = "test content")
        {
            var multipart = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes(content));
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");
            multipart.Add(fileContent, "file", fileName);
            return multipart;
        }

        [Fact]
        public async Task Upload_ValidFile_Returns200AndSavesFile()
        {
            var subfolderName = Path.GetFileName(_fixture.TestSubdir);
            var content = CreateMultipartContent("uploaded.txt", "my uploaded content");

            var response = await _client.PostAsync($"/api/upload?path={Uri.EscapeDataString(subfolderName)}", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("uploaded.txt", doc.RootElement.GetProperty("fileName").GetString());
            Assert.Equal("File uploaded successfully.", doc.RootElement.GetProperty("message").GetString());

            var savedPath = Path.Combine(_fixture.TestSubdir, "uploaded.txt");
            Assert.True(File.Exists(savedPath));
            Assert.Equal("my uploaded content", await File.ReadAllTextAsync(savedPath));
        }

        [Fact]
        public async Task Upload_FileConflict_Returns200AndSavesAsCopy1()
        {
            var subfolderName = Path.GetFileName(_fixture.TestSubdir);
            var existingFile = Path.Combine(_fixture.TestSubdir, "conflict.txt");
            await File.WriteAllTextAsync(existingFile, "original content");

            var content = CreateMultipartContent("conflict.txt", "new conflicting content");
            var response = await _client.PostAsync($"/api/upload?path={Uri.EscapeDataString(subfolderName)}", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("conflict_copy1.txt", doc.RootElement.GetProperty("fileName").GetString());

            // Original preserved
            Assert.Equal("original content", await File.ReadAllTextAsync(existingFile));

            // Copy created
            var copyFile = Path.Combine(_fixture.TestSubdir, "conflict_copy1.txt");
            Assert.True(File.Exists(copyFile));
            Assert.Equal("new conflicting content", await File.ReadAllTextAsync(copyFile));
        }

        [Fact]
        public async Task Upload_MissingFile_Returns400BadRequest()
        {
            var emptyMultipart = new MultipartFormDataContent();

            var response = await _client.PostAsync("/api/upload", emptyMultipart);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("error", out _) || doc.RootElement.TryGetProperty("errors", out _));
        }

        [Fact]
        public async Task Upload_FormFieldWithoutFile_Returns400BadRequest()
        {
            var multipart = new MultipartFormDataContent();
            multipart.Add(new StringContent("some-data"), "unrelated_field");

            var response = await _client.PostAsync("/api/upload", multipart);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("A file must be provided for upload.", doc.RootElement.GetProperty("error").GetString());
        }

        [Fact]
        public async Task Upload_FileExceeds8MB_Returns400BadRequest()
        {
            var subfolderName = Path.GetFileName(_fixture.TestSubdir);
            var largeBytes = new byte[8 * 1024 * 1024 + 10];
            var multipart = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(largeBytes);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
            multipart.Add(fileContent, "file", "large.bin");

            var response = await _client.PostAsync($"/api/upload?path={Uri.EscapeDataString(subfolderName)}", multipart);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Contains("8 MB", doc.RootElement.GetProperty("error").GetString());
        }

        [Theory]
        [InlineData("/api/upload?path=../")]
        [InlineData("/api/upload?path=..%2F..%2Fetc")]
        [InlineData("/api/upload?path=..\\secret")]
        public async Task Upload_PathTraversal_Returns400BadRequest(string url)
        {
            var content = CreateMultipartContent("safe.txt", "safe content");

            var response = await _client.PostAsync(url, content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("error", out _));
        }

        [Fact]
        public async Task Upload_NonExistentDestinationDirectory_Returns404NotFound()
        {
            var content = CreateMultipartContent("any.txt", "content");

            var response = await _client.PostAsync("/api/upload?path=non_existent_folder_9999", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("Destination directory not found.", doc.RootElement.GetProperty("error").GetString());
        }
    }
}
