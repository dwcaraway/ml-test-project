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

export async function fetchApiMessage(baseUrl = ''): Promise<string> {
  const response = await fetch(`${baseUrl}/test`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}

export async function fetchBrowseDirectory(
  path: string = '',
  baseUrl: string = ''
): Promise<BrowseResponse> {
  const queryParam = path ? `?path=${encodeURIComponent(path)}` : '';
  const response = await fetch(`${baseUrl}/api/browse${queryParam}`);
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      }
    } catch {
      // Fallback to HTTP error status
    }
    throw new Error(errorMessage);
  }
  return (await response.json()) as BrowseResponse;
}

export interface DeleteResponse {
  message: string;
}

export async function deleteItem(
  path: string,
  baseUrl: string = ''
): Promise<DeleteResponse> {
  const queryParam = `?path=${encodeURIComponent(path)}`;
  const response = await fetch(`${baseUrl}/api/delete${queryParam}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      }
    } catch {
      // Fallback to HTTP error status
    }
    throw new Error(errorMessage);
  }
  return (await response.json()) as DeleteResponse;
}

export interface UploadResponse {
  fileName: string;
  path: string;
  sizeBytes: number;
  message: string;
}

export async function uploadFile(
  path: string,
  file: File,
  baseUrl: string = ''
): Promise<UploadResponse> {
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('File exceeds the maximum allowed size of 8 MB.');
  }

  const queryParam = path ? `?path=${encodeURIComponent(path)}` : '';
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${baseUrl}/api/upload${queryParam}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      }
    } catch {
      // Fallback to HTTP error status
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as UploadResponse;
}

