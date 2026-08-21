const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function registerUser(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Registration failed with status ${response.status}`);
  }
  
  return response.json();
}

export async function loginUser(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const url = new URL(`${API_URL}/auth/login`);
  url.searchParams.append("username", username);
  url.searchParams.append("password", password);

  const response = await fetch(url.toString(), {
    method: "POST",
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Login failed with status ${response.status}`);
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
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Failed to fetch user with status ${response.status}`);
  }
  
  return response.json();
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
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Failed to update user with status ${response.status}`);
  }
  
  return response.json();
}
