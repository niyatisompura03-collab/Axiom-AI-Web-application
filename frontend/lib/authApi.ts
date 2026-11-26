const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function registerUser(username: string, password: string, email?: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, email }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Registration failed with status ${response.status}`);
  }
  
  return response.json();
}

export async function loginUser(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Login failed with status ${response.status}`);
  }
  
  return response.json();
}

async function parseAuthResponse(response: Response, fallbackMessage: string) {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    const error = new Error("Session expired") as Error & { status?: number };
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(
      errorData?.detail || `${fallbackMessage} with status ${response.status}`
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  return parseAuthResponse(response, "Failed to fetch user");
}

export async function updateUser(token: string, data: { username: string; avatar?: string | null; dob?: string | null }) {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  
  return parseAuthResponse(response, "Failed to update user");
}

export async function forgotPassword(email: string) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Forgot password failed with status ${response.status}`);
  }
  
  return response.json();
}

export async function resetPassword(token: string, new_password: string) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, new_password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Reset password failed with status ${response.status}`);
  }
  
  return response.json();
}
