// Variables globales
let productos = [];
let editando = false;
let productoEditando = null;
let imagenEditando = null;

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión (simulado)
    if (!localStorage.getItem('isLoggedIn')) {
        // En la versión real redirigir a login:
        // window.location.href = 'login.html';
        // return;
        localStorage.setItem('isLoggedIn', 'true'); // Simulación
    }

    // Cargar productos desde localStorage
    cargarProductosDesdeStorage();

    // Configurar evento para el rango de cantidad
    const rngCantidad = document.getElementById('rngCantidad');
    const cantidadValue = document.getElementById('cantidadValue');
    rngCantidad.addEventListener('input', () => {
        cantidadValue.textContent = rngCantidad.value;
    });

    // Configurar fecha actual como valor por defecto
    const fechaInput = document.getElementById('dtpFechaRegistro');
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;

    // Eventos del formulario y botones
    const frm = document.getElementById('frmAltaProducto');
    frm.addEventListener('submit', agregarProducto);

    document.getElementById('btnCancelarEdicion').addEventListener('click', cancelarEdicion);
    document.getElementById('btnMostrarBD').addEventListener('click', mostrarBaseDatos);
    document.getElementById('btnGenerarPDF').addEventListener('click', generarPDF);
    document.getElementById('btnVaciarBD').addEventListener('click', vaciarBaseDatos);
    document.getElementById('btnBuscar').addEventListener('click', buscarProductos);
    document.getElementById('txtBuscar').addEventListener('keyup', buscarProductos);
    document.getElementById('cboFiltroCategoria').addEventListener('change', buscarProductos);

    // Inicializar datos de ejemplo si no hay nada
    inicializarDatosEjemplo();
});

// Función para cargar productos desde localStorage
function cargarProductosDesdeStorage() {
    const productosStorage = localStorage.getItem('productos');
    if (productosStorage) {
        productos = JSON.parse(productosStorage);
        actualizarBotonesAccion();
    }
}

// Función para guardar productos en localStorage
function guardarProductosEnStorage() {
    localStorage.setItem('productos', JSON.stringify(productos));
    actualizarBotonesAccion();
}

// Función para actualizar botones de acción
function actualizarBotonesAccion() {
    const btnMostrarBD = document.getElementById('btnMostrarBD');
    const btnGenerarPDF = document.getElementById('btnGenerarPDF');
    const btnVaciarBD = document.getElementById('btnVaciarBD');
    
    if (productos.length > 0) {
        btnMostrarBD.style.display = 'inline-block';
        btnGenerarPDF.style.display = 'inline-block';
        btnVaciarBD.style.display = 'inline-block';
    } else {
        btnMostrarBD.style.display = 'none';
        btnGenerarPDF.style.display = 'none';
        btnVaciarBD.style.display = 'none';
        document.getElementById('divListaProductos').style.display = 'none';
        document.getElementById('searchSection').style.display = 'none';
    }
}

// Función para agregar un producto (o guardar cambios)
function agregarProducto(e) {
    e.preventDefault();
    const frm = e.target;
    
    // Validar formulario
    if (!frm.checkValidity()) {
        frm.classList.add('was-validated');
        return;
    }
    
    // Obtener valores del formulario
    const id = parseInt(document.getElementById('txtIDArticulo').value);
    const nombre = document.getElementById('txtNombre').value;
    const cantidad = document.getElementById('rngCantidad').value;
    const descripcion = document.getElementById('txtDescripcion').value;
    const precio = parseFloat(document.getElementById('txtPrecio').value);
    const categoria = document.getElementById('cboCategoria').value;
    const fecha = document.getElementById('dtpFechaRegistro').value;
    const disponible = document.querySelector('input[name="disponibilidad"]:checked').value;
    
    // Obtener tamaños seleccionados
    const tamanos = [];
    document.querySelectorAll('input[name="tamanos"]:checked').forEach(chk => {
        tamanos.push(chk.value);
    });
    
    // Manejar imagen
    const imgInput = document.getElementById('imgProducto');
    let imagen = '';
    
    if (imgInput.files.length > 0) {
        const file = imgInput.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            imagen = event.target.result;
            finalizarAgregarProducto(id, nombre, cantidad, descripcion, precio, categoria, fecha, disponible, tamanos, imagen);
        }
        reader.readAsDataURL(file);
    } else {
        finalizarAgregarProducto(id, nombre, cantidad, descripcion, precio, categoria, fecha, disponible, tamanos, imagen);
    }
}

// Finalizar proceso de agregar o actualizar producto
function finalizarAgregarProducto(id, nombre, cantidad, descripcion, precio, categoria, fecha, disponible, tamanos, imagen) {
    // Verificar si el ID ya existe
    const idExistente = productos.some(p => p.id === id);
    
    if (idExistente && !editando) {
        mostrarNotificacion('error', 'El ID del producto ya existe. Por favor, utiliza otro ID.');
        return;
    }
    
    // Crear objeto producto
    const producto = {
        id,
        nombre,
        cantidad: parseInt(cantidad),
        descripcion,
        precio,
        categoria,
        fecha,
        disponible,
        tamanos,
        imagen
    };
    
    if (editando) {
        // Actualizar producto existente
        const index = productos.findIndex(p => p.id === productoEditando.id);
        if (index !== -1) {
            // Mantener imagen si no se cambió
            if (!imagen && imagenEditando) {
                producto.imagen = imagenEditando;
            }
            productos[index] = producto;
        }
        editando = false;
        productoEditando = null;
        imagenEditando = null;
        mostrarNotificacion('success', 'Producto actualizado correctamente');
    } else {
        // Agregar nuevo producto
        productos.push(producto);
        mostrarNotificacion('success', 'Producto añadido correctamente');
    }
    
    // Guardar en localStorage
    guardarProductosEnStorage();
    
    // Resetear formulario
    resetearFormulario();
}

// Función para mostrar notificación
function mostrarNotificacion(tipo, mensaje) {
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notification-message');
    
    notification.className = 'notification alert alert-dismissible fade show';
    
    if (tipo === 'success') {
        notification.classList.add('alert-success');
        notification.innerHTML = `<strong><i class="fas fa-check-circle me-2"></i>Éxito!</strong> 
        <span id="notification-message">${mensaje}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    } else if (tipo === 'error') {
        notification.classList.add('alert-danger');
        notification.innerHTML = `<strong><i class="fas fa-exclamation-circle me-2"></i>Error!</strong> 
        <span id="notification-message">${mensaje}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    } else if (tipo === 'info') {
        notification.classList.add('alert-info');
        notification.innerHTML = `<strong><i class="fas fa-info-circle me-2"></i>Información</strong> 
        <span id="notification-message">${mensaje}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    }
    
    notification.style.display = 'block';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Función para mostrar la base de datos
function mostrarBaseDatos() {
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('divListaProductos').style.display = 'block';
    buscarProductos();
}

// Función para buscar productos
function buscarProductos() {
    const termino = document.getElementById('txtBuscar').value.toLowerCase();
    const categoria = document.getElementById('cboFiltroCategoria').value;
    const tbody = document.getElementById('tbodyProductos');
    const noResults = document.getElementById('noResults');
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Filtrar productos
    const productosFiltrados = productos.filter(producto => {
        const coincideNombre = producto.nombre.toLowerCase().includes(termino);
        const coincideId = producto.id.toString().includes(termino);
        const coincideCategoria = categoria ? producto.categoria === categoria : true;
        
        return (coincideNombre || coincideId) && coincideCategoria;
    });
    
    // Mostrar resultados
    if (productosFiltrados.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        productosFiltrados.forEach(producto => {
            const fila = crearFilaProducto(producto);
            tbody.appendChild(fila);
        });
    }
}

// Función para crear fila de producto
function crearFilaProducto(producto) {
    const fila = document.createElement('tr');
    
    // ID
    const tdId = document.createElement('td');
    tdId.textContent = producto.id;
    fila.appendChild(tdId);
    
    // Imagen
    const tdImg = document.createElement('td');
    if (producto.imagen) {
        const img = document.createElement('img');
        img.src = producto.imagen;
        img.className = 'product-img';
        img.alt = producto.nombre;
        tdImg.appendChild(img);
    } else {
        tdImg.innerHTML = '<i class="fas fa-image text-muted"></i>';
    }
    fila.appendChild(tdImg);
    
    // Nombre
    const tdNombre = document.createElement('td');
    tdNombre.textContent = producto.nombre;
    fila.appendChild(tdNombre);
    
    // Cantidad
    const tdCantidad = document.createElement('td');
    tdCantidad.textContent = producto.cantidad;
    fila.appendChild(tdCantidad);
    
    // Precio
    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = `$${producto.precio.toFixed(2)}`;
    fila.appendChild(tdPrecio);
    
    // Categoría
    const tdCategoria = document.createElement('td');
    tdCategoria.textContent = producto.categoria === 'clasicas' ? 'Clásicas' : 
                             producto.categoria === 'especiales' ? 'Especiales' : 
                             producto.categoria === 'bebidas' ? 'Bebidas' : 'Postres';
    fila.appendChild(tdCategoria);
    
    // Disponible
    const tdDisponible = document.createElement('td');
    tdDisponible.innerHTML = producto.disponible === 'disponible' ? 
        '<span class="badge bg-success">Disponible</span>' : 
        '<span class="badge bg-danger">No disponible</span>';
    fila.appendChild(tdDisponible);
    
    // Tamaños
    const tdTamanos = document.createElement('td');
    if (producto.tamanos && producto.tamanos.length > 0) {
        const tamanos = producto.tamanos.map(t => 
            t === 'personal' ? 'Personal' : 
            t === 'mediana' ? 'Mediana' : 'Familiar'
        );
        tdTamanos.textContent = tamanos.join(', ');
    } else {
        tdTamanos.textContent = 'N/A';
    }
    fila.appendChild(tdTamanos);
    
    // Fecha
    const tdFecha = document.createElement('td');
    tdFecha.textContent = producto.fecha;
    fila.appendChild(tdFecha);
    
    // Acciones
    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'text-center';
    
    // Botón Editar
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn btn-sm btn-warning btn-action';
    btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
    btnEditar.title = 'Editar producto';
    btnEditar.onclick = () => editarProducto(producto);
    tdAcciones.appendChild(btnEditar);
    
    // Botón Eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn btn-sm btn-danger btn-action';
    btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
    btnEliminar.title = 'Eliminar producto';
    btnEliminar.onclick = () => eliminarProducto(producto.id);
    tdAcciones.appendChild(btnEliminar);
    
    fila.appendChild(tdAcciones);
    
    return fila;
}

// Función para editar un producto
function editarProducto(producto) {
    editando = true;
    productoEditando = producto;
    imagenEditando = producto.imagen;
    
    // Llenar formulario con datos del producto
    document.getElementById('txtIDArticulo').value = producto.id;
    document.getElementById('txtNombre').value = producto.nombre;
    document.getElementById('rngCantidad').value = producto.cantidad;
    document.getElementById('cantidadValue').textContent = producto.cantidad;
    document.getElementById('txtDescripcion').value = producto.descripcion;
    document.getElementById('txtPrecio').value = producto.precio;
    document.getElementById('cboCategoria').value = producto.categoria;
    document.getElementById('dtpFechaRegistro').value = producto.fecha;
    
    // Disponibilidad
    document.getElementById(producto.disponible === 'disponible' ? 'disponible' : 'noDisponible').checked = true;
    
    // Tamaños
    document.querySelectorAll('input[name="tamanos"]').forEach(chk => {
        chk.checked = producto.tamanos && producto.tamanos.includes(chk.value);
    });
    
    // Cambiar texto y mostrar botón Cancelar
    document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
    document.getElementById('btnCancelarEdicion').style.display = 'inline-block';
    
    // Desplazar a formulario
    document.getElementById('frmAltaProducto').scrollIntoView({ behavior: 'smooth' });
}

// Función para cancelar la edición
function cancelarEdicion() {
    editando = false;
    productoEditando = null;
    imagenEditando = null;
    resetearFormulario();
}

// Función para resetear formulario a valores iniciales
function resetearFormulario() {
    const frm = document.getElementById('frmAltaProducto');
    frm.reset();
    frm.classList.remove('was-validated');

    // Resetear valores predeterminados
    document.getElementById('cantidadValue').textContent = '50';
    document.getElementById('rngCantidad').value = '50';
    document.getElementById('dtpFechaRegistro').value = new Date().toISOString().split('T')[0];

    // Volver texto del botón a "Añadir Producto" y ocultar botón Cancelar
    document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-plus-circle me-2"></i>Añadir Producto';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
}

// Función para eliminar un producto
function eliminarProducto(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        productos = productos.filter(p => p.id !== id);
        guardarProductosEnStorage();
        mostrarNotificacion('success', 'Producto eliminado correctamente');
        buscarProductos();
    }
}

// Función para vaciar la base de datos
function vaciarBaseDatos() {
    if (confirm('¿Estás seguro de que deseas vaciar todo el almacén? Esta acción no se puede deshacer.')) {
        productos = [];
        localStorage.removeItem('productos');
        actualizarBotonesAccion();
        mostrarNotificacion('info', 'El almacén ha sido vaciado');
        document.getElementById('tbodyProductos').innerHTML = '';
        document.getElementById('noResults').style.display = 'none';
    }
}

// Función para generar PDF (simulada)
function generarPDF() {
    if (productos.length === 0) {
        mostrarNotificacion('info', 'No hay productos para generar PDF');
        return;
    }
    
    // Simulación de generación de PDF
    mostrarNotificacion('success', 'PDF generado con éxito. Descarga iniciada...');
    
    // Simular descarga
    setTimeout(() => {
        alert('Descarga de PDF completada. En una implementación real, se generaría el archivo PDF con todos los productos.');
    }, 1500);
}

// Inicializar con datos de ejemplo (para demostración)
function inicializarDatosEjemplo() {
    if (productos.length === 0) {
        productos = [
            {
                id: 1,
                nombre: "Pizza Margarita",
                cantidad: 15,
                descripcion: "Clásica pizza con salsa de tomate, mozzarella y albahaca",
                precio: 9.99,
                categoria: "clasicas",
                fecha: "2023-10-15",
                disponible: "disponible",
                tamanos: ["personal", "mediana", "familiar"],
                imagen: ""
            },
            {
                id: 2,
                nombre: "Pizza Pepperoni",
                cantidad: 22,
                descripcion: "Pizza con salsa de tomate, mozzarella y pepperoni",
                precio: 11.99,
                categoria: "clasicas",
                fecha: "2023-10-16",
                disponible: "disponible",
                tamanos: ["mediana", "familiar"],
                imagen: ""
            },
            {
                id: 3,
                nombre: "Refresco de Cola",
                cantidad: 50,
                descripcion: "Refresco de cola 500ml",
                precio: 2.50,
                categoria: "bebidas",
                fecha: "2023-10-14",
                disponible: "disponible",
                tamanos: [],
                imagen: ""
            }
        ];
        guardarProductosEnStorage();
    }
}
