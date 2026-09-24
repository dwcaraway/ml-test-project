# Web API Contract: File & Directory Browsing and Download

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/browse` | Returns a paginated JSON listing of files and folders for a given path. |
| `GET`  | `/api/download` | Downloads a specific file as a binary stream. |

---

## 1. Browse Directory

### Request
`GET /api/browse?path={path}&page={page}&pageSize={pageSize}`

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | No | `""` | Relative path from home root. Empty or omitted indicates root. |
| `page` | `integer` | No | `1` | 1-based page number. |
| `pageSize` | `integer` | No | `50` | Maximum items per page (range 1–100). |

### Responses

#### `200 OK`
Content-Type: `application/json`

```json
{
  "currentPath": "subfolder/docs",
  "page": 1,
  "pageSize": 50,
  "totalCount": 2,
  "totalPages": 1,
  "items": [
    {
      "name": "nested-folder",
      "size": "-",
      "type": "folder"
    },
    {
      "name": "example-document.pdf",
      "size": "2048576",
      "type": "file"
    }
  ]
}
```

#### `400 Bad Request`
Returned when:
- `path` contains path traversal tokens escaping the home root (`../` or `..\\`).
- `path` points to a file instead of a directory.

```json
{
  "error": "Invalid directory path or path traversal detected."
}
```

#### `404 Not Found`
Returned when the requested directory does not exist.

```json
{
  "error": "Directory not found."
}
```

---

## 2. Download File

### Request
`GET /api/download?path={path}`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Relative file path within the home directory. |

### Responses

#### `200 OK`
Content-Type: Dynamically resolved MIME type (e.g. `application/pdf`, `image/png`, or `application/octet-stream`).
Headers:
- `Content-Disposition: attachment; filename="example-document.pdf"`
- `Content-Length: {fileSizeBytes}`
- `Accept-Ranges: bytes`

Body: Binary file stream.

#### `400 Bad Request`
Returned when:
- `path` parameter is missing or empty.
- `path` attempts path traversal escaping root.
- `path` targets a directory instead of a file.

```json
{
  "error": "The specified path is a directory, not a file."
}
```

#### `404 Not Found`
Returned when the specified file does not exist.

```json
{
  "error": "File not found."
}
```
