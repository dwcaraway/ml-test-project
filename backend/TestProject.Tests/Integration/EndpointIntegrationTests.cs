using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TestProject.Tests.Integration;

public class EndpointIntegrationTests : IClassFixture<TestAppFactory>
{
    private readonly HttpClient _client;

    public EndpointIntegrationTests(TestAppFactory factory)
    {
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
