using System.Net;
using System.Text.Json;
using Xunit;

namespace TestProject.Tests.Integration
{
    [Collection("WebRootCollection")]
    public class DownloadEndpointTests
    {
        private readonly HttpClient _client;

        public DownloadEndpointTests(TestAppFactory factory)
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
