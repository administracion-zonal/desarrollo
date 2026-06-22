package com.administracionzonal.service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.administracionzonal.entity.OrdenMovilizacion;
import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.OrdenMovilizacionRepository;
import com.administracionzonal.repository.ReservaVehiculoRepository;
import com.administracionzonal.repository.UsuarioRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdenMovilizacionService {

        private final ReservaVehiculoRepository repository;
        private final OrdenMovilizacionRepository ordenRepository;
        private final UsuarioRepository usuarioRepository;

        public OrdenMovilizacion asegurarOrdenMovilizacion(Long idReserva, String cedulaAutorizado) {
                Long reservaId = Objects.requireNonNull(idReserva, "Id reserva obligatorio");
                ReservaVehiculo reserva = repository.findById(reservaId)
                                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

                return obtenerOCrearOrden(reserva, cedulaAutorizado);
        }

        public byte[] generarOrdenMovilizacion(Long idReserva, String cedulaAutorizado) {

                try {

                        Long reservaId = Objects.requireNonNull(idReserva, "Id reserva obligatorio");
                        ReservaVehiculo r = repository.findById(reservaId)
                                        .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

                        OrdenMovilizacion orden = asegurarOrdenMovilizacion(reservaId, cedulaAutorizado);
                        String qrPayload = construirPayloadQr(orden, r);
                        byte[] qrImage = generarQr(qrPayload);

                        Vehiculo vehiculo = r.getVehiculo();
                        Usuario usuario = r.getUsuario();
                        Usuario chofer = r.getChofer();

                        ByteArrayOutputStream baos = new ByteArrayOutputStream();

                        PdfWriter writer = new PdfWriter(baos);
                        PdfDocument pdf = new PdfDocument(writer);

                        // PDF HORIZONTAL
                        Document doc = new Document(pdf, PageSize.A4.rotate());

                        /*
                         * =========================================
                         * TABLA PRINCIPAL → DOS COPIAS
                         * =========================================
                         */

                        Table contenedor = new Table(2);
                        contenedor.setWidth(UnitValue.createPercentValue(100));

                        contenedor.addCell(crearBloqueOrdenMovilizacion(
                                        r,
                                        orden,
                                        vehiculo,
                                        usuario,
                                        chofer,
                                        qrImage));

                        contenedor.addCell(crearBloqueOrdenMovilizacion(
                                        r,
                                        orden,
                                        vehiculo,
                                        usuario,
                                        chofer,
                                        qrImage));

                        doc.add(contenedor);

                        doc.close();

                        return baos.toByteArray();

                } catch (Exception e) {
                        e.printStackTrace();
                        throw new RuntimeException("Error generando PDF: " + e.getMessage());
                }
        }

        public byte[] generarOrdenMovilizacionChofer(Long idReserva, String cedulaChofer) {
                Long reservaId = Objects.requireNonNull(idReserva, "Id reserva obligatorio");
                String cedula = Objects.requireNonNull(cedulaChofer, "Cedula de chofer obligatoria");

                ReservaVehiculo reserva = repository.findById(reservaId)
                                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

                if (reserva.getChofer() == null || reserva.getChofer().getCedula() == null
                                || !cedula.equals(reserva.getChofer().getCedula())) {
                        throw new RuntimeException("La reserva no está asignada al chofer autenticado");
                }

                return generarOrdenMovilizacion(reservaId, cedulaChofer);
        }

        /*
         * =========================================
         * BLOQUE INDIVIDUAL DE OrdenMovilizacion
         * =========================================
         */

        private Cell crearBloqueOrdenMovilizacion(
                        ReservaVehiculo r,
                        OrdenMovilizacion orden,
                        Vehiculo vehiculo,
                        Usuario usuario,
                        Usuario chofer,
                        byte[] qrImage) throws Exception {

                Table bloque = new Table(1);
                bloque.setWidth(UnitValue.createPercentValue(100));

                /*
                 * =========================================
                 * LOGOS
                 * =========================================
                 */

                String basePath = System.getProperty("user.dir")
                                + "/src/main/resources/static/logos/";

                Image logoCentro = new Image(
                                ImageDataFactory.create(
                                                basePath + "logo_OrdenMovilizacion.jpg"));

                logoCentro.setWidth(180); // más grande

                bloque.addCell(
                                new Cell()
                                                .add(logoCentro)
                                                .setTextAlignment(TextAlignment.CENTER)
                                                .setBorder(new SolidBorder(1))
                                                .setPadding(10));

                /*
                 * =========================================
                 * TITULOS
                 * =========================================
                 */

                bloque.addCell(celdaCentro(
                                "GOBIERNO AUTÓNOMO DESCENTRALIZADO DEL DISTRITO\nMETROPOLITANO DE QUITO",
                                true));

                bloque.addCell(celdaCentro(
                                "ADMINISTRACIÓN ZONAL VALLE DE LOS CHILLOS",
                                true));

                /*
                 * =========================================
                 * TABLA DE DATOS
                 * =========================================
                 */

                Table tabla = new Table(new float[] { 2, 4 });
                tabla.setWidth(UnitValue.createPercentValue(100));

                agregarFila(tabla, "Orden:", orden.getCodigo());
                agregarFila(tabla, "Fecha emisión:", String.valueOf(orden.getFechaEmision()));
                agregarFila(tabla, "Marca:", vehiculo.getMarca());
                agregarFila(tabla, "Placa:", vehiculo.getPlaca());

                agregarFila(tabla, "Funcionario:",
                                usuario.getNombres());

                agregarFila(tabla, "Cédula de identidad:",
                                usuario.getCedula());

                agregarFila(tabla, "Nombre del conductor:",
                                chofer != null ? chofer.getNombres() : "NO ASIGNADO");

                agregarFila(tabla, "Cédula de identidad:",
                                chofer != null ? chofer.getCedula() : "---");

                agregarFila(tabla, "Comisión a realizar:",
                                r.getObservaciones() != null
                                                ? r.getObservaciones()
                                                : "SIN DETALLE");

                agregarFila(tabla, "Lugar de origen:",
                                "CONOCOTO");

                agregarFila(tabla, "Lugar de destino:",
                                r.getDestino());

                agregarFila(tabla, "Tiempo Comisión:",
                                r.getHoraInicio() + " - " + r.getHoraFin());

                agregarFila(tabla, "Elaborado por:",
                                orden.getAutorizado() != null ? orden.getAutorizado().getNombres()
                                                : "RESPONSABLE PARQUE AUTOMOTOR");

                Image qr = new Image(ImageDataFactory.create(qrImage));
                qr.setWidth(85);

                Cell qrCell = new Cell(1, 2)
                                .add(new Paragraph("Código QR de verificación").setFontSize(8).setBold())
                                .add(qr)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setPadding(4);

                tabla.addCell(qrCell);

                bloque.addCell(new Cell()
                                .add(tabla)
                                .setPadding(0)
                                .setBorder(new SolidBorder(1)));

                /*
                 * =========================================
                 * FIRMAS
                 * =========================================
                 */

                Table firmas = new Table(2);
                firmas.setWidth(UnitValue.createPercentValue(100));

                firmas.addCell(
                                new Cell()
                                                .add(new Paragraph("Solicitante")
                                                                .setBold()
                                                                .setTextAlignment(TextAlignment.CENTER))
                                                .add(new Paragraph("\n\n"))
                                                .add(new Paragraph(usuario.getNombres())
                                                                .setTextAlignment(TextAlignment.CENTER))
                                                .add(new Paragraph(
                                                                "DIRECTOR ZONAL DE PARTICIPACIÓN\nCIUDADANA LOS CHILLOS")
                                                                .setTextAlignment(TextAlignment.CENTER)
                                                                .setFontSize(8))
                                                .setHeight(130));

                firmas.addCell(
                                new Cell()
                                                .add(new Paragraph("Autorizado")
                                                                .setBold()
                                                                .setTextAlignment(TextAlignment.CENTER))
                                                .add(new Paragraph("\n\n"))
                                                .add(new Paragraph(
                                                                "RESPONSABLE PARQUE AUTOMOTOR")
                                                                .setTextAlignment(TextAlignment.CENTER))
                                                .add(new Paragraph(
                                                                "ADMINISTRACIÓN ZONAL LOS CHILLOS")
                                                                .setTextAlignment(TextAlignment.CENTER)
                                                                .setFontSize(8))
                                                .setHeight(130));

                bloque.addCell(new Cell()
                                .add(firmas)
                                .setPadding(0)
                                .setBorder(new SolidBorder(1)));

                return new Cell()
                                .add(bloque)
                                .setPadding(5)
                                .setBorder(Border.NO_BORDER);
        }

        private OrdenMovilizacion obtenerOCrearOrden(ReservaVehiculo reserva, String cedulaAutorizado) {
                return ordenRepository.findByReserva_IdReserva(reserva.getIdReserva())
                                .orElseGet(() -> {
                                        OrdenMovilizacion orden = new OrdenMovilizacion();
                                        orden.setReserva(reserva);
                                        orden.setFechaEmision(LocalDate.now());
                                        orden.setEstado("EMITIDA");
                                        orden.setCodigo(generarCodigoCorrelativo(LocalDate.now().getYear()));

                                        if (cedulaAutorizado != null && !cedulaAutorizado.isBlank()) {
                                                usuarioRepository.findByCedula(cedulaAutorizado)
                                                                .ifPresent(orden::setAutorizado);
                                        }

                                        return ordenRepository.save(orden);
                                });
        }

        private String generarCodigoCorrelativo(int anio) {
                String prefijo = "GAD_DMQ_AZVCH_RV_" + anio + "_";
                Integer ultimo = ordenRepository.obtenerUltimoCorrelativoPorPrefijo(prefijo);
                int siguiente = (ultimo == null ? 0 : ultimo) + 1;
                return prefijo + String.format("%04d", siguiente);
        }

        private String construirPayloadQr(OrdenMovilizacion orden, ReservaVehiculo reserva) {
                String base = "codigo=" + orden.getCodigo()
                                + "|idOrden=" + orden.getIdOrdenMovilizacion()
                                + "|idReserva=" + reserva.getIdReserva()
                                + "|fecha=" + orden.getFechaEmision();

                return base + "|hash=" + hashSha256(base).substring(0, 16);
        }

        private byte[] generarQr(String contenido) {
                try {
                        BitMatrix matrix = new MultiFormatWriter().encode(
                                        contenido,
                                        BarcodeFormat.QR_CODE,
                                        180,
                                        180);

                        ByteArrayOutputStream qrBaos = new ByteArrayOutputStream();
                        MatrixToImageWriter.writeToStream(matrix, "PNG", qrBaos);
                        return qrBaos.toByteArray();
                } catch (Exception e) {
                        throw new RuntimeException("No se pudo generar QR de la orden: " + e.getMessage(), e);
                }
        }

        private String hashSha256(String raw) {
                try {
                        MessageDigest md = MessageDigest.getInstance("SHA-256");
                        byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
                        return HexFormat.of().formatHex(digest);
                } catch (Exception e) {
                        throw new RuntimeException("No se pudo generar hash de orden", e);
                }
        }

        /*
         * =========================================
         * HELPERS
         * =========================================
         */

        private void agregarFila(Table tabla, String titulo, String valor) {

                tabla.addCell(
                                new Cell()
                                                .add(new Paragraph(titulo).setBold().setFontSize(8))
                                                .setPadding(3));

                tabla.addCell(
                                new Cell()
                                                .add(new Paragraph(valor).setFontSize(8))
                                                .setPadding(3));
        }

        private Cell celdaCentro(String texto, boolean bold) {

                Paragraph p = new Paragraph(texto)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setFontSize(8);

                if (bold) {
                        p.setBold();
                }

                return new Cell()
                                .add(p)
                                .setBorder(new SolidBorder(1));
        }
}