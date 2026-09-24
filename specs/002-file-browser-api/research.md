# Technical Research: File & Directory Browsing Web API

## Research Tasks & Architectural Decisions

### 1. ASP.NET Core Startup Permission Verification & Fail-Fast Pattern
- **Context**: The server must verify read and write capabilities on the home directory at startup and fail-fast (halting initialization with an exception) if verification fails (per user decision for Question 2).
- **Decision**: Implement startup verification executed in `Program.cs` before `app.Run()`. The validator resolves the home directory, verifies directory existence, and performs a read-write probe by creating, reading, and deleting a temporary probe file (`.probe_{guid}.tmp`).
- **Rationale**:
  - Running before `app.Run()` prevents the server from binding to ports and accepting network traffic in an invalid state.
  - Creating and deleting a probe file is the only cross-platform, deterministic method to verify real OS write and read access (ACLs and attribute inspections alone can be deceptive or OS-specific).
  - Throws an `InvalidOperationException` with a clear, actionable message if the path cannot be accessed.
- **Alternatives Considered**:
  - *ASP.NET Core Health Checks*: Runs periodically after startup and returns HTTP 503; rejected because the user explicitly selected Fail-Fast termination on startup.
  - *Lazy verification on first API request*: Delayed error detection; rejected because operators need immediate deployment feedback.

### 2. Secure Path Resolution & Path Traversal Prevention
- **Context**: Clients submit relative directory and file paths via query parameters. The system must prevent path traversal attacks (e.g., `../../etc/passwd` or `..\..\Windows`).
- **Decision**: Normalize and validate all incoming paths using `Path.GetFullPath`:
  ```csharp
  var fullRoot = Path.GetFullPath(rootDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
  var targetCombined = Path.GetFullPath(Path.Combine(fullRoot, relativePath ?? string.Empty));
  if (!targetCombined.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
  {
      throw new SecurityException("Access denied: path traversal attempt detected.");
  }
  ```
- **Rationale**:
  - `Path.GetFullPath` resolves relative navigations (`.` and `..`) and uniformizes platform directory separators.
  - Enforcing a trailing separator on the root check prevents prefix collision vulnerabilities (e.g., `/storage-secret` matching `/storage`).
  - Guarantees 100% of traversal attempts outside the home root are blocked with HTTP 400 Bad Request.
- **Alternatives Considered**:
  - *String search or regex for `..`*: Error-prone due to URL encoding variations, alternate directory separators, and Unicode normalization.

### 3. High-Performance Directory Enumeration & Pagination
- **Context**: Directories can contain thousands of items. The API must paginate results and maintain sub-200ms latency without excessive memory consumption.
- **Decision**: Use `DirectoryInfo.EnumerateFileSystemInfos` with ordering (directories first, then alphabetically by name) combined with `.Skip((page - 1) * pageSize).Take(pageSize)`.
- **Rationale**:
  - `EnumerateFileSystemInfos` streams metadata lazily without allocating entire arrays upfront.
  - Direct retrieval of `FileSystemInfo` provides both file attributes, sizes, and directory flags in a single system call.
  - Folders are assigned `size: "-"` while files report their size formatted as byte count / string representation per specification requirements.
- **Alternatives Considered**:
  - *`Directory.GetFiles()` and `Directory.GetDirectories()`*: Loads all entries into memory arrays before filtering or sorting, resulting in high GC allocation on large directories.

### 4. Efficient File Streaming for Downloads
- **Context**: The download endpoint must serve files of arbitrary size without memory buffering spikes.
- **Decision**: Return ASP.NET Core `PhysicalFileResult` using `File(fullPath, contentType, downloadFileName, enableRangeProcessing: true)`.
- **Rationale**:
  - Streams directly from the operating system file handle to the HTTP response stream.
  - Automatically sets `Content-Disposition`, `Content-Length`, and standard MIME types via `FileExtensionContentTypeProvider`.
  - Supports HTTP Range requests for resuming interrupted downloads.
- **Alternatives Considered**:
  - *Reading `File.ReadAllBytesAsync`*: Loads entire files into memory; causes memory exhaustion on multi-gigabyte files.
