using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TestProject.Models;
using Xunit;

namespace TestProject.Tests.Integration
{
    public sealed class SearchTestDataFixture : IDisposable
    {
        public string StorageRoot { get; }
        public string TestSubdir { get; }

        public SearchTestDataFixture()
        {
            StorageRoot = ResolveStorageRoot();
            TestSubdir = Path.Combine(StorageRoot, "search-test-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(TestSubdir);

            // Create structure inside TestSubdir:
            //   docs/
            //     sub_search.txt
            //   search_file.txt
            //   search_folder/
            var docs = Path.Combine(TestSubdir, "docs");
            var searchFolder = Path.Combine(TestSubdir, "search_folder");
            Directory.CreateDirectory(docs);
            Directory.CreateDirectory(searchFolder);

            File.WriteAllText(Path.Combine(docs, "sub_search.txt"), "sub search file");
            File.WriteAllText(Path.Combine(TestSubdir, "search_file.txt"), "search file root");
            File.WriteAllText(Path.Combine(TestSubdir, "other.txt"), "other content");
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
    public class SearchEndpointTests : IClassFixture<SearchTestDataFixture>
    {
        private readonly HttpClient _client;
        private readonly SearchTestDataFixture _fixture;

        public SearchEndpointTests(TestAppFactory factory, SearchTestDataFixture fixture)
        {
            WebRootTestBootstrapper.EnsureIndexHtmlExists();
            _client = factory.CreateClient();
            _fixture = fixture;
        }

        [Fact]
        public async Task Search_ValidQuery_Returns200WithMatchingItems()
        {
            var testSubdirName = Path.GetFileName(_fixture.TestSubdir);
            var response = await _client.GetAsync($"/api/search?path={Uri.EscapeDataString(testSubdirName)}&query=search");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.Equal("search", root.GetProperty("query").GetString());
            Assert.Equal(testSubdirName, root.GetProperty("basePath").GetString());

            var items = root.GetProperty("items").EnumerateArray().ToList();
            Assert.True(items.Count >= 3); // search_folder, sub_search.txt, search_file.txt

            // First item should be folder
            Assert.Equal("folder", items[0].GetProperty("type").GetString());
            Assert.Equal("-", items[0].GetProperty("size").GetString());
        }

        [Fact]
        public async Task Search_EmptyQuery_Returns400BadRequest()
        {
            var testSubdirName = Path.GetFileName(_fixture.TestSubdir);
            var response = await _client.GetAsync($"/api/search?path={Uri.EscapeDataString(testSubdirName)}&query=");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("error", out _) || doc.RootElement.TryGetProperty("errors", out _), $"Unexpected JSON: {json}");
        }

        [Fact]
        public async Task Search_PathTraversal_Returns400BadRequest()
        {
            var response = await _client.GetAsync("/api/search?path=../&query=test");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("error", out _));
        }

        [Fact]
        public async Task Search_MissingDirectory_Returns404NotFound()
        {
            var response = await _client.GetAsync("/api/search?path=non_existent_dir_12345&query=test");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("error", out _));
        }

        [Fact]
        public async Task Search_PaginationParameters_ReturnsCorrectPageSlice()
        {
            var testSubdirName = Path.GetFileName(_fixture.TestSubdir);
            var response = await _client.GetAsync($"/api/search?path={Uri.EscapeDataString(testSubdirName)}&query=search&page=1&pageSize=1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.Equal(1, root.GetProperty("page").GetInt32());
            Assert.Equal(1, root.GetProperty("pageSize").GetInt32());
            Assert.True(root.GetProperty("totalCount").GetInt32() >= 3);
            Assert.True(root.GetProperty("totalPages").GetInt32() >= 3);
            Assert.Single(root.GetProperty("items").EnumerateArray());
        }
    }
}
