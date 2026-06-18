package com.administracionzonal.service;

import java.io.ByteArrayOutputStream;

import org.springframework.stereotype.Service;

import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.ReservaVehiculoRepository;
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

        public byte[] generarOrdenMovilizacion(Long idReserva) {

                try {

                        ReservaVehiculo r = repository.findById(idReserva)
                                        .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

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
                                        vehiculo,
                                        usuario,
                                        chofer));

                        contenedor.addCell(crearBloqueOrdenMovilizacion(
                                        r,
                                        vehiculo,
                                        usuario,
                                        chofer));

                        doc.add(contenedor);

                        doc.close();

                        return baos.toByteArray();

                } catch (Exception e) {
                        e.printStackTrace();
                        throw new RuntimeException("Error generando PDF: " + e.getMessage());
                }
        }

        /*
         * =========================================
         * BLOQUE INDIVIDUAL DE OrdenMovilizacion
         * =========================================
         */

        private Cell crearBloqueOrdenMovilizacion(
                        ReservaVehiculo r,
                        Vehiculo vehiculo,
                        Usuario usuario,
                        Usuario chofer) throws Exception {

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

                agregarFila(tabla, "Salvo:", "N° " + r.getIdReserva());
                agregarFila(tabla, "Fecha:", r.getFechaReserva().toString());
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

                agregarFila(tabla, "Elaborado por:", r.getHoraInicio() +
                                "RESPONSABLE PARQUE AUTOMOTOR");

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