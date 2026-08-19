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

export async function sendMessage(
  conversation_id: string | null,
  message: string
) {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: getHeaders("application/json"),
    body: JSON.stringify({
      conversation_id,
      message,
    }),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error("Failed to communicate with Axiom backend");
  }

  return response.json();
}

export async function createNewConversation(
  title: string = "New Chat"
) {
  const response = await fetch(`${API_URL}/conversation/new`, {
    method: "POST",
    headers: getHeaders("application/json"),
    body: JSON.stringify({
      title,
    }),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  return response.json();
}

export async function getUserConversations() {
  const response = await fetch(`${API_URL}/conversations`, {
    headers: getHeaders(),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export async function getConversation(conversation_id: string) {
  const url = `${API_URL}/conversation/${conversation_id}`;
  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error("Failed to fetch conversation");
  }

  return response.json();
}

export async function renameConversationApi(
  conversation_id: string,
  title: string
) {
  const response = await fetch(`${API_URL}/conversation/${conversation_id}`, {
    method: "PATCH",
    headers: getHeaders("application/json"),
    body: JSON.stringify({
      title,
    }),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error("Failed to rename conversation");
  }

  return response.json();
}

export async function deleteConversationApi(conversation_id: string) {
  const url = `${API_URL}/conversation/${conversation_id}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error("Failed to delete conversation");
  }

  return response.json();
}

export async function getChatHistory() {
  return getUserConversations();
}

export async function editMessageApi(
  conversation_id: string,
  message_index: number,
  new_content: string
) {
  const response = await fetch(`${API_URL}/conversation/${conversation_id}/message`, {
    method: "PATCH",
    headers: getHeaders("application/json"),
    body: JSON.stringify({
      message_index,
      new_content,
    }),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to edit message");
  }

  return response.json();
}