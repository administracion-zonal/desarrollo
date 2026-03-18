export interface PerfilUsuario {
  idUsuario: number;
  nombres: string;
  correo?: string;
  fotoPerfil?: string;
  tipoUsuario?: string;
  roles: string[];
  institucion?: string;

  cargo?: string;
  departamento?: string;
  correoInstitucional?: string;
  telefonoExtension?: string;
  direccion?: string;
  unidad?: string;
}
