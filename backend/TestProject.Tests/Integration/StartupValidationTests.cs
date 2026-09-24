using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using TestProject.Services;
using Xunit;

namespace TestProject.Tests.Integration
{
    public class StartupValidationTests : IDisposable
    {
        private readonly string _tempDirectory;

        public StartupValidationTests()
        {
            _tempDirectory = Path.Combine(Path.GetTempPath(), "StartupValidationTests_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempDirectory);
        }

        public void Dispose()
        {
            if (Directory.Exists(_tempDirectory))
            {
                try
                {
                    Directory.Delete(_tempDirectory, true);
                }
                catch
                {
                    // Ignore cleanup exceptions
                }
            }
        }

        [Fact]
        public void Validate_ValidDirectory_SucceedsAndCleansUpProbe()
        {
            FileBrowserStartupValidator.Validate(_tempDirectory);

            var probeFiles = Directory.GetFiles(_tempDirectory, ".probe_*.tmp");
            Assert.Empty(probeFiles);
        }

        [Fact]
        public void Validate_NonExistentCreatableDirectory_CreatesDirectoryAndSucceeds()
        {
            var newSubDir = Path.Combine(_tempDirectory, "auto-created-sub");
            Assert.False(Directory.Exists(newSubDir));

            FileBrowserStartupValidator.Validate(newSubDir);

            Assert.True(Directory.Exists(newSubDir));
            var probeFiles = Directory.GetFiles(newSubDir, ".probe_*.tmp");
            Assert.Empty(probeFiles);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Validate_EmptyOrNullPath_ThrowsInvalidOperationException(string? invalidPath)
        {
            Assert.Throws<InvalidOperationException>(() => FileBrowserStartupValidator.Validate(invalidPath!));
        }

        [Fact]
        public void Validate_FilePathProvidedInsteadOfDirectory_ThrowsInvalidOperationException()
        {
            var filePath = Path.Combine(_tempDirectory, "dummy.txt");
            File.WriteAllText(filePath, "dummy");

            Assert.Throws<InvalidOperationException>(() => FileBrowserStartupValidator.Validate(filePath));
        }

        [Fact]
        public async Task Startup_WithCustomFileBrowserRoot_AppStartsAndBrowses()
        {
            WebRootTestBootstrapper.EnsureIndexHtmlExists();
            var customStorage = Path.Combine(_tempDirectory, "custom_root");
            Directory.CreateDirectory(customStorage);
            File.WriteAllText(Path.Combine(customStorage, "custom_file.txt"), "custom content");

            using var factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseEnvironment("Testing");
                    builder.UseSetting("FILE_BROWSER_ROOT", customStorage);
                });

            var client = factory.CreateClient();
            var response = await client.GetAsync("/api/browse");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("custom_file.txt", content);
        }

        [Fact]
        public async Task Startup_WithInvalidFileBrowserRoot_ThrowsInvalidOperationException()
        {
            WebRootTestBootstrapper.EnsureIndexHtmlExists();
            var invalidFilePath = Path.Combine(_tempDirectory, "blocking_file.txt");
            File.WriteAllText(invalidFilePath, "content");

            using var factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseEnvironment("Testing");
                    builder.UseSetting("FILE_BROWSER_ROOT", invalidFilePath);
                });

            await Assert.ThrowsAnyAsync<Exception>(async () =>
            {
                var client = factory.CreateClient();
                await client.GetAsync("/api/browse");
            });
        }
    }
}
