import { API_BASE_URL } from '../constants.js';

export interface ApiClient {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  delete: <T>(path: string, body?: unknown) => Promise<T>;
  stream: (path: string, body: unknown) => Promise<Response>;
}

export function createApiClient(getToken: () => string | Promise<string>): ApiClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });

    if (response.status === 401) {
      throw new Error('API key is invalid or was revoked. Run `charcoal login` to re-authenticate.');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${method} ${path} failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  async function stream(path: string, body: unknown): Promise<Response> {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      throw new Error('API key is invalid or was revoked. Run `charcoal login` to re-authenticate.');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API POST ${path} failed (${response.status}): ${text}`);
    }

    return response;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
    stream: (path: string, body: unknown) => stream(path, body),
  };
}
