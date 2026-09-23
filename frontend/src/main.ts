import { fetchApiMessage } from './api';

export function initializeApp(): void {
  const fetchButton = document.getElementById('fetch-btn');
  const statusElement = document.getElementById('api-status');

  if (fetchButton && statusElement) {
    fetchButton.addEventListener('click', async () => {
      statusElement.textContent = 'Fetching...';
      try {
        const message = await fetchApiMessage();
        statusElement.textContent = `API Response: ${message}`;
      } catch (error) {
        statusElement.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    });
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
}

