# Quickstart & Validation Guide: SPA Views & Deep-Linking Routing

This guide details the end-to-end verification scenarios to validate the implementation of SPA views and deep-linking routing.

## Prerequisites
- Node.js 18+ and npm installed.
- .NET 8.0 SDK installed.

## Setup Commands

1. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Restore and build backend**:
   ```bash
   cd backend
   dotnet build
   ```

---

## Automated Validation Suite

Run automated type checks and test suites across both layers:

```bash
# Frontend type check & test run
cd frontend
npm run typecheck
npm test

# Backend test run
cd ../backend
dotnet test
```

**Expected Outcome**: All TypeScript files pass strict type checking without errors; Vitest runs all unit and component tests cleanly; .NET test suite passes with 0 failures.

---

## Interactive Verification Scenarios

### Scenario 1: Initial Page Load (Default Home View)
1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open browser to `http://localhost:3000/`.
3. **Verify**:
   - The application renders the Home View.
   - The Home View displays its constituent components: navigation header, hero introduction, and sample item list.
   - The browser URL is `/`.

### Scenario 2: In-App Client-Side Navigation
1. From the Home View, click on a detail item link (e.g., "Item 101").
2. **Verify**:
   - The browser address bar updates to `/detail/101` immediately.
   - No full browser reload occurs (the network tab shows zero document reload requests).
   - The Home View components unmount cleanly.
   - The Detail View mounts and renders with header, parameter display showing `ID: 101`, and a "Back to Home" button.

### Scenario 3: Direct Deep-Link Navigation (Hard Refresh)
1. In the browser address bar, directly navigate to `http://localhost:3000/detail/custom-item-999` and press Enter.
2. **Verify**:
   - The page loads directly into the Detail View.
   - The Detail View displays parameter `ID: custom-item-999`.
   - Clicking "Back to Home" navigates to `/` and renders the Home View without page reload.

### Scenario 4: Browser History Navigation (Back / Forward)
1. Start at `/`, click a link to `/detail/1`, then click a link to `/detail/2`.
2. Click the browser's native **Back** button.
3. **Verify**:
   - The browser URL returns to `/detail/1`.
   - The view updates to display Item 1.
4. Click the browser's native **Back** button again.
5. **Verify**:
   - The browser URL returns to `/`.
   - The Home View is displayed.
6. Click the browser's native **Forward** button.
7. **Verify**:
   - The browser URL advances to `/detail/1` and the Detail View displays properly.

### Scenario 5: Route Not Found (404 Fallback)
1. In the browser address bar, enter an unrecognized URL: `http://localhost:3000/non-existent-route`.
2. **Verify**:
   - The router catches the unmatched path.
   - The NotFoundView mounts and displays a clear "404 - View Not Found" message.
   - A recovery action link ("Go to Home") is present.
   - Clicking "Go to Home" navigates to `/` and mounts the Home View.

### Scenario 6: Production Build & ASP.NET Core Fallback
1. Build the production bundle into backend `wwwroot`:
   ```bash
   cd frontend
   npm run build
   ```
2. Start the ASP.NET Core backend:
   ```bash
   cd ../backend
   dotnet run
   ```
3. Open `https://localhost:7146/detail/prod-test-1`.
4. **Verify**:
   - ASP.NET Core serves `index.html` via fallback routing.
   - The client SPA initializes and renders the Detail View with parameter `prod-test-1`.
