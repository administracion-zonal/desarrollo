package com.administracionzonal.controller;

import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.io.IOException;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:5173")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepo;


    /* =====================================
       BUSCAR USUARIO POR CEDULA
    ===================================== */
    @GetMapping("/cedula/{cedula}")
    public ResponseEntity<Usuario> buscarPorCedula(@PathVariable String cedula) {

        return usuarioRepo
                .findByCedula(cedula)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());

    }


    /* =====================================
       SUBIR FOTO DE PERFIL
       ELIMINA FOTO ANTERIOR
    ===================================== */
    @PostMapping("/subir-foto/{id}")
    public ResponseEntity<?> subirFoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {

        try {

            /* VALIDAR ARCHIVO */
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Archivo vacío");
            }

            /* BUSCAR USUARIO */
            Usuario usuario = usuarioRepo.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException("Usuario no encontrado")
                    );

            /* CARPETA ABSOLUTA SEGURA */
            String carpeta = System.getProperty("user.dir")
                    + "/uploads/perfiles/";

            Path uploadPath = Paths.get(carpeta);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }


            /* =====================================
               ELIMINAR FOTO ANTERIOR
            ===================================== */
            if (usuario.getFotoPerfil() != null
                    && !usuario.getFotoPerfil().isEmpty()) {

                Path rutaAnterior = Paths.get(
                        System.getProperty("user.dir"),
                        usuario.getFotoPerfil()
                );

                if (Files.exists(rutaAnterior)) {

                    Files.delete(rutaAnterior);

                }
            }


            /* =====================================
               OBTENER EXTENSION REAL
            ===================================== */
            String nombreOriginal = file.getOriginalFilename();

            String extension = ".jpg";

            if (nombreOriginal != null && nombreOriginal.contains(".")) {

                extension = nombreOriginal.substring(
                        nombreOriginal.lastIndexOf(".")
                );

            }


            /* =====================================
               USAR NOMBRE FIJO (PROFESIONAL)
               SIEMPRE REEMPLAZA
            ===================================== */
            String nombreArchivo = "perfil_" + id + extension;


            Path rutaArchivo = uploadPath.resolve(nombreArchivo);


            /* =====================================
               GUARDAR ARCHIVO
            ===================================== */
            Files.copy(
                    file.getInputStream(),
                    rutaArchivo,
                    StandardCopyOption.REPLACE_EXISTING
            );


            /* =====================================
               GUARDAR EN BASE DE DATOS
            ===================================== */
            String rutaBD = "uploads/perfiles/" + nombreArchivo;

            usuario.setFotoPerfil(rutaBD);

            usuarioRepo.save(usuario);


            /* =====================================
               RESPUESTA
            ===================================== */
            return ResponseEntity.ok(rutaBD);

        }
        catch (IOException e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body("Error al guardar archivo");

        }
        catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body(e.getMessage());

        }

    }

}