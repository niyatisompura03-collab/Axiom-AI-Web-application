import { getToken, getAuthHeaders, throwIfUnauthorized } from "../utils/token";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function sendMessage(
  conversation_id: string | null,
  message: string,
  document_id?: string
) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const body: Record<string, string | null | undefined> = {
    conversation_id,
    message,
    timezone,
  };
  if (document_id) body.document_id = document_id;

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify(body),
  });

  throwIfUnauthorized(response);
  if (!response.ok) {
    throw new Error("Failed to communicate with Axiom backend");
  }

  return response.json();
}

export async function createNewConversation(title: string = "New Chat") {
  const response = await fetch(`${API_URL}/conversation/new`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({ title }),
  });

  throwIfUnauthorized(response);
  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  return response.json();
}

export async function getUserConversations() {
  const response = await fetch(`${API_URL}/conversations`, {
    headers: getAuthHeaders(),
  });

  throwIfUnauthorized(response);
  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export async function getConversation(conversation_id: string) {
  const url = `${API_URL}/conversation/${conversation_id}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  throwIfUnauthorized(response);
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
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({ title }),
  });

  throwIfUnauthorized(response);
  if (!response.ok) {
    throw new Error("Failed to rename conversation");
  }

  return response.json();
}

export async function deleteConversationApi(conversation_id: string) {
  const url = `${API_URL}/conversation/${conversation_id}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  throwIfUnauthorized(response);
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
  const response = await fetch(
    `${API_URL}/conversation/${conversation_id}/message`,
    {
      method: "PATCH",
      headers: getAuthHeaders("application/json"),
      body: JSON.stringify({
        message_index,
        new_content,
      }),
    }
  );

  throwIfUnauthorized(response);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to edit message");
  }

  return response.json();
}

export async function uploadDocumentApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/documents/upload`, {
    method: "POST",
    headers: getAuthHeaders(), // Do not set Content-Type, fetch sets it with boundary
    body: formData,
  });

  throwIfUnauthorized(response);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload document");
  }

  return response.json();
}

const documentPreviewCache = new Map<
  string,
  {
    document_id: string;
    filename: string;
    type: string;
    mime_type?: string;
    content?: string;
  }
>();

export async function getDocumentPreviewApi(documentId: string) {
  const token = getToken();
  const cacheKey = `${token || "anon"}:${documentId}`;
  const cached = documentPreviewCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(
    `${API_URL}/documents/${encodeURIComponent(documentId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  throwIfUnauthorized(response);
  if (!response.ok) {
    throw new Error("Failed to fetch document preview");
  }

  const data = await response.json();
  if (data?.content) {
    documentPreviewCache.set(cacheKey, data);
  }
  return data;
}
