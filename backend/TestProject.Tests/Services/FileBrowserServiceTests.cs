using System.Security;
using Microsoft.Extensions.Options;
using TestProject.Configuration;
using TestProject.Models;
using TestProject.Services;

namespace TestProject.Tests.Services
{
    public class FileBrowserServiceTests : IDisposable
    {
        private readonly string _testRoot;
        private readonly FileBrowserService _service;

        public FileBrowserServiceTests()
        {
            _testRoot = Path.Combine(Path.GetTempPath(), "FileBrowserServiceTests_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_testRoot);

            Directory.CreateDirectory(Path.Combine(_testRoot, "docs"));
            Directory.CreateDirectory(Path.Combine(_testRoot, "images"));
            File.WriteAllText(Path.Combine(_testRoot, "sample.txt"), "sample file content");
            File.WriteAllText(Path.Combine(_testRoot, "docs", "manual.pdf"), "pdf dummy data");

            var options = Options.Create(new FileBrowserOptions { RootPath = _testRoot });
            _service = new FileBrowserService(options);
        }

        public void Dispose()
        {
            if (Directory.Exists(_testRoot))
            {
                try
                {
                    Directory.Delete(_testRoot, true);
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }
        }

        [Fact]
        public void ResolveAndValidatePath_RootPath_ResolvesToCanonicalRoot()
        {
            var resolvedEmpty = _service.ResolveAndValidatePath(string.Empty);
            var resolvedNull = _service.ResolveAndValidatePath(null);

            var expectedRoot = Path.GetFullPath(_testRoot).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            Assert.Equal(expectedRoot, resolvedEmpty);
            Assert.Equal(expectedRoot, resolvedNull);
        }

        [Fact]
        public void ResolveAndValidatePath_Subdirectory_ResolvesCorrectly()
        {
            var resolved = _service.ResolveAndValidatePath("docs", mustBeDirectory: true);
            var expected = Path.Combine(_testRoot, "docs");

            Assert.Equal(Path.GetFullPath(expected), resolved);
        }

        [Theory]
        [InlineData("../")]
        [InlineData("..\\")]
        [InlineData("../../etc/passwd")]
        [InlineData("..\\..\\Windows\\System32")]
        [InlineData("docs/../../")]
        [InlineData("docs/../../../escaped")]
        public void ResolveAndValidatePath_PathTraversal_ThrowsSecurityException(string maliciousPath)
        {
            Assert.Throws<SecurityException>(() => _service.ResolveAndValidatePath(maliciousPath));
        }

        [Fact]
        public void ResolveAndValidatePath_PrefixCollision_ThrowsSecurityException()
        {
            var collisionPath = "../" + Path.GetFileName(_testRoot) + "-fake";
            Assert.Throws<SecurityException>(() => _service.ResolveAndValidatePath(collisionPath));
        }

        [Fact]
        public void ResolveAndValidatePath_WhenDirectoryDoesNotExist_ThrowsDirectoryNotFoundException()
        {
            Assert.Throws<DirectoryNotFoundException>(() =>
                _service.ResolveAndValidatePath("non_existent_folder", mustBeDirectory: true));
        }

        [Fact]
        public void ResolveAndValidatePath_WhenFileProvidedInsteadOfDirectory_ThrowsArgumentException()
        {
            Assert.Throws<ArgumentException>(() =>
                _service.ResolveAndValidatePath("sample.txt", mustBeDirectory: true));
        }

        [Fact]
        public void GetFileForDownload_ValidFile_ReturnsCorrectMetadata()
        {
            var fileInfo = _service.GetFileForDownload("sample.txt");

            Assert.NotNull(fileInfo);
            Assert.Equal("sample.txt", fileInfo.FileName);
            Assert.True(fileInfo.FileSizeBytes > 0);
            Assert.Equal("text/plain", fileInfo.ContentType);
        }

        [Fact]
        public void GetFileForDownload_DirectoryTarget_ThrowsArgumentException()
        {
            var ex = Assert.Throws<ArgumentException>(() => _service.GetFileForDownload("docs"));
            Assert.Contains("is a directory, not a file", ex.Message);
        }

        [Fact]
        public void GetFileForDownload_NonExistentFile_ThrowsFileNotFoundException()
        {
            Assert.Throws<FileNotFoundException>(() => _service.GetFileForDownload("missing.txt"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void GetFileForDownload_EmptyPath_ThrowsArgumentException(string? emptyPath)
        {
            Assert.Throws<ArgumentException>(() => _service.GetFileForDownload(emptyPath));
        }

        [Fact]
        public async Task BrowseDirectoryAsync_ReturnsProperItemTypesAndFolderSizes()
        {
            var result = await _service.BrowseDirectoryAsync(new BrowseRequest { Path = "" });

            Assert.NotNull(result);
            Assert.Equal(3, result.TotalCount); // docs, images, sample.txt

            var docsFolder = result.Items.FirstOrDefault(i => i.Name == "docs");
            Assert.NotNull(docsFolder);
            Assert.Equal("-", docsFolder.Size);
            Assert.Equal("folder", docsFolder.Type);

            var sampleFile = result.Items.FirstOrDefault(i => i.Name == "sample.txt");
            Assert.NotNull(sampleFile);
            Assert.NotEqual("-", sampleFile.Size);
            Assert.Equal("file", sampleFile.Type);
        }
    }
}
