using System.IO;
using System.Security;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using TestProject.Configuration;
using TestProject.Models;

namespace TestProject.Services
{
    public class FileBrowserService : IFileBrowserService
    {
        private readonly FileBrowserOptions _options;
        private readonly FileExtensionContentTypeProvider _contentTypeProvider;

        public FileBrowserService(IOptions<FileBrowserOptions> options)
        {
            _options = options.Value;
            _contentTypeProvider = new FileExtensionContentTypeProvider();
        }

        public static string NormalizeSeparators(string? path)
        {
            if (string.IsNullOrEmpty(path))
            {
                return string.Empty;
            }

            return path.Replace('\\', '/');
        }

        public string ResolveAndValidatePath(string? relativePath, bool mustBeDirectory = false)
        {
            var rootWithoutTrailing = _options.GetCanonicalRootPath()
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var canonicalRootWithSeparator = rootWithoutTrailing + Path.DirectorySeparatorChar;

            var safeRelativePath = NormalizeSeparators(relativePath);

            // Trim leading slashes to prevent escaping root via virtual root navigation
            if (safeRelativePath.StartsWith('/'))
            {
                safeRelativePath = safeRelativePath.TrimStart('/');
            }

            string canonicalTarget;
            if (string.IsNullOrWhiteSpace(safeRelativePath))
            {
                canonicalTarget = rootWithoutTrailing;
            }
            else
            {
                string combined;
                try
                {
                    combined = Path.Combine(canonicalRootWithSeparator, safeRelativePath);
                }
                catch (ArgumentException ex)
                {
                    throw new SecurityException("Invalid directory path or path traversal detected.", ex);
                }

                try
                {
                    canonicalTarget = Path.GetFullPath(combined).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                }
                catch (Exception ex) when (ex is ArgumentException or NotSupportedException or PathTooLongException)
                {
                    throw new SecurityException("Invalid directory path or path traversal detected.", ex);
                }
            }

            bool isRoot = canonicalTarget.Equals(rootWithoutTrailing, StringComparison.OrdinalIgnoreCase);
            bool isSubItem = canonicalTarget.StartsWith(canonicalRootWithSeparator, StringComparison.OrdinalIgnoreCase);

            if (!isRoot && !isSubItem)
            {
                throw new SecurityException("Invalid directory path or path traversal detected.");
            }

            if (mustBeDirectory)
            {
                if (File.Exists(canonicalTarget))
                {
                    throw new ArgumentException("Invalid directory path or path traversal detected.");
                }

                if (!Directory.Exists(canonicalTarget))
                {
                    throw new DirectoryNotFoundException("Directory not found.");
                }
            }

            return canonicalTarget;
        }

        public Task<BrowseResponse> BrowseDirectoryAsync(BrowseRequest request, CancellationToken cancellationToken = default)
        {
            var targetDirectory = ResolveAndValidatePath(request.Path, mustBeDirectory: true);
            var canonicalRoot = _options.GetCanonicalRootPath()
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

            var dirInfo = new DirectoryInfo(targetDirectory);

            var entries = dirInfo.EnumerateFileSystemInfos()
                .OrderBy(e => e is DirectoryInfo ? 0 : 1)
                .ThenBy(e => e.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var totalCount = entries.Count;
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);
            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling((double)totalCount / pageSize);

            var pagedEntries = entries
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e =>
                {
                    if (e is DirectoryInfo)
                    {
                        return FileSystemItemDto.Folder(e.Name);
                    }
                    else if (e is FileInfo fileInfo)
                    {
                        return FileSystemItemDto.File(e.Name, fileInfo.Length);
                    }

                    return new FileSystemItemDto
                    {
                        Name = e.Name,
                        Size = "-",
                        Type = "unknown"
                    };
                })
                .ToList();

            string currentPath;
            if (targetDirectory.Equals(canonicalRoot, StringComparison.OrdinalIgnoreCase))
            {
                currentPath = string.Empty;
            }
            else
            {
                currentPath = Path.GetRelativePath(canonicalRoot, targetDirectory).Replace('\\', '/');
                if (currentPath == ".")
                {
                    currentPath = string.Empty;
                }
            }

            var response = new BrowseResponse
            {
                CurrentPath = currentPath,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                Items = pagedEntries
            };

            return Task.FromResult(response);
        }

        public FileDownloadInfo GetFileForDownload(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                throw new ArgumentException("Path parameter is required.");
            }

            var canonicalPath = ResolveAndValidatePath(relativePath, mustBeDirectory: false);

            if (Directory.Exists(canonicalPath))
            {
                throw new ArgumentException("The specified path is a directory, not a file.");
            }

            if (!File.Exists(canonicalPath))
            {
                throw new FileNotFoundException("File not found.");
            }

            var fileInfo = new FileInfo(canonicalPath);
            if (!_contentTypeProvider.TryGetContentType(fileInfo.Name, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return new FileDownloadInfo
            {
                FullPath = canonicalPath,
                FileName = fileInfo.Name,
                ContentType = contentType,
                FileSizeBytes = fileInfo.Length
            };
        }
    }
}
