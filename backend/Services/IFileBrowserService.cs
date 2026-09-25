using TestProject.Models;

namespace TestProject.Services
{
    public interface IFileBrowserService
    {
        Task<BrowseResponse> BrowseDirectoryAsync(BrowseRequest request, CancellationToken cancellationToken = default);

        FileDownloadInfo GetFileForDownload(string? relativePath);

        void DeleteItem(string? relativePath);

        string ResolveAndValidatePath(string? relativePath, bool mustBeDirectory = false);
    }
}
