namespace TestProject.Models
{
    public class FileDownloadInfo
    {
        public required string FullPath { get; set; }
        public required string FileName { get; set; }
        public required string ContentType { get; set; }
        public long FileSizeBytes { get; set; }
    }
}
