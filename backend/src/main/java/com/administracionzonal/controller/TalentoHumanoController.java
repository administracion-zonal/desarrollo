package com.administracionzonal.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.administracionzonal.dto.CrearUsuarioDTO;
import com.administracionzonal.dto.UsuarioDocumentoDTO;
import com.administracionzonal.entity.UsuarioDocumento;
import com.administracionzonal.enums.EstadoDocumento;
import com.administracionzonal.enums.TipoProceso;
import com.administracionzonal.service.TalentoHumanoService;

@RestController
@RequestMapping("/talento-humano")
public class TalentoHumanoController {

    private final TalentoHumanoService service;

    public TalentoHumanoController(TalentoHumanoService service) {
        this.service = service;
    }

    @PostMapping("/documento/upload")
    public UsuarioDocumento upload(@RequestParam Long idUsuario,
            @RequestParam Long idDocumentoTipo,
            @RequestParam MultipartFile file) throws Exception {
        return service.subirDocumento(idUsuario, idDocumentoTipo, file);
    }

    @PutMapping("/documento/{id}/estado")
    public UsuarioDocumento estado(@PathVariable Long id,
            @RequestParam EstadoDocumento estado) {
        return service.cambiarEstadoDocumento(id, estado);
    }

    @PostMapping("/proceso/finalizar")
    public void finalizar(@RequestParam Long idUsuario,
            @RequestParam Long idChecklist,
            @RequestParam TipoProceso tipo) {
        service.finalizarProceso(idUsuario, idChecklist, tipo);
    }

    @PostMapping("/crear-o-activar")
    public ResponseEntity<?> crearOActivar(@RequestBody CrearUsuarioDTO dto) {

        service.crearOActivarUsuario(dto);
        return ResponseEntity.ok(Map.of(
                "mensaje", "Usuario creado correctamente",
                "status", "OK"));
    }

    @GetMapping("/proceso-pendiente/{idUsuario}")
    public boolean tieneProcesoPendiente(@PathVariable Long idUsuario) {
        return service.tieneProcesoPendiente(idUsuario);
    }

    @GetMapping("/documentos/{idUsuario}")
    public List<UsuarioDocumentoDTO> getDocumentos(@PathVariable Long idUsuario) {
        return service.getDocumentos(idUsuario);
    }

}
