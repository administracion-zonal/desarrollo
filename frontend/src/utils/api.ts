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

  const fullUrl = `${BASE_URL.replace(/\/$/, "")}${url}`;
  console.log("🌐 URL:", fullUrl);

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // 🔥 MANEJO DE ERRORES MEJORADO
  if (!response.ok) {
    const text = await response.text();

    console.error("❌ ERROR BACKEND:", text);

    throw new Error(text || `Error HTTP ${response.status}`);
  }

  return response;
}
