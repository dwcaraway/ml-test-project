using System.Net;
using System.Text.Json;
using Xunit;

namespace TestProject.Tests.Integration
{
    public sealed class DeleteTestDataFixture : IDisposable
    {
        public string StorageRoot { get; }
        public string TestSubdir { get; }

        public DeleteTestDataFixture()
        {
            StorageRoot = ResolveStorageRoot();
            TestSubdir = Path.Combine(StorageRoot, "delete-test-" + Guid.NewGuid().ToString("N"));
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
    public class DeleteEndpointTests : IClassFixture<DeleteTestDataFixture>
    {
        private readonly HttpClient _client;
        private readonly DeleteTestDataFixture _fixture;

        public DeleteEndpointTests(TestAppFactory factory, DeleteTestDataFixture fixture)
        {
            WebRootTestBootstrapper.EnsureIndexHtmlExists();
            _client = factory.CreateClient();
            _fixture = fixture;
        }

        [Fact]
        public async Task Delete_ValidFile_Returns200AndDeletesFile()
        {
            var subfolderName = Path.GetFileName(_fixture.TestSubdir);
            var filePath = Path.Combine(_fixture.TestSubdir, "file-to-delete.txt");
            await File.WriteAllTextAsync(filePath, "test content");
            Assert.True(File.Exists(filePath));

            var relativePath = $"{subfolderName}/file-to-delete.txt";
            var response = await _client.DeleteAsync($"/api/delete?path={Uri.EscapeDataString(relativePath)}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("Item deleted successfully.", doc.RootElement.GetProperty("message").GetString());

            Assert.False(File.Exists(filePath));
        }

        [Fact]
        public async Task Delete_ValidDirectory_Returns200AndDeletesDirectoryRecursively()
        {
            var subfolderName = Path.GetFileName(_fixture.TestSubdir);
            var dirPath = Path.Combine(_fixture.TestSubdir, "folder-to-delete");
            Directory.CreateDirectory(dirPath);
            await File.WriteAllTextAsync(Path.Combine(dirPath, "nested.txt"), "nested content");
            Directory.CreateDirectory(Path.Combine(dirPath, "subfolder"));
            await File.WriteAllTextAsync(Path.Combine(dirPath, "subfolder", "deep.txt"), "deep content");
            Assert.True(Directory.Exists(dirPath));

            var relativePath = $"{subfolderName}/folder-to-delete";
            var response = await _client.DeleteAsync($"/api/delete?path={Uri.EscapeDataString(relativePath)}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("Item deleted successfully.", doc.RootElement.GetProperty("message").GetString());

            Assert.False(Directory.Exists(dirPath));
        }

        [Fact]
        public async Task Delete_MissingItem_Returns404NotFound()
        {
            var response = await _client.DeleteAsync("/api/delete?path=non_existent_item_99999.txt");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal("Item not found.", doc.RootElement.GetProperty("error").GetString());
        }

        [Theory]
        [InlineData("/api/delete")]
        [InlineData("/api/delete?path=")]
        [InlineData("/api/delete?path=%20%20")]
        public async Task Delete_MissingOrEmptyPath_Returns400BadRequest(string url)
        {
            var response = await _client.DeleteAsync(url);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("error", out _));
        }

        [Theory]
        [InlineData("/api/delete?path=/")]
        [InlineData("/api/delete?path=.")]
        public async Task Delete_RootDirectoryTarget_Returns400BadRequest(string url)
        {
            var response = await _client.DeleteAsync(url);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Contains("root", doc.RootElement.GetProperty("error").GetString(), StringComparison.OrdinalIgnoreCase);
        }

        [Theory]
        [InlineData("/api/delete?path=../appsettings.json")]
        [InlineData("/api/delete?path=..%2F..%2Fetc%2Fpasswd")]
        [InlineData("/api/delete?path=..\\secret.txt")]
        public async Task Delete_PathTraversal_Returns400BadRequest(string url)
        {
            var response = await _client.DeleteAsync(url);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("error", out _));
        }
    }
}
