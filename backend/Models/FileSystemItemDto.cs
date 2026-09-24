namespace TestProject.Models
{
    public class FileSystemItemDto
    {
        public required string Name { get; set; }
        public required string Size { get; set; }
        public required string Type { get; set; }

        public static FileSystemItemDto Folder(string name) => new()
        {
            Name = name,
            Size = "-",
            Type = "folder"
        };

        public static FileSystemItemDto File(string name, long byteLength) => new()
        {
            Name = name,
            Size = byteLength.ToString(),
            Type = "file"
        };
    }
}
