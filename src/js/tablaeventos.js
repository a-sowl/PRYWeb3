import Buttons from "./buttons.js";
import Producto from "./pizzaConst.js";
import DataManager from "./datamanager.js";

const dataManager = new DataManager("productos");
let modoEdicionActivo = false;
let datosCeldas = [];

document.addEventListener('DOMContentLoaded', function () {
    // Inicialización
    document.getElementById('notification').style.display = 'none';
    document.getElementById('divListaProductos').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';

    // Rango cantidad
    const rngCantidad = document.getElementById('rngCantidad');
    const cantidadValue = document.getElementById('cantidadValue');
    rngCantidad.addEventListener('input', () => {
        cantidadValue.textContent = rngCantidad.value;
    });

    // Fecha actual por defecto
    document.getElementById('dtpFechaRegistro').value = new Date().toISOString().split('T')[0];

    // Envío del formulario
    document.getElementById('frmAltaProducto').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!this.checkValidity()) {
            this.classList.add('was-validated');
            return;
        }

        const id = parseInt(document.getElementById('txtIDArticulo').value);
        const nombre = document.getElementById('txtNombre').value.trim();
        const cantidad = parseInt(document.getElementById('rngCantidad').value);
        const descripcion = document.getElementById('txtDescripcion').value.trim();
        const precio = parseFloat(document.getElementById('txtPrecio').value);
        const categoria = document.getElementById('cboCategoria').value;
        const fechaRegistro = document.getElementById('dtpFechaRegistro').value;
        const disponibilidad = document.querySelector('input[name="disponibilidad"]:checked').value;
        const tamanos = Array.from(document.querySelectorAll('input[name="tamanos"]:checked')).map(chk => chk.value);


        // Imagen
        const imgInput = document.getElementById('imgProducto');
        let imagen = '';
        if (imgInput.files.length > 0) {
            const file = imgInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                imagen = e.target.result;
                finalizarAgregarProducto(id, nombre, cantidad, descripcion, precio, categoria, fechaRegistro, disponibilidad, tamanos, imagen);
            }
            reader.readAsDataURL(file);
        } else {
            finalizarAgregarProducto(id, nombre, cantidad, descripcion, precio, categoria, fechaRegistro, disponibilidad, tamanos, imagen);
        }
    });

    // Botón cancelar edición (del formulario, por si lo usas)
    document.getElementById('btnCancelarEdicion').addEventListener('click', resetearFormulario);

    // Botón mostrar productos
    document.getElementById('btnMostrarBD').addEventListener('click', function () {
        document.getElementById('divListaProductos').style.display = 'block';
        document.getElementById('searchSection').style.display = 'block';
        mostrarProductos(); // o la función que llena la tabla
    });
    // Botón vaciar base de datos
    document.getElementById('btnVaciarBD').addEventListener('click', () => {
        mostrarModalConfirmacion('¿Estás seguro de que deseas vaciar todo el almacén? Esta acción no se puede deshacer.', () => {
            dataManager.clearData();
            mostrarNotificacion('info', 'El almacén ha sido vaciado');
            document.getElementById('divListaProductos').style.display = 'none';
            document.getElementById('searchSection').style.display = 'none';
        });
    });

    // Botón buscar
    document.getElementById('btnBuscar').addEventListener('click', buscarProductos);
    document.getElementById('txtBuscar').addEventListener('keyup', buscarProductos);
    document.getElementById('cboFiltroCategoria').addEventListener('change', buscarProductos);

    // Edición en línea en la tabla
    document.getElementById('tbodyProductos').addEventListener('click', function (event) {
        const btn = event.target.closest('button');
        if (!btn) return;
        const fila = btn.closest('tr');
        if (!fila) return;
        const idBoton = btn.id;

        // === EDITAR ===
        if (idBoton === 'btnEditar') {
            if (modoEdicionActivo) {
                mostrarNotificacion('warning', 'Finaliza la edición actual antes de editar otra fila.');
                return;
            }
            modoEdicionActivo = true;
            datosCeldas = [];
            const celdas = fila.querySelectorAll('td');
            // Columnas: 0-ID, 1-Imagen, 2-Nombre, 3-Cant, 4-Precio, 5-Cat, 6-Disp, 7-Tam, 8-Fecha, 9-Acciones

            // Guardar datos originales
            for (let i = 0; i < celdas.length - 1; i++) {
                datosCeldas.push(celdas[i].innerHTML);
            }

            // Imagen no editable (col 1)
            // Nombre
            celdas[2].innerHTML = `<input type="text" class="form-control" value="${celdas[2].textContent.trim()}">`;
            // Cantidad
            celdas[3].innerHTML = `<input type="number" class="form-control" min="1" max="200" value="${celdas[3].textContent.trim()}">`;
            // Precio
            celdas[4].innerHTML = `<input type="number" class="form-control" min="0" step="0.01" value="${parseFloat(celdas[4].textContent.replace('$', '').trim())}">`;
            // Categoría
            celdas[5].innerHTML = crearSelectCategoria(celdas[5].textContent.trim());
            // Disponibilidad
            celdas[6].innerHTML = crearRadioDisponibilidad(celdas[6].textContent.includes('Disponible'));
            // Tamaños
            celdas[7].innerHTML = crearCheckboxTamanos(celdas[7].textContent);
            // Fecha
            celdas[8].innerHTML = `<input type="date" class="form-control" value="${celdas[8].textContent.trim()}">`;

            // Acciones: Guardar y Cancelar
            const tdAcciones = celdas[9];
            tdAcciones.innerHTML = '';
            Buttons.crearBotonesAcciones(tdAcciones, Buttons.botones.btnGuardar, () => guardarEdicion(fila));
            Buttons.crearBotonesAcciones(tdAcciones, Buttons.botones.btnCancelar, () => cancelarEdicion(fila));
        }

        // === GUARDAR ===
        if (idBoton === 'btnGuardar') {
            guardarEdicion(fila);
        }

        // === CANCELAR ===
        if (idBoton === 'btnCancelar') {
            cancelarEdicion(fila);
        }

        // === ELIMINAR ===
        if (idBoton === 'btnEliminar') {
            const id = parseInt(fila.cells[0].textContent);
            mostrarModalConfirmacion('¿Eliminar este producto?', () => {
                dataManager.deleteData(id);
                fila.remove();
                mostrarNotificacion('success', 'Producto eliminado correctamente');
                mostrarProductos();
            });
        }
    });
});

// === FUNCIONES AUXILIARES ===

function mostrarProductos() {
    const productos = dataManager.readData();
    const tbody = document.getElementById('tbodyProductos');
    tbody.innerHTML = '';
    if (productos.length === 0) {
        document.getElementById('divListaProductos').style.display = 'none';
        document.getElementById('searchSection').style.display = 'none';
        mostrarNotificacion('info', 'No hay productos registrados.');
        return;
    }
    document.getElementById('divListaProductos').style.display = 'block';
    document.getElementById('searchSection').style.display = 'block';
    productos.forEach(producto => {
        const fila = crearFilaProducto(producto);
        tbody.appendChild(fila);
    });
}

function crearFilaProducto(producto) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${producto.id}</td>
        <td>${producto.imagen ? `<img src="${producto.imagen}" class="product-img" alt="${producto.nombre}" style="max-width:60px;max-height:60px;">` : '<i class="fas fa-image text-muted"></i>'}</td>
        <td>${producto.nombre}</td>
        <td>${producto.descripcion || ''}</td>
        <td>${producto.cantidad}</td>
        <td>$${parseFloat(producto.precio).toFixed(2)}</td>
        <td>${getCategoriaNombre(producto.categoria)}</td>
        <td>${producto.disponibilidad === 'disponible'
            ? '<span class="badge bg-success">Disponible</span>'
            : '<span class="badge bg-danger">No disponible</span>'}</td>
        <td>${producto.tamanos && producto.tamanos.length > 0 ? producto.tamanos.map(t => getTamanoNombre(t)).join(', ') : 'N/A'}</td>
        <td>${producto.fechaRegistro}</td>
    `;

    // Acciones
    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'text-center';
    Buttons.crearBotonesAcciones(tdAcciones, Buttons.botones.btnEditar, () => editarFilaDesdeBoton(fila));
    Buttons.crearBotonesAcciones(tdAcciones, Buttons.botones.btnEliminar, () => eliminarFilaDesdeBoton(fila));
    fila.appendChild(tdAcciones);
    return fila;
}


// Para que los botones funcionen correctamente al crear la fila
function editarFilaDesdeBoton(fila) {
    const btn = fila.querySelector('#btnEditar');
    if (btn) btn.click();
}
function eliminarFilaDesdeBoton(fila) {
    const btn = fila.querySelector('#btnEliminar');
    if (btn) btn.click();
}

function guardarEdicion(fila) {
    const celdas = fila.querySelectorAll('td');
    const id = parseInt(celdas[0].textContent);
    const nombre = celdas[2].querySelector('input').value.trim();
    const cantidad = parseInt(celdas[3].querySelector('input').value);
    const precio = parseFloat(celdas[4].querySelector('input').value);
    const categoria = celdas[5].querySelector('select').value;
    const disponibilidad = celdas[6].querySelector('input[type="radio"]:checked').value;
    const tamanos = Array.from(celdas[7].querySelectorAll('input[type="checkbox"]:checked')).map(chk => chk.value);
    const fechaRegistro = celdas[8].querySelector('input').value;
    const descripcion = datosCeldas[3] || ""; // No editable en tabla, puedes ajustar si lo deseas
    const imagen = datosCeldas[1].includes('img') ? datosCeldas[1].match(/src="([^"]+)"/)?.[1] : '';

    if (!nombre || isNaN(cantidad) || isNaN(precio) || !categoria || !fechaRegistro) {
        mostrarNotificacion('error', 'Completa todos los campos correctamente.');
        return;
    }

    const productoActualizado = new Producto(
        id, nombre, cantidad, descripcion, precio, categoria, fechaRegistro, disponibilidad, tamanos, imagen
    );
    dataManager.updateData(id, productoActualizado);
    mostrarNotificacion('success', 'Producto actualizado correctamente');
    modoEdicionActivo = false;
    mostrarProductos();
}

function cancelarEdicion(fila) {
    const celdas = fila.querySelectorAll('td');
    for (let i = 0; i < celdas.length - 1; i++) {
        celdas[i].innerHTML = datosCeldas[i];
    }
    // Restaurar botones
    const tdAcciones = celdas[celdas.length - 1];
    tdAcciones.innerHTML = '';
    Buttons.crearBotonesAcciones(tdAcciones, Buttons.botones.btnEditar, () => editarFilaDesdeBoton(fila));
    Buttons.crearBotonesAcciones(tdAcciones, Buttons.botones.btnEliminar, () => eliminarFilaDesdeBoton(fila));
    modoEdicionActivo = false;
    mostrarNotificacion('info', 'Edición cancelada');
}

function finalizarAgregarProducto(id, nombre, cantidad, descripcion, precio, categoria, fechaRegistro, disponibilidad, tamanos, imagen) {
    const productos = dataManager.readData();
    const idExistente = productos.some(p => p.id === id);

    if (idExistente) {
        mostrarNotificacion('error', 'El ID del producto ya existe. Por favor, utiliza otro ID.');
        return;
    }

    const producto = new Producto(
        id, nombre, cantidad, descripcion, precio, categoria, fechaRegistro, disponibilidad, tamanos, imagen
    );
    dataManager.createData(producto);
    mostrarNotificacion('success', 'Producto añadido correctamente');
    resetearFormulario();
}

// Modal de confirmación reutilizable
function mostrarModalConfirmacion(mensaje, callbackAceptar) {
    const modalElement = document.getElementById('confirmModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    document.getElementById('confirmModalMessage').textContent = mensaje;
    const btnAceptar = document.getElementById('btnModalConfirmar');

    // Limpia eventos previos
    btnAceptar.onclick = null;
    btnAceptar.onclick = () => {
        callbackAceptar();
        modal.hide();
    };

    // Limpia backdrop si quedara atascado (solución robusta)
    modalElement.addEventListener('hidden.bs.modal', () => {
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(bd => bd.parentNode.removeChild(bd));
    }, { once: true });

    modal.show();
}

function resetearFormulario() {
    document.getElementById('frmAltaProducto').reset();
    document.getElementById('frmAltaProducto').classList.remove('was-validated');
    document.getElementById('cantidadValue').textContent = '50';
    document.getElementById('rngCantidad').value = '50';
    document.getElementById('dtpFechaRegistro').value = new Date().toISOString().split('T')[0];
    document.getElementById('disponible').checked = true;
}

function buscarProductos() {
    const termino = document.getElementById('txtBuscar').value.toLowerCase();
    const categoria = document.getElementById('cboFiltroCategoria').value;
    const tbody = document.getElementById('tbodyProductos');
    const productos = dataManager.readData();

    const productosFiltrados = productos.filter(producto => {
        const coincideNombre = producto.nombre.toLowerCase().includes(termino);
        const coincideId = producto.id.toString().includes(termino);
        const coincideCategoria = categoria ? producto.categoria === categoria : true;
        return (coincideNombre || coincideId) && coincideCategoria;
    });

    tbody.innerHTML = '';
    if (productosFiltrados.length === 0) {
        document.getElementById('noResults').style.display = 'block';
    } else {
        document.getElementById('noResults').style.display = 'none';
        productosFiltrados.forEach(producto => {
            const fila = crearFilaProducto(producto);
            tbody.appendChild(fila);
        });
    }
}

function mostrarNotificacion(tipo, mensaje) {
    const notification = document.getElementById('notification');
    notification.className = 'notification alert alert-dismissible fade show';

    if (tipo === 'success') {
        notification.classList.add('alert-success');
        notification.innerHTML = `<strong><i class="fas fa-check-circle me-2"></i>Éxito!</strong> <span id="notification-message">${mensaje}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    } else if (tipo === 'error') {
        notification.classList.add('alert-danger');
        notification.innerHTML = `<strong><i class="fas fa-exclamation-circle me-2"></i>Error!</strong> <span id="notification-message">${mensaje}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    } else if (tipo === 'info' || tipo === 'warning') {
        notification.classList.add('alert-info');
        notification.innerHTML = `<strong><i class="fas fa-info-circle me-2"></i>Información</strong> <span id="notification-message">${mensaje}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    }

    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Utilidades para mostrar nombres legibles
function getCategoriaNombre(valor) {
    switch (valor) {
        case 'clasicas': return 'Pizzas Clásicas';
        case 'especiales': return 'Pizzas Especiales';
        case 'bebidas': return 'Bebidas';
        case 'postres': return 'Postres';
        default: return valor;
    }
}
function getTamanoNombre(valor) {
    switch (valor) {
        case 'personal': return 'Personal';
        case 'mediana': return 'Mediana';
        case 'familiar': return 'Familiar';
        default: return valor;
    }
}

// Helpers para edición en línea
function crearSelectCategoria(valorActual) {
    const opciones = [
        { value: 'clasicas', text: 'Pizzas Clásicas' },
        { value: 'especiales', text: 'Pizzas Especiales' },
        { value: 'bebidas', text: 'Bebidas' },
        { value: 'postres', text: 'Postres' }
    ];
    let html = `<select class="form-select">`;
    opciones.forEach(opt => {
        html += `<option value="${opt.value}"${getCategoriaNombre(opt.value) === valorActual ? ' selected' : ''}>${opt.text}</option>`;
    });
    html += `</select>`;
    return html;
}
function crearRadioDisponibilidad(esDisponible) {
    return `
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="disponibilidadEdit" value="disponible" ${esDisponible ? 'checked' : ''}>
            <label class="form-check-label">Disponible</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="disponibilidadEdit" value="noDisponible" ${!esDisponible ? 'checked' : ''}>
            <label class="form-check-label">No disponible</label>
        </div>
    `;
}
function crearCheckboxTamanos(tamanosActuales) {
    const checks = [
        { value: 'personal', label: 'Personal' },
        { value: 'mediana', label: 'Mediana' },
        { value: 'familiar', label: 'Familiar' }
    ];
    const actuales = tamanosActuales.split(',').map(t => t.trim());
    let html = '';
    checks.forEach(chk => {
        html += `
            <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" value="${chk.value}" ${actuales.includes(getTamanoNombre(chk.value)) ? 'checked' : ''}>
                <label class="form-check-label">${chk.label}</label>
            </div>
        `;
    });
    return html;
}