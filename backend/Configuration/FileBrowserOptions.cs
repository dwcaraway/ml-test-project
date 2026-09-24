namespace TestProject.Configuration
{
    public class FileBrowserOptions
    {
        public const string SectionName = "FileBrowser";
        public const string EnvVarName = "FILE_BROWSER_ROOT";
        public const string DefaultStorageRoot = "./storage";

        private string _rootPath = DefaultStorageRoot;

        public string RootPath
        {
            get => _rootPath;
            set => _rootPath = string.IsNullOrWhiteSpace(value) ? DefaultStorageRoot : value;
        }

        public string GetCanonicalRootPath()
        {
            if (string.Equals(_rootPath, DefaultStorageRoot, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(_rootPath, "storage", StringComparison.OrdinalIgnoreCase))
            {
                return ResolveDefaultStoragePath();
            }

            return Path.GetFullPath(_rootPath);
        }

        private static string ResolveDefaultStoragePath()
        {
            var current = Directory.GetCurrentDirectory();
            var currentStorage = Path.Combine(current, "storage");
            if (Directory.Exists(currentStorage))
            {
                return Path.GetFullPath(currentStorage);
            }

            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null)
            {
                var candidate = Path.Combine(dir.FullName, "storage");
                if (Directory.Exists(candidate))
                {
                    return Path.GetFullPath(candidate);
                }
                dir = dir.Parent;
            }

            return Path.GetFullPath(DefaultStorageRoot);
        }
    }
}
