using System.Security;
using Microsoft.Extensions.Options;
using TestProject.Configuration;
using TestProject.Models;
using TestProject.Services;

namespace TestProject.Tests.Services
{
    public class FileBrowserSearchTests : IDisposable
    {
        private readonly string _testRoot;
        private readonly FileBrowserService _service;

        public FileBrowserSearchTests()
        {
            _testRoot = Path.Combine(Path.GetTempPath(), "FileBrowserSearchTests_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_testRoot);

            // Create folder hierarchy
            // _testRoot/
            //   docs/
            //     reports/
            //       annual_report.pdf
            //       notes.txt
            //     readme.txt
            //   images/
            //     report_diagram.png
            //   alpha_folder/
            //   report_summary.txt
            //   secret.txt (contains the word "report" in contents only)

            var docs = Path.Combine(_testRoot, "docs");
            var reports = Path.Combine(docs, "reports");
            var images = Path.Combine(_testRoot, "images");
            var alpha = Path.Combine(_testRoot, "alpha_folder");

            Directory.CreateDirectory(reports);
            Directory.CreateDirectory(images);
            Directory.CreateDirectory(alpha);

            File.WriteAllText(Path.Combine(reports, "annual_report.pdf"), "pdf content");
            File.WriteAllText(Path.Combine(reports, "notes.txt"), "notes content");
            File.WriteAllText(Path.Combine(docs, "readme.txt"), "readme content");
            File.WriteAllText(Path.Combine(images, "report_diagram.png"), "image bytes");
            File.WriteAllText(Path.Combine(_testRoot, "report_summary.txt"), "summary content");
            File.WriteAllText(Path.Combine(_testRoot, "secret.txt"), "the report is here in content");

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
        public async Task SearchFilesAsync_WithPartialMatch_ReturnsMatchingFilesAndFoldersRecursively()
        {
            var request = new SearchRequest { Path = "", Query = "report" };
            var response = await _service.SearchFilesAsync(request);

            Assert.NotNull(response);
            Assert.Equal("", response.BasePath);
            Assert.Equal("report", response.Query);

            // Should match:
            // Folders: "reports"
            // Files: "annual_report.pdf", "report_diagram.png", "report_summary.txt"
            // Total matches: 4 (secret.txt should NOT match because "report" is only in contents)
            Assert.Equal(4, response.TotalCount);

            var names = response.Items.Select(i => i.Name).ToList();
            Assert.Contains("reports", names);
            Assert.Contains("annual_report.pdf", names);
            Assert.Contains("report_diagram.png", names);
            Assert.Contains("report_summary.txt", names);
            Assert.DoesNotContain("secret.txt", names);
        }

        [Fact]
        public async Task SearchFilesAsync_ResultsSortedByType_FoldersFirstThenFilesAlphabetically()
        {
            var request = new SearchRequest { Path = "", Query = "report" };
            var response = await _service.SearchFilesAsync(request);

            var items = response.Items;
            Assert.Equal(4, items.Count);

            // Folders first
            Assert.Equal("folder", items[0].Type);
            Assert.Equal("reports", items[0].Name);
            Assert.Equal("-", items[0].Size);

            // Files follow, sorted alphabetically
            Assert.Equal("file", items[1].Type);
            Assert.Equal("annual_report.pdf", items[1].Name);

            Assert.Equal("file", items[2].Type);
            Assert.Equal("report_diagram.png", items[2].Name);

            Assert.Equal("file", items[3].Type);
            Assert.Equal("report_summary.txt", items[3].Name);
        }

        [Fact]
        public async Task SearchFilesAsync_SubdirectoryBase_RecursesDownOnlyFromSubdirectory()
        {
            var request = new SearchRequest { Path = "docs", Query = "report" };
            var response = await _service.SearchFilesAsync(request);

            // Under "docs", matches should only be "reports" (folder) and "annual_report.pdf" (file)
            Assert.Equal(2, response.TotalCount);
            var names = response.Items.Select(i => i.Name).ToList();
            Assert.Contains("reports", names);
            Assert.Contains("annual_report.pdf", names);
            Assert.DoesNotContain("report_diagram.png", names);
            Assert.DoesNotContain("report_summary.txt", names);
        }

        [Fact]
        public async Task SearchFilesAsync_CaseInsensitiveMatching_MatchesRegardlessOfCase()
        {
            var request = new SearchRequest { Path = "", Query = "REPORT" };
            var response = await _service.SearchFilesAsync(request);

            Assert.Equal(4, response.TotalCount);
        }

        [Fact]
        public async Task SearchFilesAsync_Pagination_SlicesResultsCorrectly()
        {
            // Total 4 matching items: page 1 with pageSize 2 should return 2 items, totalPages 2
            var request = new SearchRequest { Path = "", Query = "report", Page = 1, PageSize = 2 };
            var responsePage1 = await _service.SearchFilesAsync(request);

            Assert.Equal(4, responsePage1.TotalCount);
            Assert.Equal(2, responsePage1.TotalPages);
            Assert.Equal(1, responsePage1.Page);
            Assert.Equal(2, responsePage1.Items.Count);

            var requestPage2 = new SearchRequest { Path = "", Query = "report", Page = 2, PageSize = 2 };
            var responsePage2 = await _service.SearchFilesAsync(requestPage2);

            Assert.Equal(2, responsePage2.Page);
            Assert.Equal(2, responsePage2.Items.Count);

            // Items between page 1 and page 2 should be disjoint
            var page1Names = responsePage1.Items.Select(i => i.Name).ToHashSet();
            var page2Names = responsePage2.Items.Select(i => i.Name).ToHashSet();
            Assert.Empty(page1Names.Intersect(page2Names));
        }

        [Fact]
        public async Task SearchFilesAsync_EmptyOrWhitespaceQuery_ThrowsArgumentException()
        {
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.SearchFilesAsync(new SearchRequest { Path = "", Query = "" }));

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.SearchFilesAsync(new SearchRequest { Path = "", Query = "   " }));
        }

        [Fact]
        public async Task SearchFilesAsync_PathTraversal_ThrowsSecurityException()
        {
            await Assert.ThrowsAsync<SecurityException>(() =>
                _service.SearchFilesAsync(new SearchRequest { Path = "../", Query = "report" }));

            await Assert.ThrowsAsync<SecurityException>(() =>
                _service.SearchFilesAsync(new SearchRequest { Path = "..\\", Query = "report" }));
        }

        [Fact]
        public async Task SearchFilesAsync_NonExistentDirectory_ThrowsDirectoryNotFoundException()
        {
            await Assert.ThrowsAsync<DirectoryNotFoundException>(() =>
                _service.SearchFilesAsync(new SearchRequest { Path = "non_existent_dir", Query = "report" }));
        }

        [Fact]
        public async Task SearchFilesAsync_NoMatches_ReturnsEmptyListAndSingleTotalPage()
        {
            var request = new SearchRequest { Path = "", Query = "xyz_non_existent" };
            var response = await _service.SearchFilesAsync(request);

            Assert.Equal(0, response.TotalCount);
            Assert.Equal(1, response.TotalPages);
            Assert.Empty(response.Items);
        }
    }
}
