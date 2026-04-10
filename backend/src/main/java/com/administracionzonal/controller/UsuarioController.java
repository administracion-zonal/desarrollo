package com.administracionzonal.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.administracionzonal.dto.PerfilUsuarioDTO;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:5173")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/perfil/{id}")
    public ResponseEntity<PerfilUsuarioDTO> obtenerPerfil(
            @NonNull @PathVariable Long id) {

        return ResponseEntity.ok(
                usuarioService.obtenerPerfil(id));
    }

    /*
     * =====================================
     * BUSCAR USUARIO POR CEDULA
     * =====================================
     */
    @GetMapping("/cedula/{cedula}")
    public ResponseEntity<Usuario> buscarPorCedula(@PathVariable String cedula) {

        return usuarioRepo
                .findByCedula(cedula)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());

    }

    /*
     * =====================================
     * SUBIR FOTO DE PERFIL
     * ELIMINA FOTO ANTERIOR
     * =====================================
     */
    @PostMapping("/subir-foto/{id}")
    public ResponseEntity<?> subirFoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        System.out.println("Archivo recibido: " + file.getOriginalFilename());
        try {

            /* VALIDAR ARCHIVO */
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Archivo vacío");
            }

            if (id == null) {
                return ResponseEntity.badRequest()
                        .body("ID de usuario es requerido");
            }

            /* BUSCAR USUARIO */
            Usuario usuario = usuarioRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            /* CARPETA ABSOLUTA SEGURA */
            String carpeta = System.getProperty("user.dir")
                    + "/uploads/perfiles/";

            Path uploadPath = Paths.get(carpeta);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            /*
             * =====================================
             * ELIMINAR FOTO ANTERIOR
             * =====================================
             */
            if (usuario.getFotoPerfil() != null
                    && !usuario.getFotoPerfil().isEmpty()) {

                Path rutaAnterior = Paths.get(
                        System.getProperty("user.dir"),
                        usuario.getFotoPerfil());

                if (Files.exists(rutaAnterior)) {

                    Files.delete(rutaAnterior);

                }
            }

            /*
             * =====================================
             * OBTENER EXTENSION REAL
             * =====================================
             */
            String nombreOriginal = file.getOriginalFilename();

            String extension = ".jpg";

            if (nombreOriginal != null && nombreOriginal.contains(".")) {

                extension = nombreOriginal.substring(
                        nombreOriginal.lastIndexOf("."));

            }

            /*
             * =====================================
             * USAR NOMBRE FIJO (PROFESIONAL)
             * SIEMPRE REEMPLAZA
             * =====================================
             */
            String nombreArchivo = "perfil_" + id + extension;

            Path rutaArchivo = uploadPath.resolve(nombreArchivo);

            /*
             * =====================================
             * GUARDAR ARCHIVO
             * =====================================
             */
            Files.copy(
                    file.getInputStream(),
                    rutaArchivo,
                    StandardCopyOption.REPLACE_EXISTING);

            /*
             * =====================================
             * GUARDAR EN BASE DE DATOS
             * =====================================
             */
            String rutaBD = "uploads/perfiles/" + nombreArchivo;

            usuario.setFotoPerfil(rutaBD);

            usuarioRepo.save(usuario);

            /*
             * =====================================
             * RESPUESTA
             * =====================================
             */
            return ResponseEntity.ok(rutaBD);

        } catch (IOException e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body("Error al guardar archivo");

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body(e.getMessage());

        }

    }

    @PostMapping("/aceptar-acuerdo")
    public ResponseEntity<?> aceptarAcuerdo(Authentication auth) {

        // 🔐 obtener usuario desde JWT
        String cedula = auth.getName();

        Usuario usuario = usuarioRepo.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setAceptaAcuerdo(true);

        usuarioRepo.save(usuario);

        return ResponseEntity.ok().build();
    }
}