const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { headers, ...rest });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (data: { email: string; password: string; full_name: string; slug: string }) =>
    apiFetch<{ access_token: string; refresh_token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: (token: string) => apiFetch<any>("/users/me", { token }),

  updateMe: (token: string, data: any) =>
    apiFetch<any>("/users/me", { method: "PATCH", token, body: JSON.stringify(data) }),

  listSections: (token: string, type?: string) =>
    apiFetch<any[]>(`/sections/${type ? `?type=${type}` : ""}`, { token }),

  createSection: (token: string, data: any) =>
    apiFetch<any>("/sections/", { method: "POST", token, body: JSON.stringify(data) }),

  updateSection: (token: string, id: string, data: any) =>
    apiFetch<any>(`/sections/${id}`, { method: "PATCH", token, body: JSON.stringify(data) }),

  deleteSection: (token: string, id: string) =>
    apiFetch<void>(`/sections/${id}`, { method: "DELETE", token }),

  reorderSections: (token: string, items: { id: string; sort_order: number }[]) =>
    apiFetch<any[]>("/sections/reorder", { method: "PUT", token, body: JSON.stringify({ items }) }),

  listApiKeys: (token: string) => apiFetch<any[]>("/api-keys/", { token }),

  createApiKey: (token: string, name: string) =>
    apiFetch<any>("/api-keys/", { method: "POST", token, body: JSON.stringify({ name }) }),

  revokeApiKey: (token: string, id: string) =>
    apiFetch<void>(`/api-keys/${id}`, { method: "DELETE", token }),

  requestMediaUpload: (token: string, sectionId: string, filename: string, contentType: string) =>
    apiFetch<{ id: string; upload_url: string; object_key: string }>(`/media/${sectionId}/upload`, {
      method: "POST",
      token,
      body: JSON.stringify({ filename, content_type: contentType }),
    }),

  uploadToPresignedUrl: async (uploadUrl: string, file: File) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  },

  deleteMedia: (token: string, mediaId: string) =>
    apiFetch<void>(`/media/${mediaId}`, { method: "DELETE", token }),
};
