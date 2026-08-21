/*
 * Settings API client for the frontend.
 * Provides functions to fetch and update user settings via the backend.
 */

import { getToken } from "../utils/token";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Fetch settings for the authenticated user.
export const fetchSettings = async () => {
  const response = await fetch(`${API_URL}/settings`, {
    headers: getHeaders(),
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return await response.json();
};

// Update settings for the authenticated user.
export const updateSettings = async (payload: any) => {
  const response = await fetch(`${API_URL}/settings`, {
    method: 'PATCH',
    headers: getHeaders("application/json"),
    body: JSON.stringify(payload),
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error('Failed to update settings');
  }
  return await response.json();
};

// Fetch active memories for the authenticated user.
export const fetchMemories = async (category?: string) => {
  let url = `${API_URL}/memories`;
  if (category) {
    url += `?category=${encodeURIComponent(category)}`;
  }
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch memories');
  }
  return await response.json();
};

// Convenience wrappers used elsewhere in the codebase.
export const fetchUserSettings = async () => {
  return await fetchSettings();
};

export const patchUserSettings = async (payload: any) => {
  return await updateSettings(payload);
};
