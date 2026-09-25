using System.Security;
using Microsoft.AspNetCore.Http;
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

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] SearchRequest request, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Search called with query: {@Request}", request);

            try
            {
                var response = await _fileBrowserService.SearchFilesAsync(request, cancellationToken);
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

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery] string? path)
        {
            _logger.LogDebug("Deletecalled with query: {@path}", path);

            try
            {
                _fileBrowserService.DeleteItem(path);
                return Ok(new { message = "Item deleted successfully." });
            }
            catch (SecurityException)
            {
                return BadRequest(new { error = "Invalid path or path traversal detected." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { error = "Item not found." });
            }
        }

        [HttpPost("upload")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> Upload([FromQuery] string? path, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Upload called for path: {Path}", path);

            if (!Request.HasFormContentType)
            {
                return BadRequest(new { error = "A file must be provided for upload." });
            }

            IFormFile? file = null;
            try
            {
                if (Request.Form.Files.Count > 0)
                {
                    file = Request.Form.Files["file"] ?? Request.Form.Files[0];
                }
            }
            catch (Exception)
            {
                return BadRequest(new { error = "A file must be provided for upload." });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "A file must be provided for upload." });
            }

            try
            {
                var result = await _fileBrowserService.UploadFileAsync(path, file, cancellationToken);
                return Ok(result);
            }
            catch (SecurityException)
            {
                return BadRequest(new { error = "Invalid path or path traversal detected." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (DirectoryNotFoundException)
            {
                return NotFound(new { error = "Destination directory not found." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error uploading file.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An error occurred while uploading the file." });
            }
        }
    }
}
