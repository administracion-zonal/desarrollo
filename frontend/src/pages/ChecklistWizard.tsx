import { useEffect, useState } from "react";
import ChecklistTabla from "../components/ChecklistTabla";
import {
  finalizarProceso,
  getDocumentos,
  uploadDocumento,
} from "../services/talentoHumanoService";

/* =========================
   TIPOS
========================= */
type Documento = {
  id: number; // 🔥 NECESARIO
  idDocumentoTipo: number;
  nombre: string;
  estado: string;
  tipo: string;
  rutaArchivo?: string; // 🔥 NUEVO
};

/* =========================
   COMPONENTE
========================= */
export default function ChecklistWizard() {
  // 🔐 Usuario logueado
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const idUsuario: number = user?.idUsuario;

  // 🧠 Estados
  const [step, setStep] = useState<number>(0);
  const [docsIngreso, setDocsIngreso] = useState<Documento[]>([]);
  const [docsSalida, setDocsSalida] = useState<Documento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /* =========================
     CARGAR DOCUMENTOS (CORRECTO)
  ========================= */
  useEffect(() => {
    if (!idUsuario) return;

    const fetchData = async () => {
      try {
        const res: Documento[] = await getDocumentos(idUsuario);

        setDocsIngreso(res.filter((d) => d.tipo === "INGRESO"));
        setDocsSalida(res.filter((d) => d.tipo === "SALIDA"));
      } catch (error) {
        console.error("Error cargando documentos", error);
      }
    };

    fetchData();
  }, [idUsuario]);

  /* =========================
     SUBIR DOCUMENTO
  ========================= */
  const subir = async (
    e: React.ChangeEvent<HTMLInputElement>,
    idDocumentoTipo: number,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    formData.append("idUsuario", String(idUsuario));
    formData.append("idDocumentoTipo", String(idDocumentoTipo));

    try {
      setLoading(true);

      await uploadDocumento(formData);

      // 🔥 recargar documentos
      const res: Documento[] = await getDocumentos(idUsuario);
      setDocsIngreso(res.filter((d) => d.tipo === "INGRESO"));
      setDocsSalida(res.filter((d) => d.tipo === "SALIDA"));

      setLoading(false);
    } catch (error) {
      console.error("Error subiendo documento", error);
      setLoading(false);
    }
  };

  /* =========================
     VALIDACIONES
  ========================= */
  if (!idUsuario) {
    return <div style={{ padding: 20 }}>❌ Usuario no identificado</div>;
  }

  const validarPaso = () => {
    const lista = step === 0 ? docsIngreso : docsSalida;
    return lista.length > 0 && lista.every((d) => d.estado === "APROBADO");
  };

  /* =========================
     PROGRESO
  ========================= */
  const progreso = () => {
    const lista = step === 0 ? docsIngreso : docsSalida;
    if (lista.length === 0) return 0;

    const completos = lista.filter((d) => d.estado === "APROBADO").length;
    return Math.round((completos / lista.length) * 100);
  };

  /* =========================
     NAVEGACIÓN
  ========================= */
  const siguiente = () => {
    if (!validarPaso()) {
      alert("⚠️ Debes completar todos los documentos");
      return;
    }
    setStep(1);
  };

  const finalizar = async () => {
    try {
      const res = await finalizarProceso({
        idUsuario,
        idChecklist: 1,
        tipo: "INGRESO",
      });

      if (res.ok) {
        alert("✅ Proceso completado correctamente");
        window.location.href = "/perfil";
      } else {
        alert("❌ Error al finalizar el proceso");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión");
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 Proceso Talento Humano</h2>

      {/* TEXTO INSTITUCIONAL */}
      <p style={{ marginBottom: 20 }}>
        Complete los siguientes documentos obligatorios para continuar con su
        proceso institucional.
      </p>

      {/* PROGRESO */}
      <div style={{ marginBottom: 20 }}>
        <strong>Progreso: {progreso()}%</strong>

        <div
          style={{
            height: 10,
            background: "#ccc",
            borderRadius: 5,
            marginTop: 5,
          }}
        >
          <div
            style={{
              width: `${progreso()}%`,
              height: "100%",
              background: "green",
              borderRadius: 5,
            }}
          />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button disabled={step === 0}>Ingreso</button>
        <button disabled={step === 1}>Salida</button>
      </div>

      {/* CONTENIDO */}
      {step === 0 && <ChecklistTabla items={docsIngreso} onUpload={subir} />}

      {step === 1 && <ChecklistTabla items={docsSalida} onUpload={subir} />}

      {/* BOTONES */}
      <div style={{ marginTop: 20 }}>
        {step === 0 && (
          <button onClick={siguiente} disabled={loading}>
            {loading ? "Procesando..." : "Siguiente"}
          </button>
        )}

        {step === 1 && (
          <button onClick={finalizar} disabled={loading}>
            {loading ? "Procesando..." : "Finalizar"}
          </button>
        )}
      </div>
    </div>
  );
}
