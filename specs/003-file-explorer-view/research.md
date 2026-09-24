# Technical Research: Frontend File Explorer View & Breadcrumb Navigation

## Architectural Decisions & Patterns

### 1. SPA Router Query Parameter Support & History Synchronization
- **Context**: The existing `Router` in `frontend/src/core/router.ts` matches paths using strict end-of-string regex anchors (`^/path/?$`). Navigating to `/files?path=docs` currently causes route matching to fail because the query string is appended to the pathname passed into `regex.exec`.
- **Decision**: Update `Router.normalizePath` and `Router.matchRoute` to separate the pathname from `search` query parameters. 
  - `pathname` is evaluated against registered route definitions (e.g., `/files`).
  - `search` is preserved in `window.history.pushState` and `window.history.replaceState`.
  - Pass the extracted query parameters (or `URLSearchParams`) into `IView.mount(container, params, queryParams)` or expose a helper method `router.getCurrentQuery()`.
  - In `handleLinkClick`, preserve `targetUrl.search` when calling `navigate(targetUrl.pathname + targetUrl.search)`.
- **Rationale**:
  - Adheres to standard web URL semantics.
  - Aligns 1:1 with backend API query parameter convention (`GET /api/browse?path=...`).
  - Supports bookmarking, deep-linking, page refreshes, and browser Back/Forward navigation without breaking existing route patterns (`/`, `/detail/:id`).
- **Alternatives Considered**:
  - *Path-based wildcard subrouting (`/files/*`)*: Requires complex wildcard route parsing in vanilla TS and risks path delimiter escaping issues with multi-level directories; rejected in favor of query parameters.
  - *In-memory state without URL synchronization*: Violates deep-linking requirement and breaks browser history navigation.

---

### 2. Breadcrumb Truncation & Interactive Ellipsis (`...`) Expansion
- **Context**: When navigating into directories more than 3 levels below root (e.g., `Home > a > b > c > d`), the breadcrumb must collapse to `Home > ... > d`. Clicking `...` must expand the trail inline to show all intermediate segments (`Home > a > b > c > d`).
- **Decision**: Implement a dedicated `BreadcrumbComponent` managing an internal `isExpanded: boolean` flag.
  - Compute path segments: split `currentPath` by `/` (e.g. `["a", "b", "c", "d"]`).
  - Depth calculation: segment count `N`.
  - If `N <= 3` or `isExpanded === true`: render all segments: `Home > a > b > c > d`.
  - If `N > 3` and `isExpanded === false`: render `Home > ... > d`, where `...` is rendered as an interactive button/link with `aria-label="Expand hidden folders"`.
  - Clicking `...` sets `isExpanded = true` and re-renders the breadcrumb bar in place without navigating away.
  - Clicking any named folder segment invokes navigation to that folder's accumulated relative path (e.g., clicking `b` navigates to `/files?path=a/b`).
  - Clicking `Home` navigates to `/files` (root).
- **Rationale**:
  - Prevents horizontal layout overflow on narrow viewports or deep hierarchies.
  - Provides instant access to intermediate parent directories on demand without additional server requests.
- **Alternatives Considered**:
  - *Static non-interactive ellipsis*: Fails to satisfy user preference for intermediate navigation.
  - *Dropdown menu on ellipsis*: More DOM complexity than an inline expansion and violates KISS (Constitution Principle IV).

---

### 3. File Listing Rendering & Folder Size Formatting
- **Context**: The browse API returns a JSON list containing `name`, `size`, and `type`. Folders return `size: "-"`, and files return their byte count string.
- **Decision**: Render a clean, semantic HTML `<table>` or structured list with distinct visual icons/badges for folders and files.
  - Folder rows:
    - Display folder icon / text `[Folder]`.
    - Clicking folder name triggers navigation (`/files?path={folderPath}`).
    - Size column displays `"-"`.
    - Download column is empty.
  - File rows:
    - Display file icon / text `[File]`.
    - File name is static text.
    - Size column displays formatted size (e.g. `"2048 B"` or `"2.0 KB"` alongside byte count).
    - Download column displays an accessible link/button: `<a href="/api/download?path={filePath}" download="{name}">Download</a>`.
- **Rationale**:
  - Matches user requirements and API schema invariants established in feature `002-file-browser-api`.
  - Native `<a download>` handles binary stream downloading directly with browser download managers.
- **Alternatives Considered**:
  - *JavaScript blob fetch for download*: Buffers entire file into browser memory before saving; violates streaming goals and causes memory pressure on large files. Native link with `/api/download?path=...` streams directly.

---

### 4. API Client Integration & Lifecycle State Management
- **Context**: The frontend needs to fetch directory contents from `GET /api/browse?path=...`.
- **Decision**: Extend `frontend/src/api.ts` with:
  ```typescript
  export interface FileSystemItem {
    name: string;
    size: string;
    type: 'folder' | 'file';
  }

  export interface BrowseResponse {
    currentPath: string;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: FileSystemItem[];
  }

  export async function fetchBrowseDirectory(path = '', baseUrl = ''): Promise<BrowseResponse>
  ```
  - `FileExplorerView` manages view states:
    - `LOADING`: Displays accessible loading indicator.
    - `SUCCESS`: Renders breadcrumbs and file/folder table.
    - `EMPTY`: Renders friendly "This directory is empty" message.
    - `ERROR`: Displays error banner with "Retry" button and "Return to Home" link.
- **Rationale**:
  - Keeps API calls decoupled from DOM presentation.
  - Gracefully handles network failures, 404s, and server disconnects.

---

### 5. Navbar Integration & Routing Configuration
- **Context**: Users must be able to access the File Explorer from the global application navigation.
- **Decision**:
  - Add `{ path: '/files', label: 'Files' }` to `NavbarComponent` link list.
  - Register route `/files` in `frontend/src/main.ts` mapping to `FileExplorerView`.
- **Rationale**:
  - Provides discoverability across all SPA views.
  - Maintains consistent navigation bar styling and active-state highlighting.
