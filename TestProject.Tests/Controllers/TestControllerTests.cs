using Microsoft.Extensions.Logging.Abstractions;
using TestProject.Controllers;
using Xunit;

namespace TestProject.Tests.Controllers;

public class TestControllerTests
{
    [Fact]
    public void Get_ReturnsExpectedApiResponseString()
    {
        // Arrange
        var logger = NullLogger<TestController>.Instance;
        var controller = new TestController(logger);

        // Act
        var result = controller.Get();

        // Assert
        Assert.Equal("API Response", result);
    }
}
