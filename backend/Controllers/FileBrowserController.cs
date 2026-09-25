using System.Security;
using Microsoft.AspNetCore.Mvc;
using TestProject.Models;
using TestProject.Services;

namespace TestProject.Controllers
{
    [ApiController]
    [Route("api")]
    public class FileBrowserController : ControllerBase
    {
        private readonly IFileBrowserService _fileBrowserService;
        private readonly ILogger<FileBrowserController> _logger;

        public FileBrowserController(
            IFileBrowserService fileBrowserService,
            ILogger<FileBrowserController> logger)
        {
            _fileBrowserService = fileBrowserService;
            _logger = logger;
        }

        [HttpGet("browse")]
        public async Task<IActionResult> Browse([FromQuery] BrowseRequest request, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Browse called with query: {@Request}", request);

            try
            {
                var response = await _fileBrowserService.BrowseDirectoryAsync(request, cancellationToken);
                return Ok(response);
            }
            catch (SecurityException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (DirectoryNotFoundException)
            {
                return NotFound(new { error = "Directory not found." });
            }
        }

        [HttpGet("download")]
        public IActionResult Download([FromQuery] string? path)
        {
            try
            {
                var fileInfo = _fileBrowserService.GetFileForDownload(path);
                return PhysicalFile(fileInfo.FullPath, fileInfo.ContentType, fileInfo.FileName, enableRangeProcessing: true);
            }
            catch (SecurityException)
            {
                return BadRequest(new { error = "Invalid file path or path traversal detected." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { error = "File not found." });
            }
        }
    }
}
