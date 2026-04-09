import { useState } from "react";
import { vehiculosService } from "../services/vehiculosService";
import type { Vehiculo } from "../types/Vehiculo";

export function useVehiculosCatalogo() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

  const cargarVehiculos = async () => {
    const res = await vehiculosService.obtenerVehiculos();
    setVehiculos(res.data);
  };

  return {
    vehiculos,
    cargarVehiculos,
  };
}
