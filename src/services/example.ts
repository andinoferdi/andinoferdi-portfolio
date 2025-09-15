/**
 * Example service for API calls
 */

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      message: response.statusText,
    };
  } catch (error) {
    throw new Error(`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Example service function
 */
export async function getExampleData(): Promise<Record<string, unknown>> {
  // Placeholder implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 1,
        title: 'Example Data',
        description: 'This is placeholder data',
      });
    }, 1000);
  });
}

export { fetchApi };
