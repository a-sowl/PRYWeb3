import DataManager from "./datamanager.js";
const { jsPDF } = window.jspdf;

document.addEventListener("DOMContentLoaded", () => {
    const btnGenerar = document.getElementById("btnGenerarPDF");
    btnGenerar.addEventListener("click", () => {
        generarReportePDF();
    });
});

async function generarReportePDF() {
    // 1. Creamos la instancia de jsPDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

    // 2. Leemos todos los productos del DataManager
    const dataManager = new DataManager("productos");
    const productos = dataManager.readData(); // Array de objetos Producto

    // 3. Definimos las URLs de los logos
    const urlIzquierda = "/src/assets/image/pizzaLogo.png";
    const urlDerecha = "/src/assets/image/pizzaLogo.png";

    // 4. Cargar las dos imágenes en Base64
    let imgIzqBase64 = "";
    let imgDerBase64 = "";
    try {
        imgIzqBase64 = await cargarImagenBase64(urlIzquierda);
        imgDerBase64 = await cargarImagenBase64(urlDerecha);
    } catch (err) {
        console.warn("No se pudo cargar alguna imagen de logo:", err);
    }

    // 5. Dibujamos encabezado en la PRIMERA PÁGINA:
    if (imgIzqBase64) {
        doc.addImage(imgIzqBase64, "PNG", 10, 10, 25, 25);
    }
    if (imgDerBase64) {
        doc.addImage(imgDerBase64, "PNG", 175, 10, 25, 25);
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("Reporte de Productos", doc.internal.pageSize.getWidth() / 2, 22, {
        align: "center",
    });

    // 6. Preparamos la tabla con autoTable
    const encabezados = [
        "ID",
        "Nombre",
        "Descripción",
        "Cantidad",
        "Precio",
        "Categoría",
        "Disponibilidad"
    ];

    const cuerpoTabla = productos.map((p) => [
        p.id,
        p.nombre,
        p.descripcion || "",
        p.cantidad,
        `$${parseFloat(p.precio).toFixed(2)}`,
        obtenerNombreCategoria(p.categoria),
        obtenerNombreDisponibilidad(p.disponibilidad)
    ]);

    // 7. Insertamos la tabla a partir de Y = 40 mm
    doc.autoTable({
        head: [encabezados],
        body: cuerpoTabla,
        startY: 40,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
            fillColor: [33, 37, 41],
            textColor: 255,
            halign: "center",
            fontStyle: "bold",
        },

        didDrawPage: function (data) {
            // Numeración de páginas en cada hoja
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount}`,
                data.settings.margin.left,
                doc.internal.pageSize.getHeight() - 10
            );
        },
    });

    // 8. FORZAR salto a página 2:
    doc.addPage();

    // 9. Ahora dibujamos la misma cabecera (opcional) en página 2 si queremos:
    //    — Si prefieres omitir el encabezado en la segunda página, solo elimina las siguientes líneas:
    if (imgIzqBase64) {
        doc.addImage(imgIzqBase64, "PNG", 10, 10, 25, 25);
    }
    if (imgDerBase64) {
        doc.addImage(imgDerBase64, "PNG", 175, 10, 25, 25);
    }
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("Gráfica de Categorías", doc.internal.pageSize.getWidth() / 2, 22, {
        align: "center",
    });

    // 10. Dibujamos la gráfica de barras en la PÁGINA 2
    const conteoCategorias = {};
    productos.forEach((p) => {
        conteoCategorias[p.categoria] = (conteoCategorias[p.categoria] || 0) + 1;
    });

    // Ajustamos la posición vertical de inicio de la gráfica en la página 2:
    const posY = 40;        // Por ejemplo a 40 mm desde el borde superior
    let posX = 20;        // Margen izquierdo de 20 mm
    const anchoBarra = 20;
    const espacioEntre = 12;
    const alturaMax = 60;
    const valores = Object.values(conteoCategorias);
    const maxValor = valores.length ? Math.max(...valores) : 1;


    // Colores para las barras (puedes agregar más si tienes más categorías)
    const coloresBarras = [
        [231, 29, 54],    // Rojo
        [255, 159, 28],   // Amarillo
        [46, 196, 182],   // Verde agua
        [0, 123, 255],    // Azul
        [153, 102, 255],  // Morado
        [255, 206, 86],   // Amarillo claro
        [255, 99, 132],   // Rosa
        [75, 192, 192],   // Verde claro
    ];

    let colorIndex = 0;

    // Dibujamos cada barra
    Object.entries(conteoCategorias).forEach(([categoria, cantidad]) => {
        const altura = (cantidad / maxValor) * alturaMax;

        // Selecciona color para la barra
        const color = coloresBarras[colorIndex % coloresBarras.length];
        doc.setFillColor(...color);

        // Dibuja la barra
        doc.rect(posX, posY + (alturaMax - altura), anchoBarra, altura, "F");

        // Cantidad encima de la barra
        doc.setFontSize(8);
        doc.setTextColor(33, 37, 41);
        doc.text(
            `${cantidad}`,
            posX + anchoBarra / 2,
            posY + (alturaMax - altura) - 2,
            { align: "center" }
        );

        // Etiqueta de categoría debajo
        doc.setFontSize(8);
        doc.text(
            categoria,
            posX + anchoBarra / 2,
            posY + alturaMax + 5,
            { align: "center" }
        );

        posX += anchoBarra + espacioEntre;
        colorIndex++;
    });

    // 11. Agregamos numeración de página en la PÁGINA 2
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
        `Página 2 de ${pageCount}`,
    /* margen izquierdo */ 10,
        doc.internal.pageSize.getHeight() - 10
    );

    // 12. Finalmente guardamos el PDF
    doc.save("Reporte_Productos.pdf");
}

// --- FUNCIONES AUXILIARES ---

async function cargarImagenBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d").drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject("No se pudo cargar la imagen " + url);
        img.src = url;
    });
}

function obtenerNombreCategoria(clave) {
    switch (clave) {
        case "clasicas": return "Pizzas Clásicas";
        case "especiales": return "Pizzas Especiales";
        case "bebidas": return "Bebidas";
        case "postres": return "Postres";
        default: return clave;
    }
}

function obtenerNombreDisponibilidad(valor) {
    switch (valor) {
        case "disponible": return "Disponible";
        case "noDisponible": return "No disponible";
        default: return valor;
    }
}
