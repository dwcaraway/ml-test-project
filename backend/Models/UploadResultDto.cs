namespace TestProject.Models
{
    public class UploadResultDto
    {
        public required string FileName { get; set; }
        public required string Path { get; set; }
        public long SizeBytes { get; set; }
        public required string Message { get; set; }
    }
}
