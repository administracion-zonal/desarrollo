package com.administracionzonal.service;

import java.io.ByteArrayOutputStream;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.ReservaVehiculoRepository;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.repository.VehiculoRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
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
public class SalvoconductoService {

        private final ReservaVehiculoRepository repository;

        private final VehiculoRepository vehiculoRepo;
        private final UsuarioRepository usuarioRepo;

        public byte[] generarSalvoconducto(@NonNull Long idReserva) {

                try {

                        ReservaVehiculo r = repository.findById(idReserva)
                                        .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

                        Long idVehiculo = r.getIdVehiculo();
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

                        // 🔥 ENCABEZADO
                        doc.add(new Paragraph("GOBIERNO AUTÓNOMO DESCENTRALIZADO DEL DISTRITO METROPOLITANO DE QUITO")
                                        .setBold().setTextAlignment(TextAlignment.CENTER).setFontSize(10));

                        doc.add(new Paragraph("ADMINISTRACIÓN ZONAL VALLE DE LOS CHILLOS")
                                        .setBold().setTextAlignment(TextAlignment.CENTER).setFontSize(10));

                        doc.add(new Paragraph("SALVOCONDUCTO N° " + r.getIdReserva())
                                        .setBold().setTextAlignment(TextAlignment.CENTER).setFontSize(12));

                        doc.add(new Paragraph("\n"));

                        Table table = new Table(UnitValue.createPercentArray(new float[] { 1, 2 }));
                        table.setWidth(UnitValue.createPercentValue(100));

                        table.addCell(celdaTitulo("Fecha:"));
                        table.addCell(celdaTexto("DEL " + r.getFechaReserva() + " AL " + r.getFechaReserva()));

                        table.addCell(celdaTitulo("Marca:"));
                        table.addCell(celdaTexto(vehiculo.getMarca()));

                        table.addCell(celdaTitulo("Placa:"));
                        table.addCell(celdaTexto(vehiculo.getPlaca()));

                        table.addCell(celdaTitulo("Color:"));
                        table.addCell(celdaTexto("N/A"));

                        table.addCell(celdaTitulo("Funcionario:"));
                        table.addCell(celdaTexto(usuario.getNombres()));

                        table.addCell(celdaTitulo("Cédula:"));
                        table.addCell(celdaTexto(usuario.getCedula()));

                        table.addCell(celdaTitulo("Conductor:"));
                        table.addCell(celdaTexto(
                                        chofer != null ? chofer.getNombres() : "NO ASIGNADO"));

                        table.addCell(celdaTitulo("Cédula:"));
                        table.addCell(celdaTexto(
                                        chofer != null ? chofer.getCedula() : "---"));

                        doc.add(table);

                        doc.add(new Paragraph("\nComisión a realizar:").setBold());
                        doc.add(new Paragraph(
                                        r.getObservaciones() != null ? r.getObservaciones() : "SIN DETALLE"));

                        doc.add(new Paragraph("\nLugar de origen: CONOCOTO"));
                        doc.add(new Paragraph("Lugar de destino: " + r.getDestino()));

                        doc.add(new Paragraph("Tiempo Comisión: " +
                                        r.getHoraInicio() + " a " + r.getHoraFin()));

                        // 🔥 QR
                        BitMatrix matrix = new MultiFormatWriter().encode(
                                        "SALVO-" + r.getIdReserva(),
                                        BarcodeFormat.QR_CODE,
                                        120,
                                        120);

                        ByteArrayOutputStream qrBaos = new ByteArrayOutputStream();
                        MatrixToImageWriter.writeToStream(matrix, "PNG", qrBaos);

                        Image qr = new Image(
                                        com.itextpdf.io.image.ImageDataFactory.create(qrBaos.toByteArray()));

                        qr.setHorizontalAlignment(HorizontalAlignment.RIGHT);

                        doc.add(new Paragraph("\n"));
                        doc.add(qr);

                        doc.add(new Paragraph("\n\n"));

                        Table firmas = new Table(2);
                        firmas.setWidth(UnitValue.createPercentValue(100));

                        firmas.addCell(firma("Solicitante Autorizado"));
                        firmas.addCell(firma("Responsable Parque Automotor"));

                        doc.add(firmas);

                        doc.close();

                        return baos.toByteArray();

                } catch (Exception e) {
                        throw new RuntimeException("Error generando PDF: " + e.getMessage());
                }
        }

        // 🔹 CELDAS
        private Cell celdaTitulo(String text) {
                return new Cell().add(new Paragraph(text).setBold())
                                .setBorder(Border.NO_BORDER);
        }

        private Cell celdaTexto(String text) {
                return new Cell().add(new Paragraph(text))
                                .setBorder(Border.NO_BORDER);
        }

        private Cell firma(String titulo) {
                return new Cell()
                                .add(new Paragraph("\n\n________________________"))
                                .add(new Paragraph(titulo).setTextAlignment(TextAlignment.CENTER))
                                .setBorder(Border.NO_BORDER);
        }
}