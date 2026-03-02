export async function cancelarReserva(id: number) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8083/api/privado/${id}/cancelar`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
}