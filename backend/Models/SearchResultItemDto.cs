namespace TestProject.Models
{
    public class SearchResultItemDto
    {
        public required string Name { get; set; }
        public required string Path { get; set; }
        public required string Size { get; set; }
        public required string Type { get; set; }

        public static SearchResultItemDto Folder(string name, string relativePath) => new()
        {
            Name = name,
            Path = relativePath,
            Size = "-",
            Type = "folder"
        };

        public static SearchResultItemDto File(string name, string relativePath, long byteLength) => new()
        {
            Name = name,
            Path = relativePath,
            Size = byteLength.ToString(),
            Type = "file"
        };
    }
}
