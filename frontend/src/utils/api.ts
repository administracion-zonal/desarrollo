const BASE_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // SOLO agregar JSON si no es FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    // 🔥 AQUI EL FIX
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error("No autorizado");
  }

  return response;
}
