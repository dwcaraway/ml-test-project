using System.Net;
using System.Net.Http.Json;
using TestProject.Models;
using Xunit;

namespace TestProject.Tests.Integration
{
    public sealed class BrowseTestDataFixture : IDisposable
    {
        private readonly List<string> _createdFiles = new();
        private readonly string _rootPath;

        public BrowseTestDataFixture()
        {
            _rootPath = ResolveStorageRoot();
            EnsureBrowseFiles();
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

        private void EnsureBrowseFiles()
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
    public class BrowseEndpointTests : IClassFixture<BrowseTestDataFixture>
    {
        private readonly HttpClient _client;

        public BrowseEndpointTests(TestAppFactory factory, BrowseTestDataFixture fixture)
        {
            WebRootTestBootstrapper.EnsureIndexHtmlExists();
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task Get_BrowseRoot_Returns200WithFilesAndFolders()
        {
            var response = await _client.GetAsync("/api/browse");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<BrowseResponse>();
            Assert.NotNull(result);
            Assert.Equal(string.Empty, result.CurrentPath);
            Assert.True(result.Items.Count > 0);

            // Folders must have size "-"
            var folder = result.Items.FirstOrDefault(i => i.Type == "folder");
            if (folder != null)
            {
                Assert.Equal("-", folder.Size);
            }

            // Files must have byte count string
            var file = result.Items.FirstOrDefault(i => i.Type == "file");
            if (file != null)
            {
                Assert.NotEqual("-", file.Size);
                Assert.True(long.TryParse(file.Size, out _));
            }
        }

        [Fact]
        public async Task Get_BrowseSubfolder_Returns200WithSubfolderContents()
        {
            var response = await _client.GetAsync("/api/browse?path=docs");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<BrowseResponse>();
            Assert.NotNull(result);
            Assert.Equal("docs", result.CurrentPath);
            Assert.Contains(result.Items, i => i.Name == "readme.txt");
        }

        [Fact]
        public async Task Get_BrowsePagination_RespectsPageAndPageSize()
        {
            var response = await _client.GetAsync("/api/browse?page=1&pageSize=1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<BrowseResponse>();
            Assert.NotNull(result);
            Assert.Equal(1, result.Page);
            Assert.Equal(1, result.PageSize);
            Assert.Single(result.Items);
            Assert.True(result.TotalPages >= 1);
        }

        [Fact]
        public async Task Get_BrowseNonExistentDirectory_Returns404NotFound()
        {
            var response = await _client.GetAsync("/api/browse?path=does_not_exist_folder_9999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("/api/browse?path=../")]
        [InlineData("/api/browse?path=..%2F..%2Fetc")]
        [InlineData("/api/browse?path=..\\")]
        public async Task Get_BrowsePathTraversal_Returns400BadRequest(string url)
        {
            var response = await _client.GetAsync(url);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Get_BrowseFilePath_Returns400BadRequest()
        {
            var response = await _client.GetAsync("/api/browse?path=file1.txt");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
