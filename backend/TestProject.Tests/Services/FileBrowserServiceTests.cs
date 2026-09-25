using System.IO;
using System.Security;
using System.Text;
using Microsoft.AspNetCore.Http;
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

        [Fact]
        public void ResolveAndValidatePath_SubdirectoryWithBackslash_ResolvesCorrectly()
        {
            var resolved = _service.ResolveAndValidatePath("docs\\manual.pdf", mustBeDirectory: false);
            var expected = Path.Combine(_testRoot, "docs", "manual.pdf");

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

        [Theory]
        [InlineData("..\\", "../")]
        [InlineData("..\\..\\Windows\\System32", "../../Windows/System32")]
        [InlineData("docs\\manual.pdf", "docs/manual.pdf")]
        [InlineData("docs/sub\\file.txt", "docs/sub/file.txt")]
        [InlineData("\\leading\\path", "/leading/path")]
        public void NormalizeSeparators_NormalizesBackslashesToForwardSlashes(string input, string expected)
        {
            var result = FileBrowserService.NormalizeSeparators(input);
            Assert.Equal(expected, result);
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

        [Fact]
        public void DeleteItem_ValidFile_DeletesFileSuccessfully()
        {
            var filePath = Path.Combine(_testRoot, "to-delete.txt");
            File.WriteAllText(filePath, "delete me");
            Assert.True(File.Exists(filePath));

            _service.DeleteItem("to-delete.txt");

            Assert.False(File.Exists(filePath));
        }

        [Fact]
        public void DeleteItem_ValidDirectoryWithContents_DeletesDirectoryRecursively()
        {
            var dirPath = Path.Combine(_testRoot, "to-delete-dir");
            Directory.CreateDirectory(dirPath);
            File.WriteAllText(Path.Combine(dirPath, "nested.txt"), "nested content");
            Directory.CreateDirectory(Path.Combine(dirPath, "sub-dir"));
            File.WriteAllText(Path.Combine(dirPath, "sub-dir", "deep.txt"), "deep content");
            Assert.True(Directory.Exists(dirPath));

            _service.DeleteItem("to-delete-dir");

            Assert.False(Directory.Exists(dirPath));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void DeleteItem_EmptyOrWhitespacePath_ThrowsArgumentException(string? emptyPath)
        {
            Assert.Throws<ArgumentException>(() => _service.DeleteItem(emptyPath));
        }

        [Fact]
        public void DeleteItem_RootDirectoryPath_ThrowsArgumentException()
        {
            var ex = Assert.Throws<ArgumentException>(() => _service.DeleteItem("/"));
            Assert.Contains("root", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Theory]
        [InlineData("../")]
        [InlineData("..\\")]
        [InlineData("../../etc/passwd")]
        [InlineData("docs/../../../escaped")]
        public void DeleteItem_PathTraversal_ThrowsSecurityException(string maliciousPath)
        {
            Assert.Throws<SecurityException>(() => _service.DeleteItem(maliciousPath));
        }

        [Fact]
        public void DeleteItem_NonExistentItem_ThrowsFileNotFoundException()
        {
            Assert.Throws<FileNotFoundException>(() => _service.DeleteItem("non-existent.txt"));
        }

        private static IFormFile CreateFormFile(string fileName, string content = "test content")
        {
            var bytes = Encoding.UTF8.GetBytes(content);
            var stream = new MemoryStream(bytes);
            return new FormFile(stream, 0, bytes.Length, "file", fileName);
        }

        private static IFormFile CreateLargeFormFile(string fileName, long byteCount)
        {
            var stream = new MemoryStream();
            stream.SetLength(byteCount);
            return new FormFile(stream, 0, byteCount, "file", fileName);
        }

        [Fact]
        public async Task UploadFileAsync_ValidFileInRoot_SavesFileSuccessfully()
        {
            var file = CreateFormFile("newfile.txt", "fresh content");

            var result = await _service.UploadFileAsync("", file);

            Assert.NotNull(result);
            Assert.Equal("newfile.txt", result.FileName);
            Assert.Equal("", result.Path);
            Assert.True(File.Exists(Path.Combine(_testRoot, "newfile.txt")));
            Assert.Equal("fresh content", File.ReadAllText(Path.Combine(_testRoot, "newfile.txt")));
        }

        [Fact]
        public async Task UploadFileAsync_ValidFileInSubfolder_SavesFileInSubfolder()
        {
            var file = CreateFormFile("nested.txt", "nested content");

            var result = await _service.UploadFileAsync("docs", file);

            Assert.NotNull(result);
            Assert.Equal("nested.txt", result.FileName);
            Assert.Equal("docs", result.Path);
            Assert.True(File.Exists(Path.Combine(_testRoot, "docs", "nested.txt")));
            Assert.Equal("nested content", File.ReadAllText(Path.Combine(_testRoot, "docs", "nested.txt")));
        }

        [Fact]
        public async Task UploadFileAsync_Conflict_AppendsCopy1()
        {
            var file = CreateFormFile("sample.txt", "replacement content");

            var result = await _service.UploadFileAsync("", file);

            Assert.NotNull(result);
            Assert.Equal("sample_copy1.txt", result.FileName);
            Assert.Equal("sample file content", File.ReadAllText(Path.Combine(_testRoot, "sample.txt")));
            Assert.True(File.Exists(Path.Combine(_testRoot, "sample_copy1.txt")));
            Assert.Equal("replacement content", File.ReadAllText(Path.Combine(_testRoot, "sample_copy1.txt")));
        }

        [Fact]
        public async Task UploadFileAsync_SequentialConflict_AppendsCopy2()
        {
            File.WriteAllText(Path.Combine(_testRoot, "sample_copy1.txt"), "copy1 content");
            var file = CreateFormFile("sample.txt", "copy2 content");

            var result = await _service.UploadFileAsync("", file);

            Assert.NotNull(result);
            Assert.Equal("sample_copy2.txt", result.FileName);
            Assert.True(File.Exists(Path.Combine(_testRoot, "sample_copy2.txt")));
            Assert.Equal("copy2 content", File.ReadAllText(Path.Combine(_testRoot, "sample_copy2.txt")));
        }

        [Fact]
        public async Task UploadFileAsync_ExtensionlessFileConflict_AppendsCopy1()
        {
            File.WriteAllText(Path.Combine(_testRoot, "LICENSE"), "license original");
            var file = CreateFormFile("LICENSE", "license new");

            var result = await _service.UploadFileAsync("", file);

            Assert.NotNull(result);
            Assert.Equal("LICENSE_copy1", result.FileName);
            Assert.True(File.Exists(Path.Combine(_testRoot, "LICENSE_copy1")));
        }

        [Fact]
        public async Task UploadFileAsync_FileSizeExceeds8MB_ThrowsArgumentException()
        {
            var file = CreateLargeFormFile("toolarge.bin", 8 * 1024 * 1024 + 1);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.UploadFileAsync("", file));
            Assert.Contains("8 MB", ex.Message);
        }

        [Theory]
        [InlineData("../")]
        [InlineData("..\\")]
        [InlineData("../../etc/passwd")]
        [InlineData("docs/../../../escaped")]
        public async Task UploadFileAsync_PathTraversal_ThrowsSecurityException(string maliciousPath)
        {
            var file = CreateFormFile("test.txt");

            await Assert.ThrowsAsync<SecurityException>(() => _service.UploadFileAsync(maliciousPath, file));
        }

        [Fact]
        public async Task UploadFileAsync_NonExistentDestination_ThrowsDirectoryNotFoundException()
        {
            var file = CreateFormFile("test.txt");

            await Assert.ThrowsAsync<DirectoryNotFoundException>(() => _service.UploadFileAsync("non_existent_dir", file));
        }
    }
}
