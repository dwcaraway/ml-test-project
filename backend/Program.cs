namespace TestProject
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.Configure<TestProject.Configuration.FileBrowserOptions>(options =>
            {
                var rootEnv = Environment.GetEnvironmentVariable(TestProject.Configuration.FileBrowserOptions.EnvVarName);
                if (!string.IsNullOrWhiteSpace(rootEnv))
                {
                    options.RootPath = rootEnv;
                }
                else if (!string.IsNullOrWhiteSpace(builder.Configuration[TestProject.Configuration.FileBrowserOptions.EnvVarName]))
                {
                    options.RootPath = builder.Configuration[TestProject.Configuration.FileBrowserOptions.EnvVarName]!;
                }
            });

            builder.Services.AddSingleton<TestProject.Services.IFileBrowserService, TestProject.Services.FileBrowserService>();

            builder.Services.AddControllers();

            var app = builder.Build();

            // Configure the HTTP request pipeline.

            if (!app.Environment.IsEnvironment("Testing"))
            {
                app.UseHttpsRedirection();
            }

            app.UseStaticFiles();

            app.MapControllers();

            app.MapFallbackToFile("index.html");

            var fileBrowserOptions = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<TestProject.Configuration.FileBrowserOptions>>().Value;
            TestProject.Services.FileBrowserStartupValidator.Validate(fileBrowserOptions.GetCanonicalRootPath());

            app.Run();
        }
    }
}