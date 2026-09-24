namespace TestProject.Models
{
    public class BrowseRequest
    {
        private int _page = 1;
        private int _pageSize = 50;

        public string? Path { get; set; } = string.Empty;

        public int Page
        {
            get => _page;
            set => _page = value < 1 ? 1 : value;
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value < 1 ? 50 : (value > 100 ? 100 : value);
        }
    }
}
