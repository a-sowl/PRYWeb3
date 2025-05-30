// Propiedades de los botones usando iconos Font Awesome
const botones = {
    btnEditar: {
        id: 'btnEditar',
        className: 'btn-icon',
        iconHtml: '<i class="fas fa-edit"></i>',
        title: 'Editar',
        alt: 'Editar',
    },
    btnEliminar: {
        id: 'btnEliminar',
        className: 'btn-icon',
        iconHtml: '<i class="fas fa-trash"></i>',
        title: 'Eliminar',
        alt: 'Eliminar',
    },
    btnGuardar: {
        id: 'btnGuardar',
        className: 'btn-icon',
        iconHtml: '<i class="fas fa-save"></i>',
        title: 'Guardar',
        alt: 'Guardar',
    },
    btnCancelar: {
        id: 'btnCancelar',
        className: 'btn-icon',
        iconHtml: '<i class="fas fa-times-circle"></i>',
        title: 'Cancelar',
        alt: 'Cancelar',
    },
};

// Función para crear los botones de acción con iconos
function crearBotonesAcciones(celdaAcciones, btnConfig, onClick) {
    const btn = document.createElement('button');
    btn.id = btnConfig.id;
    btn.className = btnConfig.className;
    btn.title = btnConfig.title;
    btn.type = 'button';
    btn.innerHTML = btnConfig.iconHtml;
    btn.onclick = onClick;
    celdaAcciones.appendChild(btn);
}

// Función para cambiar el icono y propiedades de un botón desde un evento
function botonConEvento(event, nuevoConfig) {
    const t = event.target.closest('button');
    if (t && nuevoConfig) {
        t.id = nuevoConfig.id;
        t.title = nuevoConfig.title;
        t.innerHTML = nuevoConfig.iconHtml;
        t.className = nuevoConfig.className;
    }
}

// Función para cambiar el icono y propiedades de un botón directamente
function botonSinEvento(boton, nuevoConfig) {
    if (boton && nuevoConfig) {
        boton.id = nuevoConfig.id;
        boton.title = nuevoConfig.title;
        boton.innerHTML = nuevoConfig.iconHtml;
        boton.className = nuevoConfig.className;
    }
}

export default { botones, crearBotonesAcciones, botonConEvento, botonSinEvento };