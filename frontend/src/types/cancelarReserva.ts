import { apiFetch } from "../utils/api";
export async function cancelarReserva(id: number) {
  const token = localStorage.getItem("token");

  const res = await apiFetch(
    `${import.meta.env.VITE_API_URL}/api/privado/${id}/cancelar`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
}
