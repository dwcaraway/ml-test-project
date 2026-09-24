using System.Net;
using System.Text.Json;
using Xunit;

namespace TestProject.Tests.Integration
{
    public sealed class DownloadTestDataFixture : IDisposable
    {
        private readonly List<string> _createdFiles = new();
        private readonly string _rootPath;

        public DownloadTestDataFixture()
        {
            _rootPath = ResolveStorageRoot();
            EnsureDownloadFiles();
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

            return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "storage"));
        }

        private void EnsureDownloadFiles()
        {
            Directory.CreateDirectory(_rootPath);

            var docsDirectory = Path.Combine(_rootPath, "docs");
            Directory.CreateDirectory(docsDirectory);

            CreateFileIfMissing(Path.Combine(_rootPath, "file1.txt"), "Hello, this is file1.txt");
            CreateFileIfMissing(Path.Combine(docsDirectory, "readme.txt"), "This is documentation inside docs/readme.txt");
        }

        private void CreateFileIfMissing(string path, string content)
        {
            if (File.Exists(path))
            {
                return;
            }

            var directory = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            File.WriteAllText(path, content);
            _createdFiles.Add(path);
        }

        public void Dispose()
        {
            foreach (var file in _createdFiles)
            {
                if (File.Exists(file))
                {
                    File.Delete(file);
                }
            }

            var docsDirectory = Path.Combine(_rootPath, "docs");
            if (Directory.Exists(docsDirectory) && !Directory.EnumerateFileSystemEntries(docsDirectory).Any())
            {
                Directory.Delete(docsDirectory, false);
            }

            if (Directory.Exists(_rootPath) && !Directory.EnumerateFileSystemEntries(_rootPath).Any())
            {
                Directory.Delete(_rootPath, false);
            }
        }
    }

    [Collection("WebRootCollection")]
    public class DownloadEndpointTests : IClassFixture<DownloadTestDataFixture>
    {
        private readonly HttpClient _client;

        public DownloadEndpointTests(TestAppFactory factory, DownloadTestDataFixture fixture)
        {
            WebRootTestBootstrapper.EnsureIndexHtmlExists();
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task Get_DownloadValidFile_Returns200WithStreamAndHeaders()
        {
            var response = await _client.GetAsync("/api/download?path=file1.txt");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("text/plain", response.Content.Headers.ContentType?.MediaType);
            Assert.NotNull(response.Content.Headers.ContentDisposition);
            Assert.Equal("file1.txt", response.Content.Headers.ContentDisposition.FileName);

            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Hello, this is file1.txt", content);
        }

        [Fact]
        public async Task Get_DownloadSubfolderFile_Returns200WithContent()
        {
            var response = await _client.GetAsync("/api/download?path=docs/readme.txt");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("This is documentation inside docs/readme.txt", content);
        }

        [Fact]
        public async Task Get_DownloadMissingFile_Returns404NotFound()
        {
            var response = await _client.GetAsync("/api/download?path=non_existent_file_9999.txt");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("File not found.", doc.RootElement.GetProperty("error").GetString());
        }

        [Fact]
        public async Task Get_DownloadDirectoryTarget_Returns400BadRequest()
        {
            var response = await _client.GetAsync("/api/download?path=docs");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("The specified path is a directory, not a file.", doc.RootElement.GetProperty("error").GetString());
        }

        [Theory]
        [InlineData("/api/download")]
        [InlineData("/api/download?path=")]
        public async Task Get_DownloadMissingOrEmptyPath_Returns400BadRequest(string url)
        {
            var response = await _client.GetAsync(url);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Theory]
        [InlineData("/api/download?path=../secret.txt")]
        [InlineData("/api/download?path=..%2F..%2Fetc%2Fpasswd")]
        [InlineData("/api/download?path=..\\secret.txt")]
        public async Task Get_DownloadPathTraversal_Returns400BadRequest(string url)
        {
            var response = await _client.GetAsync(url);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("Invalid file path or path traversal detected.", doc.RootElement.GetProperty("error").GetString());
        }
    }
}
