namespace TestProject.Services
{
    public static class FileBrowserStartupValidator
    {
        public static void Validate(string rootPath)
        {
            if (string.IsNullOrWhiteSpace(rootPath))
            {
                throw new InvalidOperationException("File browser root directory path cannot be empty.");
            }

            try
            {
                if (!Directory.Exists(rootPath))
                {
                    Directory.CreateDirectory(rootPath);
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Unable to access or create file browser root directory '{rootPath}'.", ex);
            }

            var probePath = Path.Combine(rootPath, $".probe_{Guid.NewGuid():N}.tmp");
            try
            {
                const string probeContent = "storage-probe-validation";
                File.WriteAllText(probePath, probeContent);

                var readBack = File.ReadAllText(probePath);
                if (readBack != probeContent)
                {
                    throw new InvalidOperationException($"Probe file content verification failed in '{rootPath}'.");
                }
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                throw new InvalidOperationException($"Failed read/write verification probe in file browser root directory '{rootPath}'. Ensure the application has read and write permissions.", ex);
            }
            finally
            {
                try
                {
                    if (File.Exists(probePath))
                    {
                        File.Delete(probePath);
                    }
                }
                catch
                {
                    // Probe cleanup best-effort
                }
            }
        }
    }
}
