/*
 * Settings API client for the frontend.
 * Provides functions to fetch and update user settings via the backend.
 */

import { getAuthHeaders, throwIfUnauthorized } from "../utils/token";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Fetch settings for the authenticated user.
export const fetchSettings = async () => {
  const response = await fetch(`${API_URL}/settings`, {
    headers: getAuthHeaders(),
  });
  throwIfUnauthorized(response);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch settings");
  }
  return await response.json();
};

// Update settings for the authenticated user.
export const updateSettings = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${API_URL}/settings`, {
    method: "PATCH",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify(payload),
  });
  throwIfUnauthorized(response);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to update settings");
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
    headers: getAuthHeaders(),
  });
  throwIfUnauthorized(response);
  if (!response.ok) {
    throw new Error("Failed to fetch memories");
  }
  return await response.json();
};

// Convenience wrappers used elsewhere in the codebase.
export const fetchUserSettings = async () => {
  return await fetchSettings();
};

export const patchUserSettings = async (payload: Record<string, unknown>) => {
  return await updateSettings(payload);
};
