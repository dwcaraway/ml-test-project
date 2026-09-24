# Feature Specification: File & Directory Browsing Web API

**Feature Branch**: `002-file-browser-api`

**Created**: 2026-09-24

**Status**: Ready for Planning

**Input**: User description: "Create a webapi that allows browse files and folders and to download files. The server side home (root) directory for files and folders can be specified by environment variable. On server start, ensure ability to write and read from the home directory. Use pagination to break out long results from the api. Do not worry about authentication at this time. All browse results must include name. Files should have a file size and folders should return '-'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Directory Browsing with Pagination (Priority: P1)

As a client application or end user, I want to query a directory within the home directory and receive a paginated list of items with their names and sizes (with folders displaying `-`), so that I can explore directory contents efficiently without overwhelming system memory or network bandwidth.

**Why this priority**: Core browsing functionality is the primary MVP capability required by consumers to navigate file trees.

**Independent Test**: Send a GET request to browse the root or a subfolder; verify that files and folders are returned with their respective names and sizes (folders showing `-`), and verify pagination limits the result count with proper page metadata.

**Acceptance Scenarios**:

1. **Given** a directory containing files and subfolders, **When** a client requests a browse listing via query parameter (e.g., `GET /api/browse?path=subfolder&page=1&pageSize=50`), **Then** the response returns a JSON payload containing entries where every entry has a `name` and a `size`, where files show their file size and folders display `"-"`.
2. **Given** a directory containing more items than the requested page size, **When** a client requests a specific page, **Then** the API returns only that page's items along with pagination metadata (e.g., total count, current page, page size, total pages).
3. **Given** a request for a directory path that does not exist, **When** the client submits the request, **Then** the API returns a 404 Not Found error with a clear error message.
4. **Given** a client submits a path traversal attempt such as `../secret.txt`, `..\\secret.txt`, or an absolute path like `/etc/passwd`, **When** the API attempts to resolve the path, **Then** the server rejects the request with a 400 Bad Request or 403 Forbidden and does not disclose file system contents outside the configured home directory.

---

### User Story 2 - File Downloading (Priority: P2)

As a client application or user, I want to download a specific file from the home directory tree, so that I can retrieve and save the exact file content locally.

**Why this priority**: File retrieval is the natural secondary capability following directory browsing.

**Independent Test**: Send a GET request to download an existing file; verify that the response returns the binary file stream with appropriate headers, and verify that attempting to download a directory or nonexistent file returns an error.

**Acceptance Scenarios**:

1. **Given** a valid file path within the home directory (e.g., `GET /api/download?path=subfolder/document.pdf`), **When** a client sends a download request, **Then** the server streams the file content with standard download headers (`application/octet-stream` or matching MIME type, `Content-Disposition`) and content length.
2. **Given** a request attempting to download a path that resolves to a folder instead of a file, **When** the client submits the request, **Then** the server responds with a 400 Bad Request error.
3. **Given** a request targeting a nonexistent file, **When** the client submits the request, **Then** the server responds with a 404 Not Found error.

---

### User Story 3 - Configurable Home Directory & Startup Validation (Priority: P3)

As a system operator or administrator, I want to configure the server's home root directory via an environment variable and have the server verify read/write access upon startup, so that configuration or permission problems are detected immediately.

**Why this priority**: Operational stability and flexible deployment environments require configurable paths and early validation of essential storage permissions.

**Independent Test**: Launch the server with a configured home directory environment variable; verify that the server confirms read and write access, and verify fail-fast behavior when the path is inaccessible.

**Acceptance Scenarios**:

1. **Given** a valid and accessible directory specified via environment variable `FILE_BROWSER_ROOT`, **When** the server starts, **Then** the server confirms read and write access and accepts client browse requests rooted at that directory.
2. **Given** `FILE_BROWSER_ROOT` is unset, **When** the server starts, **Then** the server defaults to `./storage` relative to the application base directory, verifying read and write permissions.
3. **Given** `FILE_BROWSER_ROOT` points to an invalid, nonexistent, or read-only directory, **When** the server starts, **Then** the startup validation fails, throwing a fatal exception and halting the process before accepting traffic.

---

### Edge Cases

- **Path Traversal Attacks**: What happens when a client submits paths containing `../`, `..\\`, or absolute root paths? The system MUST normalize paths and strictly reject any request attempting to escape the configured home directory with a 400 Bad Request or 403 Forbidden.
- **Security Constraint**: The system MUST require all requested file and directory paths to be resolved beneath the configured `FILE_BROWSER_ROOT` home directory. The server MUST reject absolute paths, drive-qualified paths, and any traversal sequences that would escape the home directory before performing file system access.
- **Empty Directories**: How does the system handle an empty folder? It MUST return an empty item collection with valid pagination metadata (e.g., total items 0) and HTTP 200 OK.
- **Large Files**: How are multi-gigabyte files handled during download? The server MUST stream file content asynchronously to avoid loading entire files into server memory.
- **Special Characters**: How are file names containing spaces, non-ASCII characters, or symbols handled? Path parameters and file names MUST be properly URL-decoded and encoded in Content-Disposition headers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a JSON Web API endpoint to browse files and directories under the server-side home directory.
- **FR-002**: Every item returned in the browse response MUST include a `name` and a `size`. Files MUST report their file size, and folders MUST return `"-"` as their size.
- **FR-003**: The browse API MUST support pagination parameters to partition large directory listings into manageable pages.
- **FR-004**: The system MUST configure the server home root directory via the environment variable `FILE_BROWSER_ROOT`, defaulting to `./storage` relative to the application base directory if the environment variable is not defined.
- **FR-005**: On application startup, the system MUST verify both read and write capabilities on the configured home directory. If verification fails (e.g., directory does not exist or lacks read/write permissions), the server MUST fail-fast, throwing a fatal startup exception and terminating application launch with a descriptive error message.
- **FR-006**: The system MUST provide an endpoint to download any file located under the home directory as a binary stream.
- **FR-007**: The system MUST enforce strict boundary security, preventing path traversal outside the configured home directory.
- **FR-008**: The system MUST validate all input paths against the configured `FILE_BROWSER_ROOT` home directory before any file system access occurs. Any request that resolves outside that root, including absolute paths, drive-qualified paths, or traversal sequences such as `../`, MUST be rejected with a 400 Bad Request or 403 Forbidden response.
- **FR-009**: The browse endpoint MUST accept directory navigation paths via a query parameter (e.g., `?path=subfolder/docs`), querying the root home directory when the path parameter is omitted or empty.
- **FR-010**: The system MUST NOT require authentication for browsing or downloading in this release.

### Key Entities

- **DirectoryListing**: Represents a paginated page of directory entries. Contains current relative path, pagination metadata (page number, page size, total item count, total pages), and an array of `FileSystemItem` entries.
- **FileSystemItem**: Represents a single file or subfolder. Contains `name` (string), `size` (string or formatted representation, `"-"` for folders), and `type` (file vs directory indicator).
- **HomeDirectoryConfig**: Server configuration containing the resolved root directory path and validation status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Browsing a directory containing up to 10,000 items completes response delivery within 200 milliseconds when using standard pagination page sizes (e.g., 50 items).
- **SC-002**: 100% of directory entries include `name` and `size`, with 100% of folder entries returning `"-"` for size.
- **SC-003**: 100% of path traversal attack attempts targeting paths outside the home directory are blocked.
- **SC-004**: File download throughput for large files is constrained only by client network bandwidth, without causing server memory spikes.
- **SC-005**: Server startup validation completes within 500 milliseconds of application initialization.

## Assumptions

- Operating system file permissions allow the server host process to inspect file attributes and create/delete a temporary test file during startup verification.
- Consumers of the API communicate via HTTP/HTTPS using standard JSON for browse payloads and binary streams for downloads.
- Authentication and authorization are out of scope for this version.
