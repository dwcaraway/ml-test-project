# Technical Research: SPA Views & Deep-Linking Routing

## Research Tasks & Investigations

### 1. Vanilla TypeScript Client-Side Router & History API
- **Context**: The SPA must support deep-linking and browser navigation (Back/Forward) without any external routing library or UI framework, adhering to Project Constitution Principles I (Zero-Framework Vanilla TypeScript SPA) and IV (KISS).
- **Decision**: Implement a lightweight, standalone `Router` class that manages URL matching, parameter extraction, and view switching using standard Web APIs (`window.history.pushState`, `window.history.replaceState`, and the `popstate` event).
- **Rationale**:
  - The browser's native HTML5 History API provides complete control over URL paths and navigation history without page reloads.
  - Path pattern parsing (e.g., `/detail/:id`) can be achieved with simple regular expression compilation in ~40 lines of code.
  - Zero external dependencies ensures complete compliance with the project constitution and keeps frontend load time negligible (<50ms).
- **Alternatives Considered**:
  - *Hash-based routing (`#/view/id`)*: Rejected during the specification phase in favor of clean path URLs.
  - *Third-party micro-routers (e.g., Navigo, Page.js)*: Rejected because Constitution Principle I strictly prohibits third-party frontend frameworks and UI libraries.
  - *HTML5 Hashbang (`#!/...`)*: Deprecated web pattern, inferior to standard History API.

### 2. View and Component Composition Architecture
- **Context**: The SPA must organize UI into discrete views composed of collections of reusable components.
- **Decision**: Define minimal, contract-driven interfaces (`View` and `Component`) with explicit lifecycle methods:
  - `Component`: Exposes `render(): HTMLElement` and optional `destroy(): void`.
  - `View`: Encapsulates a page context, exposes `mount(container: HTMLElement, params: Record<string, string>): void`, `unmount(): void`, and orchestrates child components.
- **Rationale**:
  - Direct DOM manipulation via native `document.createElement`, element attributes, and standard event listeners provides maximum performance and transparency.
  - Explicit `mount`/`unmount` lifecycles make view transitions deterministic, eliminate ghost event listeners, and prevent memory leaks.
  - Simple object-oriented or factory patterns in TypeScript provide strong type safety without requiring JSX or a custom virtual DOM compiler.
- **Alternatives Considered**:
  - *Custom Virtual DOM / Reactive Signal Engine*: Overly complex; violates Principle IV (Simplicity, Readability & Function Over Styling) and Principle I (framework ban spirit).
  - *Raw HTML string concatenation (`container.innerHTML = '...'`)*: Prone to XSS vulnerabilities, breaks event listener references on re-renders, and complicates lifecycle cleanup.

### 3. Server-Side Fallback for HTML5 History API Routing
- **Context**: In an SPA using HTML5 path routing, direct browser requests or hard refreshes to `/detail/42` hit the server first. Without server configuration, the server returns 404.
- **Decision**: Configure ASP.NET Core fallback routing in `backend/Program.cs` via `app.MapFallbackToFile("index.html")`. For development, Vite's built-in development server handles SPA fallback by default.
- **Rationale**:
  - `app.MapFallbackToFile("index.html")` is the official, idiomatic ASP.NET Core middleware for SPAs.
  - It ensures API routes (`/test`, `/api/*`) and physical static files (`/assets/*`) are handled normally, while any unmatched GET request serves the SPA entry point (`index.html`).
- **Alternatives Considered**:
  - *Custom MVC controller fallback*: Unnecessary boilerplate when `MapFallbackToFile` is built into ASP.NET Core.
  - *Hash routing*: Avoids server configuration but produces non-standard URLs and was explicitly rejected in the specification phase.

### 4. Memory Management & Event Listener Cleanup
- **Context**: SPAs run in a single persistent browser tab; if discarded views do not detach window or document listeners, memory consumption steadily grows over time.
- **Decision**: Implement an `AbortController` or explicit disposal registry pattern within each `View`. When a view mounts, event listeners that attach to `window`, `document`, or external services register a cleanup callback or use `{ signal: abortController.signal }`. Calling `unmount()` automatically aborts the controller and cleans all listeners.
- **Rationale**:
  - Completely prevents detached DOM elements and zombie event listeners from remaining in memory.
  - Native browser `AbortSignal` is supported in all modern browsers and simplifies event detachment to a single `abort()` call.
- **Alternatives Considered**:
  - *Manual `removeEventListener` calls*: Verbose and error-prone if developer forgets to retain function references.
  - *Relying solely on element removal*: Fails to clean listeners attached to `window` (e.g. resize, keydown, popstate).
