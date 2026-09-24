using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TestProject.Tests.Integration;

[Collection("WebRootCollection")]
public class EndpointIntegrationTests
{
    private readonly HttpClient _client;

    public EndpointIntegrationTests(TestAppFactory factory)
    {
        WebRootTestBootstrapper.EnsureIndexHtmlExists();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_TestEndpoint_ReturnsOkWithApiResponse()
    {
        // Act
        var response = await _client.GetAsync("/test");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("API Response", content);
    }
}
