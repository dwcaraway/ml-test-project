using Microsoft.AspNetCore.Http;
using TestProject.Models;

namespace TestProject.Services
{
    public interface IFileBrowserService
    {
        Task<BrowseResponse> BrowseDirectoryAsync(BrowseRequest request, CancellationToken cancellationToken = default);

        FileDownloadInfo GetFileForDownload(string? relativePath);

        void DeleteItem(string? relativePath);

        Task<UploadResultDto> UploadFileAsync(string? targetDirectory, IFormFile file, CancellationToken cancellationToken = default);

        Task<SearchResponseDto> SearchFilesAsync(SearchRequest request, CancellationToken cancellationToken = default);

        string ResolveAndValidatePath(string? relativePath, bool mustBeDirectory = false);
    }
}
