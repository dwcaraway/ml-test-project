namespace TestProject.Models
{
    public class BrowseResponse
    {
        public required string CurrentPath { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public IReadOnlyList<FileSystemItemDto> Items { get; set; } = Array.Empty<FileSystemItemDto>();
    }
}
