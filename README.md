# ML Test Project

[![.NET Tests](https://github.com/dwcaraway/ml-test-project/actions/workflows/dotnet.yml/badge.svg)](https://github.com/dwcaraway/ml-test-project/actions/workflows/dotnet.yml)

A full-stack web application starter featuring a C# ASP.NET Core backend and a vanilla JavaScript single-page application (SPA) frontend.

---

## Project Structure

```text
ml-test-project/
├── Controllers/            # ASP.NET Core web API controllers
├── TestProject.Tests/      # xUnit test project
│   ├── Controllers/       # Unit tests for controller behavior
│   ├── Integration/        # End-to-end/integration tests for endpoints
│   └── ...                # Test project configuration and test files
├── wwwroot/                # Static frontend assets served by the app
├── Program.cs              # App startup and middleware configuration
├── appsettings*.json       # Runtime configuration files
├── TestProject.csproj      # Main .NET project definition
├── TestProject.sln        # Solution file
├── .github/workflows/      # CI/CD automation
```

---

## Prerequisites

* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (or compatible newer SDK such as .NET 9)

Verify your installation:

```bash
dotnet --version
```

---

## Running the Server

1. **Restore dependencies & build:**

   ```bash
   dotnet build
   ```

2. **Run the application:**

   ```bash
   dotnet run
   ```

3. **Access the application:**

   By default, the server listens on the following endpoints (defined in `Properties/launchSettings.json`):

   * **HTTPS:** `https://localhost:7146`
   * **HTTP:** `http://localhost:5120`

   Key routes:
   * **API Endpoint:** [`https://localhost:7146/test`](https://localhost:7146/test) &mdash; returns `"API Response"`
   * **Frontend Entry:** [`https://localhost:7146/index.html`](https://localhost:7146/index.html) &mdash; serves the SPA landing page

---

## Running Tests

The test suite uses **xUnit** and **Microsoft.AspNetCore.Mvc.Testing** for unit and integration testing.

* **Run all tests in the solution:**

  ```bash
  dotnet test
  ```

---

## Continuous Integration

A GitHub Actions workflow is configured at [`.github/workflows/dotnet.yml`](.github/workflows/dotnet.yml). It automatically restores dependencies, builds the solution in `Release` mode, and runs the test suite on every push and pull request.
