# Feature Specification: Recursive File and Folder Search with Pagination

**Feature Branch**: `006-file-folder-search`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Add the ability to search files and folders by partial name match both at the API and in the UI front end. Searches are recursive starting at the curret path and down. Both files and folders may be returned. Do not trust strings from the user: check for common attacks like trying to escape the root folder. Only match the names of folders and files. Results are returned are sorted by type. Results maybe be paged through. Display pagination options (1 ..N) for the number of pages with the current page selected at the bottom of the explorer. Do not display the upload button on the UI while performing search as we don't know where the user wishes to upload to. In the UI, the search box should be above the search results. When in browsing mode, display the search box to the left of the upload link. While searching, deleting or uploading but before we receive a response, display a spinning icon so the user doesn't think the search failed. Hide this spinning icon when not searching, deleting or uploading. Search results should display the name of the file or folder and the size just as we do when browsing. When searching in the UI and the user selects a folder, go to browse mode with the contents of that folder displayed in the explorer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Recursive Search via Web API (Priority: P1)

An API client or external system submits a search request targeting a specific base directory with a search query string. The system performs a recursive scan of the file system starting from that directory and including all descendant subdirectories. The search matches partial names (case-insensitive) against the names of files and folders only (not file contents or metadata). The system strictly validates the input path and query string to prevent directory traversal or root folder escape attacks. Results are returned sorted by item type (folders grouped first, followed by files) and support pagination parameters (page number and page size).

**Why this priority**: Forms the core functional search engine, security boundary, and data retrieval contract for both files and folders. Can be developed, tested, and validated completely independently of the user interface.

**Independent Test**: Send HTTP search requests specifying various query substrings and base paths; verify matching files and nested folders are returned, results are sorted by type, invalid or escaping paths (`../`, `..\`, absolute paths) are rejected with a client error, and pagination parameters correctly slice the result set.

**Acceptance Scenarios**:

1. **Given** a storage tree containing nested folders and files, **When** a search request is submitted with a query matching partial names of both files and folders under the target path, **Then** all matching files and folders within the target directory and its descendant folders are returned.
2. **Given** a search matches multiple files and folders, **When** results are returned, **Then** items are sorted by type such that all folder results precede file results.
3. **Given** a search query or base path containing path traversal sequences (such as `../`, `..\\`, null bytes, or absolute paths attempting to navigate outside the storage root), **When** evaluated, **Then** the request is rejected with a validation error and no file system access outside the root occurs.
4. **Given** a search matching 75 items and a requested page size of 20, **When** requesting page 1, **Then** the first 20 items are returned along with pagination metadata indicating 4 total pages and 75 total matching items.
5. **Given** a search query that matches text inside a file's content but not in its filename, **When** the search executes, **Then** that file is NOT included in the search results.

---

### User Story 2 - File Explorer Search Box & Results Navigation (Priority: P2)

A user viewing the File Explorer sees a search input box located to the left of the "Upload" link in browsing mode. The user types a partial name and initiates a search. While searching, the UI transitions to search results mode: the search box remains visible positioned above the search results, the "Upload" button is hidden (to avoid ambiguous upload destinations during a search), and search results list matching items showing their name, type, and size (folders display size "-", files display their byte size). When the user clicks or activates a folder from the search results, the view exits search mode and navigates directly to browse mode displaying the contents of that selected folder.

**Why this priority**: Delivers the primary interactive user experience for searching within the current directory hierarchy and navigating seamlessly into discovered folders.

**Independent Test**: In browsing mode, locate the search box to the left of the upload link; submit a query; verify the upload button disappears, the search box sits above the results, matching files and folders appear with proper names and size formats, and clicking a folder switches to browse mode for that directory.

**Acceptance Scenarios**:

1. **Given** the user is in standard directory browsing mode, **When** the header renders, **Then** the search input box is visibly displayed immediately to the left of the "Upload" link.
2. **Given** a user enters a search term and triggers a search, **When** the search is active and results are displayed, **Then** the "Upload" button is removed from the view and the search box remains visible positioned above the search results list.
3. **Given** matching items in search results, **When** displayed in the table, **Then** each folder displays its name and "-" for size, and each file displays its name and its byte size.
4. **Given** search results containing a folder, **When** the user clicks or activates that folder, **Then** the explorer switches to browsing mode, navigates to that folder's path, displays that folder's contents, and restores the upload button.
5. **Given** the user clears the search or navigates back to browsing, **When** the browse view renders, **Then** the search box is again positioned to the left of the upload link.

---

### User Story 3 - Search Results Pagination Controls (Priority: P3)

When a search returns more items than fit on a single page, pagination controls are displayed at the bottom of the explorer view. The pagination controls display numbered page options (`1 .. N`) representing all available pages, with the currently active page visually highlighted or selected. The user can click any page number to navigate directly to that page of search results.

**Why this priority**: Enables users to comfortably explore large search result sets without overwhelming the browser DOM or network payload.

**Independent Test**: Execute a search yielding multiple pages of results; verify the bottom of the explorer displays numbered page options `1 .. N`; click on a different page number (e.g., page 2); verify the current page selection indicator updates and the corresponding page of results is displayed.

**Acceptance Scenarios**:

1. **Given** search results spanning multiple pages (e.g., 3 pages), **When** viewing the results, **Then** pagination options `1`, `2`, `3` are displayed at the bottom of the explorer.
2. **Given** the user is viewing page 1 of search results, **When** the pagination controls render, **Then** page `1` is marked as the currently selected page.
3. **Given** multiple pages of search results, **When** the user clicks page `2`, **Then** the explorer loads and displays the items for page 2, and page `2` is marked as the selected page.
4. **Given** search results that fit entirely on a single page (total pages = 1), **When** results are displayed, **Then** pagination either displays page `1` as selected or remains hidden if multi-page navigation is not required.

---

### User Story 4 - Global Operation Loading Spinner (Priority: P4)

Whenever an asynchronous search, delete, or upload operation is initiated and in progress, a spinning indicator icon is visibly displayed so the user is assured the system is processing the request and has not frozen or failed. As soon as the operation completes (either successfully or with an error response), the spinning icon is immediately hidden.

**Why this priority**: Essential usability and visual feedback that prevents user confusion or duplicate actions during potentially long-running file operations.

**Independent Test**: Trigger a search, a file deletion, and a file upload; verify that while the network/disk operation is ongoing, a spinning icon is clearly visible; verify that the moment the operation finishes (success or failure), the spinning icon disappears.

**Acceptance Scenarios**:

1. **Given** a user initiates a search query, **When** the search request is pending, **Then** a spinning indicator icon is visibly displayed.
2. **Given** a user confirms deletion of a file or folder, **When** the delete request is pending, **Then** the spinning indicator icon is visibly displayed.
3. **Given** a user selects a file for upload, **When** the upload transfer is in progress, **Then** the spinning indicator icon is visibly displayed.
4. **Given** an ongoing search, deletion, or upload finishes with either success or an error message, **When** the response is handled, **Then** the spinning indicator icon is immediately hidden.
5. **Given** the application is idle in browsing mode or search results view with no active network requests, **When** rendered, **Then** the spinning icon is not visible.

---

### Edge Cases

- **Root Escape & Traversal Attempts**: Searches containing `../`, `..\`, `%2e%2e`, leading slashes, null bytes, or paths resolving outside the configured storage root are rejected with a 400 Bad Request.
- **Empty or Whitespace Search Query**: When a search is triggered with an empty string or whitespace, the system either treats it as a request for all items in the hierarchy or prompts the user without executing an unbounded scan.
- **Deeply Nested Directories**: Searches correctly traverse directory trees across multiple nested levels without failing on long path lengths or circular directory references.
- **Zero Matching Results**: When no files or folders match the query, the view displays an accessible "No matching files or folders found" message and does not crash or display broken pagination.
- **Special Characters in Search Query**: Queries containing punctuation, spaces, wildcards (`*`, `?`), regex tokens, or Unicode characters are treated as literal partial string matches against file/folder names rather than interpreted as pattern expressions.
- **File System Permissions & Inaccessible Subfolders**: If a subdirectory within the search tree cannot be read due to file system permissions, the search logs a warning, skips the inaccessible branch, and continues returning matching items from readable directories without crashing the request.
- **Concurrent Actions During Active Operation**: While the spinner is active during search, delete, or upload, user interaction with conflicting action buttons is disabled or guarded against race conditions.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a search endpoint accepting a base directory path, a search query string, and optional pagination parameters (`page`, `pageSize`).
- **FR-002**: Search MUST recursively inspect the specified directory and all of its descendant folders down the entire directory subtree.
- **FR-003**: Search MUST match items where the query string appears as a partial match within the item's name.
- **FR-004**: Search MUST evaluate matches only against the names of files and folders, and MUST NOT search file contents or non-name file attributes.
- **FR-005**: Search matching MUST be case-insensitive.
- **FR-006**: Both matching files and matching folders MUST be included in the search results.
- **FR-007**: System MUST validate all user-supplied path strings and query strings, rejecting any path traversal or attempts to escape the configured root folder with a client error (`400 Bad Request`).
- **FR-008**: Search results MUST be sorted by type such that all matching folders are grouped together and all matching files are grouped together (folders first, followed by files, with alphabetical ordering within each group).
- **FR-009**: Search API MUST support pagination, returning the current page number, page size, total item count, total page count, and the subset of matching items for the requested page.
- **FR-010**: System MUST clamp or validate pagination parameters (e.g. `page >= 1`, `pageSize` within reasonable limits such as 1 to 100).
- **FR-011**: In browsing mode, the UI MUST display a search input box positioned immediately to the left of the "Upload" link/button in the explorer header.
- **FR-012**: In search results mode, the search input box MUST be positioned above the search results table.
- **FR-013**: In search results mode, the UI MUST NOT display the "Upload" button or link.
- **FR-014**: Search results table MUST display the name, type, and size of each matching item using the same conventions as browsing mode (folders display `"-"` for size, files display their size in bytes).
- **FR-015**: When a user selects or clicks a folder in search results, the UI MUST switch to browsing mode and display the contents of that selected folder in the explorer.
- **FR-016**: The UI MUST display pagination options (`1 .. N`) for the total number of pages at the bottom of the explorer view when multi-page search results are available.
- **FR-017**: The pagination controls MUST visually distinguish the currently selected page from other page options.
- **FR-018**: Clicking any page option (`1 .. N`) MUST load and display that specific page of search results.
- **FR-019**: The UI MUST display a visible spinning icon indicator while a search operation is in progress before a response is received.
- **FR-020**: The UI MUST display a visible spinning icon indicator while a delete operation is in progress before a response is received.
- **FR-021**: The UI MUST display a visible spinning icon indicator while an upload operation is in progress before a response is received.
- **FR-022**: The UI MUST hide the spinning icon indicator when no search, delete, or upload operation is in progress.
- **FR-023**: When search returns no matches, the UI MUST display a clear "No matching items found" message.
- **FR-024**: In search results, each matching item MUST preserve sufficient path or location metadata to allow files to be downloaded and folders to be navigated to.

---

### Key Entities

- **SearchRequest**:
  - `path`: Base relative directory path to initiate the recursive search from (default empty string for root).
  - `query`: The search term to match against file and folder names.
  - `page`: 1-based page number (default 1).
  - `pageSize`: Number of items per page (default 50).
- **SearchResponse**:
  - `basePath`: The starting directory path of the search.
  - `query`: The active search query.
  - `page`: The current page number.
  - `pageSize`: The page size used.
  - `totalCount`: Total number of matching items across all descendant folders.
  - `totalPages`: Total number of pages available (`ceil(totalCount / pageSize)`).
  - `items`: Ordered list of `SearchResultItem` records for the current page.
- **SearchResultItem**:
  - `name`: Filename or directory name.
  - `path`: Relative path from the storage root to the item (enabling navigation and download).
  - `type`: Indicator specifying `"folder"` or `"file"`.
  - `size`: Display string representing size (`"-"` for folders, byte count for files).
- **OperationLoadingState**:
  - Indicator of whether an asynchronous operation (`search`, `delete`, or `upload`) is currently in flight, controlling the visibility of the spinning icon.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of recursive searches return all matching files and folders residing in the starting directory and any of its subdirectories.
- **SC-002**: 100% of search results are grouped and sorted by type (all folders precede all files).
- **SC-003**: 100% of search requests attempting path traversal or escaping the storage root boundary are rejected with a 400 Bad Request error.
- **SC-004**: When viewing search results, the upload button is 0% visible (completely hidden) in the UI.
- **SC-005**: In browsing mode, the search input box is positioned to the left of the upload action 100% of the time.
- **SC-006**: During active search, delete, and upload operations, the spinning loading indicator becomes visible within 100 milliseconds and disappears within 100 milliseconds of operation completion.
- **SC-007**: Users can navigate directly to any page `1 .. N` of search results via single-click pagination controls with the active page visually indicated.
- **SC-008**: Selecting any folder from search results transitions the view to browse mode displaying that folder's contents in 100% of occurrences.

---

## Assumptions

- Search queries match partial item names using case-insensitive substring comparison (e.g. searching "test" matches "TestFolder", "latest_report.pdf", and "my_test.txt").
- Special characters in user query strings are sanitized and treated as literal substring targets, preventing regex injection or command execution.
- Sorting by type places folders first, followed by files, with alphabetical tie-breaking by name within each group.
- Pagination options `1 .. N` at the bottom of the explorer show page numbers, and clicking a page number fetches that specific page from the server or client result cache.
- The spinning indicator icon can be rendered inline in the header or status bar near the active controls and does not block background UI readability.
- The search box in browse mode allows pressing Enter or clicking a search icon/button to initiate the search.
- When exiting search results by clearing search or navigating into a folder, the view returns to standard browsing mode with the upload button restored.
- In search results, files may also provide download links using their relative paths, matching browse mode behavior.
