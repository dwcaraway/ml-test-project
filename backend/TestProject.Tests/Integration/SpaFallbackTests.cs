using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TestProject.Tests.Integration;

public static class WebRootTestBootstrapper
{
    private static readonly object Sync = new();
    private static readonly HashSet<string> CreatedIndexPaths = new(StringComparer.OrdinalIgnoreCase);

    public static void EnsureIndexHtmlExists()
    {
        lock (Sync)
        {
            foreach (var path in GetCandidateIndexPaths())
            {
                if (File.Exists(path))
                {
                    continue;
                }

                var directory = Path.GetDirectoryName(path);
                if (!string.IsNullOrEmpty(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                File.WriteAllText(path, "<!DOCTYPE html><html><body><h1>SPA Test Shell</h1></body></html>");
                CreatedIndexPaths.Add(path);
            }
        }
    }

    public static void CleanupIfCreated()
    {
        lock (Sync)
        {
            foreach (var path in CreatedIndexPaths)
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }

            CreatedIndexPaths.Clear();
        }
    }

    private static IEnumerable<string> GetCandidateIndexPaths()
    {
        var candidates = new List<string>();
        var roots = new[]
        {
            Directory.GetCurrentDirectory(),
            AppContext.BaseDirectory,
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".."))
        };

        foreach (var root in roots.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(root))
            {
                continue;
            }

            var projectFile = Path.Combine(root, "TestProject.csproj");
            var testProjectFile = Path.Combine(root, "TestProject.Tests", "TestProject.Tests.csproj");
            if (File.Exists(projectFile) || File.Exists(testProjectFile))
            {
                candidates.Add(Path.Combine(root, "wwwroot", "index.html"));
            }

            var appRootCandidate = Path.Combine(root, "wwwroot");
            if (Directory.Exists(appRootCandidate) && !candidates.Contains(Path.Combine(appRootCandidate, "index.html")))
            {
                candidates.Add(Path.Combine(appRootCandidate, "index.html"));
            }
        }

        if (candidates.Count == 0)
        {
            candidates.Add(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html"));
        }

        return candidates.Distinct(StringComparer.OrdinalIgnoreCase);
    }
}

public class TestAppFactory : WebApplicationFactory<Program>
{
    public TestAppFactory()
    {
        WebRootTestBootstrapper.EnsureIndexHtmlExists();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("https_port", "443");
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            WebRootTestBootstrapper.CleanupIfCreated();
        }

        base.Dispose(disposing);
    }
}

[CollectionDefinition("WebRootCollection")]
public class WebRootCollection : ICollectionFixture<TestAppFactory>
{
}

[Collection("WebRootCollection")]
public class SpaFallbackTests
{
    private readonly HttpClient _client;

    public SpaFallbackTests(TestAppFactory factory)
    {
        WebRootTestBootstrapper.EnsureIndexHtmlExists();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_ClientPath_ReturnsOkWithIndexHtml()
    {
        // Act
        var response = await _client.GetAsync("/detail/123");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("<html", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Get_RootPath_ReturnsOkWithIndexHtml()
    {
        // Act
        var response = await _client.GetAsync("/");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Get_ApiEndpoint_PreservesApiResponse()
    {
        // Act
        var response = await _client.GetAsync("/test");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("API Response", content);
    }
}
