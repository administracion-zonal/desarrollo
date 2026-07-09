package com.administracionzonal.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.ClassPathResource;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.ReservaVehiculoRepository;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.repository.VehiculoRepository;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdenMovilizacionService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ReservaVehiculoRepository repository;

    private final VehiculoRepository vehiculoRepo;
    private final UsuarioRepository usuarioRepo;

    public byte[] generarOrdenMovilizacionChofer(@NonNull Long idReserva, @NonNull String cedulaChofer) {
        ReservaVehiculo reserva = repository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (reserva.getChofer() == null || reserva.getChofer().getCedula() == null) {
            throw new RuntimeException("La reserva no tiene chofer asignado");
        }

        if (!cedulaChofer.equals(reserva.getChofer().getCedula())) {
            throw new RuntimeException("No autorizado para imprimir esta orden");
        }

        return generarOrdenMovilizacion(idReserva);
    }

    public byte[] generarOrdenMovilizacion(@NonNull Long idReserva) {

        try {

            ReservaVehiculo r = repository.findById(idReserva)
                    .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

            Long idVehiculo = r.getVehiculo().getIdVehiculo();
            Long idUsuario = r.getUsuario().getIdUsuario();
            Long idChofer = r.getChofer().getIdUsuario();

            if (idVehiculo == null) {
                throw new RuntimeException("La reserva no tiene vehículo asignado");
            }

            if (idUsuario == null) {
                throw new RuntimeException("La reserva no tiene usuario");
            }

            Vehiculo vehiculo = vehiculoRepo.findById(idVehiculo)
                    .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

            Usuario usuario = usuarioRepo.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Usuario chofer = null;

            if (idChofer != null) {
                chofer = usuarioRepo.findById(idChofer)
                        .orElseThrow(() -> new RuntimeException("Chofer no encontrado"));
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(20, 20, 20, 20);

            // ENCABEZADO
            doc.add(new Paragraph("GOBIERNO AUTÓNOMO DESCENTRALIZADO DEL DISTRITO METROPOLITANO DE QUITO")
                    .setBold().setTextAlignment(TextAlignment.CENTER).setFontSize(10));

            Image logo = cargarLogoCabecera();
            if (logo != null) {
                logo.setHorizontalAlignment(HorizontalAlignment.CENTER);
                logo.scaleToFit(260, 90);
                doc.add(logo);
            }

            doc.add(new Paragraph("ORDEN DE MOVILIZACION N° " + r.getIdReserva())
                    .setBold().setTextAlignment(TextAlignment.CENTER).setFontSize(12));

            doc.add(new Paragraph(" ").setMarginBottom(8));

            String observaciones = r.getObservaciones() != null ? r.getObservaciones() : "";
            String origen = extraerCampo(observaciones, "Origen:");
            String comision = extraerCampo(observaciones, "Motivo:");

            if (origen == null || origen.isBlank()) {
                origen = "CONOCOTO";
            }

            if (comision == null || comision.isBlank()) {
                comision = "SIN DETALLE";
            }

            Table table = new Table(UnitValue.createPercentArray(new float[] { 1, 2 }));
            table.setWidth(UnitValue.createPercentValue(100));
            table.setMarginBottom(10);

            table.addCell(celdaTitulo("Orden:"));
            table.addCell(celdaTexto("N" + r.getIdReserva()));

            table.addCell(celdaTitulo("Fecha:"));
            table.addCell(celdaTexto("DEL " + r.getFechaReserva().format(DATE_FORMAT) + " AL "
                    + r.getFechaReserva().format(DATE_FORMAT)));

            table.addCell(celdaTitulo("Marca:"));
            table.addCell(celdaTexto(vehiculo.getMarca()));

            table.addCell(celdaTitulo("Placa:"));
            table.addCell(celdaTexto(vehiculo.getPlaca()));

            table.addCell(celdaTitulo("Funcionario:"));
            table.addCell(celdaTexto(usuario.getNombres()));

            table.addCell(celdaTitulo("Cedula de identidad:"));
            table.addCell(celdaTexto(usuario.getCedula()));

            table.addCell(celdaTitulo("Nombre del conductor:"));
            table.addCell(celdaTexto(
                    chofer != null ? chofer.getNombres() : "NO ASIGNADO"));

            table.addCell(celdaTitulo("Cedula de identidad:"));
            table.addCell(celdaTexto(
                    chofer != null ? chofer.getCedula() : "---"));

            table.addCell(celdaTitulo("Comision a realizar:"));
            table.addCell(celdaTexto(comision));

            table.addCell(celdaTitulo("Lugar de origen:"));
            table.addCell(celdaTexto(origen));

            table.addCell(celdaTitulo("Lugar de destino:"));
            table.addCell(celdaTexto(r.getDestino() != null ? r.getDestino() : "NO DEFINIDO"));

            table.addCell(celdaTitulo("Tiempo Comision:"));
            table.addCell(celdaTexto(r.getHoraInicio() + " a " + r.getHoraFin()));

            table.addCell(celdaTitulo("Elaborado por:"));
            table.addCell(celdaTexto(obtenerElaboradoPor(chofer, usuario)));

            doc.add(table);
            doc.add(new Paragraph(" ").setMarginBottom(8));

            Table firmas = new Table(1);
            firmas.setWidth(UnitValue.createPercentValue(100));
            firmas.addCell(firmaAutorizado("Autorizado", chofer));

            doc.add(firmas);

            doc.close();

            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF: " + e.getMessage());
        }
    }

    private Image cargarLogoCabecera() {
        byte[] logoBytes = leerLogoDesdeClasspath();
        if (logoBytes == null) {
            logoBytes = leerLogoDesdeRutaProyecto();
        }

        if (logoBytes == null) {
            return null;
        }

        return new Image(ImageDataFactory.create(logoBytes));
    }

    private byte[] leerLogoDesdeClasspath() {
        try {
            ClassPathResource resource = new ClassPathResource("static/cabecera1.png");
            if (resource.exists()) {
                return resource.getInputStream().readAllBytes();
            }
        } catch (IOException e) {
            return null;
        }

        return null;
    }

    private byte[] leerLogoDesdeRutaProyecto() {
        Path[] candidatos = new Path[] {
                Path.of("../frontend/public/cabecera1.png"),
                Path.of("frontend/public/cabecera1.png"),
        };

        for (Path candidato : candidatos) {
            try {
                if (Files.exists(candidato)) {
                    return Files.readAllBytes(candidato);
                }
            } catch (IOException e) {
                // Ignorar candidato y continuar.
            }
        }

        return null;
    }

    private String extraerCampo(String texto, String etiqueta) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        String[] lineas = texto.split("\\n");
        for (String linea : lineas) {
            String recortada = linea.trim();
            if (recortada.startsWith(etiqueta)) {
                return recortada.substring(etiqueta.length()).trim();
            }
        }

        return null;
    }

    private Cell celdaTitulo(String text) {
        return new Cell().add(new Paragraph(text).setBold())
                .setBorder(new SolidBorder(1))
                .setPaddingTop(4)
                .setPaddingBottom(4);
    }

    private Cell celdaTexto(String text) {
        return new Cell().add(new Paragraph(text))
                .setBorder(new SolidBorder(1))
                .setPaddingTop(4)
                .setPaddingBottom(4);
    }

    private String obtenerElaboradoPor(Usuario chofer, Usuario usuario) {
        if (chofer != null && chofer.getNombres() != null && !chofer.getNombres().isBlank()) {
            return chofer.getNombres();
        }

        if (usuario != null && usuario.getNombres() != null && !usuario.getNombres().isBlank()) {
            return usuario.getNombres();
        }

        return "SISTEMA";
    }

    private Cell firmaAutorizado(String titulo, Usuario chofer) {
        String nombreAutorizado = "RESPONSABLE PARQUE AUTOMOTOR";

        if (chofer != null && chofer.getNombres() != null && !chofer.getNombres().isBlank()) {
            nombreAutorizado = chofer.getNombres();
        }

        return new Cell()
                .add(new Paragraph("\n\n________________________"))
                .add(new Paragraph(nombreAutorizado)
                        .setBold()
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginTop(6))
                .add(new Paragraph(titulo).setTextAlignment(TextAlignment.CENTER))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(new SolidBorder(1))
                .setPaddingTop(12)
                .setPaddingBottom(12);
    }
}
