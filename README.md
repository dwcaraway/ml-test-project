# ML Test Project

[![Project Tests](https://github.com/dwcaraway/ml-test-project/actions/workflows/tests.yml/badge.svg)](https://github.com/dwcaraway/ml-test-project/actions/workflows/tests.yml)

A full-stack web application starter featuring a C# ASP.NET Core backend and a TypeScript single-page application (SPA) frontend built with Vite.

---

## Project Structure

```text
ml-test-project/
├── backend/                        # ASP.NET Core Web API & test solution
│   ├── Controllers/                # ASP.NET Core web API controllers
│   ├── Properties/                 # Launch profiles (launchSettings.json)
│   ├── TestProject.Tests/          # xUnit unit & integration tests
│   │   ├── Controllers/            # Unit tests for controller behavior
│   │   └── Integration/            # Integration tests for API endpoints
│   ├── wwwroot/                    # Built frontend distribution target / static files
│   ├── Program.cs                  # ASP.NET Core host and pipeline configuration
│   ├── appsettings*.json           # Runtime configuration files
│   ├── TestProject.csproj          # Main .NET project file
│   └── TestProject.sln             # Solution file
├── frontend/                       # TypeScript SPA built with Vite
│   ├── src/                        # TypeScript source files
│   │   ├── core/                   # Core SPA router, view, and component base classes
│   │   ├── components/             # Reusable UI components (Navbar, HeroCard)
│   │   ├── views/                  # Composite views (HomeView, DetailView, NotFoundView)
│   │   ├── api.ts                  # API client logic
│   │   └── main.ts                 # App initialization & route registration
│   ├── tests/                      # Frontend unit tests (Vitest)
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Frontend dependencies & npm scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── vite.config.ts              # Vite server & proxy configuration
├── .github/workflows/              # CI/CD automation workflows
├── AGENTS.md                       # Repo guidance and conventions
└── README.md
```

---

## Prerequisites

* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (or compatible newer SDK such as .NET 9)
* [Node.js](https://nodejs.org/) (v18+ or current LTS recommended) and npm

Verify your installation:

```bash
dotnet --version
node --version
```

---

## Backend Server

The backend is built with ASP.NET Core and provides the Web API service as well as hosting for the static production frontend build.

### Running the Server

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Restore dependencies & build:**

   ```bash
   dotnet build
   ```

3. **Run the application:**

   ```bash
   dotnet run
   ```

4. **Access the application:**

   By default, the server listens on the following endpoints (defined in `backend/Properties/launchSettings.json`):

   * **HTTPS:** `https://localhost:7146`
   * **HTTP:** `http://localhost:5120`

   Key routes:
   * **API Endpoint:** [`https://localhost:7146/test`](https://localhost:7146/test) &mdash; returns `"API Response"`
   * **Frontend Entry:** [`https://localhost:7146/index.html`](https://localhost:7146/index.html) &mdash; serves static files or built SPA assets from `backend/wwwroot`

---

### Running Server Tests

The test suite uses **xUnit** and **Microsoft.AspNetCore.Mvc.Testing** for unit and integration testing.

* **Run all backend tests:**

  ```bash
  cd backend
  dotnet test
  ```

---

## Frontend Server

The frontend application is a modern single-page application built with TypeScript and Vite.

### Running the Development Server

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Access the application:**

   Open your browser at [`http://localhost:3000`](http://localhost:3000).

   > [!NOTE]
   > The Vite development server is configured in `vite.config.ts` to automatically proxy requests made to `/test` to the backend at `https://localhost:7146`. Make sure the backend server is running concurrently if you want to test API interaction.

---

### Building for Production

* **Build the application:**

  ```bash
  npm run build
  ```

  This runs TypeScript verification (`tsc`) and compiles static assets via Vite directly into `backend/wwwroot` so the ASP.NET Core server can host the SPA.

* **Preview the production build:**

  ```bash
  npm run preview
  ```

---

### Running Frontend Tests & Type Checking

* **Run unit tests (Vitest):**

  ```bash
  npm test
  ```

* **Run TypeScript type checking:**

  ```bash
  npm run typecheck
  ```

---

## Continuous Integration

A GitHub Actions workflow is configured at [`.github/workflows/dotnet.yml`](.github/workflows/dotnet.yml). It automatically restores dependencies, builds the solution in `Release` mode, and runs the test suite on every push and pull request.
