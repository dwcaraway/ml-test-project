using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TestProject.Tests.Integration;

public class TestAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("https_port", "443");
    }
}

public class SpaFallbackTests : IClassFixture<TestAppFactory>
{
    private readonly HttpClient _client;

    public SpaFallbackTests(TestAppFactory factory)
    {
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
