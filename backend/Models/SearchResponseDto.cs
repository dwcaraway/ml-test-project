namespace TestProject.Models
{
    public class SearchResponseDto
    {
        public required string BasePath { get; set; }
        public required string Query { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public IReadOnlyList<SearchResultItemDto> Items { get; set; } = Array.Empty<SearchResultItemDto>();
    }
}
