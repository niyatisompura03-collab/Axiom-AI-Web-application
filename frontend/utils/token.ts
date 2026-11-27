const TOKEN_KEY = "axiom_auth_token";

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getTokenExpirationMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expMs = getTokenExpirationMs(token);
  if (expMs === null) return true;
  return Date.now() >= expMs;
}

export function getAuthHeaders(contentType?: string): Record<string, string> {
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

export function throwIfUnauthorized(response: Response): void {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    const error = new Error("Unauthorized") as Error & { status?: number };
    error.status = 401;
    throw error;
  }
}
