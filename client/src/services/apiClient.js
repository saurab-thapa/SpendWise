// API Client
export async function apiClient(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response");
  }

  if (response.status === 401 && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
  if (!response.ok) {
    const error = new Error(body.error?.message || "Request failed");
    error.fields = body.error?.fields || {};
    error.status = response.status;
    throw error;
  }
  return body.data;
}
