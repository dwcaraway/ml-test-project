export async function fetchApiMessage(baseUrl = ''): Promise<string> {
  const response = await fetch(`${baseUrl}/test`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}

