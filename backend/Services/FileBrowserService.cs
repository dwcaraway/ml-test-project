using System.IO;
using System.Security;
using Microsoft.AspNetCore.Http;
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

        public void DeleteItem(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                throw new ArgumentException("Path parameter is required.");
            }

            var canonicalPath = ResolveAndValidatePath(relativePath, mustBeDirectory: false);
            var rootWithoutTrailing = _options.GetCanonicalRootPath()
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

            if (canonicalPath.Equals(rootWithoutTrailing, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Cannot delete the storage root directory.");
            }

            if (File.Exists(canonicalPath))
            {
                File.Delete(canonicalPath);
                return;
            }

            if (Directory.Exists(canonicalPath))
            {
                Directory.Delete(canonicalPath, recursive: true);
                return;
            }

            throw new FileNotFoundException("Item not found.");
        }

        public async Task<UploadResultDto> UploadFileAsync(string? targetDirectory, IFormFile file, CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("A file must be provided for upload.");
            }

            const long maxSizeBytes = 8 * 1024 * 1024; // 8 MB
            if (file.Length > maxSizeBytes)
            {
                throw new ArgumentException("File exceeds the maximum allowed size of 8 MB.");
            }

            // Resolve destination directory and validate against boundary
            var canonicalTargetDir = ResolveAndValidatePath(targetDirectory, mustBeDirectory: true);

            var originalFileName = Path.GetFileName(file.FileName);
            if (string.IsNullOrWhiteSpace(originalFileName))
            {
                originalFileName = "unnamed_file";
            }

            // Extract base name and extension
            var extension = Path.GetExtension(originalFileName);
            var baseName = Path.GetFileNameWithoutExtension(originalFileName);

            var chosenFileName = originalFileName;
            var targetFilePath = Path.Combine(canonicalTargetDir, chosenFileName);

            if (File.Exists(targetFilePath) || Directory.Exists(targetFilePath))
            {
                var copyIndex = 1;
                while (true)
                {
                    chosenFileName = $"{baseName}_copy{copyIndex}{extension}";
                    targetFilePath = Path.Combine(canonicalTargetDir, chosenFileName);
                    if (!File.Exists(targetFilePath) && !Directory.Exists(targetFilePath))
                    {
                        break;
                    }
                    copyIndex++;
                }
            }

            using (var fileStream = new FileStream(targetFilePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(fileStream, cancellationToken);
            }

            // Calculate relative path for response
            var canonicalRoot = _options.GetCanonicalRootPath()
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string relativePath;
            if (canonicalTargetDir.Equals(canonicalRoot, StringComparison.OrdinalIgnoreCase))
            {
                relativePath = string.Empty;
            }
            else
            {
                relativePath = canonicalTargetDir.Substring(canonicalRoot.Length)
                    .TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                relativePath = NormalizeSeparators(relativePath);
            }

            return new UploadResultDto
            {
                FileName = chosenFileName,
                Path = relativePath,
                SizeBytes = file.Length,
                Message = "File uploaded successfully."
            };
        }

        public Task<SearchResponseDto> SearchFilesAsync(SearchRequest request, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                throw new ArgumentException("Search query cannot be empty.");
            }

            var canonicalTargetDir = ResolveAndValidatePath(request.Path, mustBeDirectory: true);
            var canonicalRoot = _options.GetCanonicalRootPath()
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

            string relativeBasePath;
            if (canonicalTargetDir.Equals(canonicalRoot, StringComparison.OrdinalIgnoreCase))
            {
                relativeBasePath = string.Empty;
            }
            else
            {
                relativeBasePath = canonicalTargetDir.Substring(canonicalRoot.Length)
                    .TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                relativeBasePath = NormalizeSeparators(relativeBasePath);
            }

            var matchingFolders = new List<SearchResultItemDto>();
            var matchingFiles = new List<SearchResultItemDto>();

            var dirQueue = new Queue<string>();
            dirQueue.Enqueue(canonicalTargetDir);

            while (dirQueue.Count > 0)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                var currentDir = dirQueue.Dequeue();

                string[] subDirs;
                try
                {
                    subDirs = Directory.GetDirectories(currentDir);
                }
                catch (Exception ex) when (ex is UnauthorizedAccessException or IOException)
                {
                    continue;
                }

                foreach (var subDir in subDirs)
                {
                    var dirName = Path.GetFileName(subDir);
                    if (dirName.Contains(request.Query, StringComparison.OrdinalIgnoreCase))
                    {
                        var relPath = subDir.Substring(canonicalRoot.Length)
                            .TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                        matchingFolders.Add(SearchResultItemDto.Folder(dirName, NormalizeSeparators(relPath)));
                    }

                    dirQueue.Enqueue(subDir);
                }

                string[] files;
                try
                {
                    files = Directory.GetFiles(currentDir);
                }
                catch (Exception ex) when (ex is UnauthorizedAccessException or IOException)
                {
                    continue;
                }

                foreach (var file in files)
                {
                    var fileName = Path.GetFileName(file);
                    if (fileName.Contains(request.Query, StringComparison.OrdinalIgnoreCase))
                    {
                        long length = 0;
                        try
                        {
                            length = new FileInfo(file).Length;
                        }
                        catch (Exception ex) when (ex is UnauthorizedAccessException or IOException)
                        {
                            length = 0;
                        }

                        var relPath = file.Substring(canonicalRoot.Length)
                            .TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                        matchingFiles.Add(SearchResultItemDto.File(fileName, NormalizeSeparators(relPath), length));
                    }
                }
            }

            // Sort by type: folders first, then files (alphabetical within type)
            var sortedFolders = matchingFolders.OrderBy(f => f.Name, StringComparer.OrdinalIgnoreCase).ToList();
            var sortedFiles = matchingFiles.OrderBy(f => f.Name, StringComparer.OrdinalIgnoreCase).ToList();
            var allItems = sortedFolders.Concat(sortedFiles).ToList();

            var totalCount = allItems.Count;
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling((double)totalCount / request.PageSize);
            var pageItems = allItems.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToList();

            return Task.FromResult(new SearchResponseDto
            {
                BasePath = relativeBasePath,
                Query = request.Query,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                Items = pageItems
            });
        }
    }
}
