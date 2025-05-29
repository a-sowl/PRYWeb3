const listaIngredientes = document.getElementById("lista-ingredientes");
let ingredientesSeleccionados = JSON.parse(sessionStorage.getItem("ingredientes")) || [];
let masaSeleccionada = null; // Para controlar la masa seleccionada

function renderizarLista() {
  listaIngredientes.innerHTML = '';

  ingredientesSeleccionados.forEach((ingrediente, index) => {
    const div = document.createElement("div");
    div.className = "ingrediente-seleccionado";
    div.innerHTML = `
      <div>
        <div class="nombre">${ingrediente.nombre.charAt(0).toUpperCase() + ingrediente.nombre.slice(1)}</div>
        ${ingrediente.tipo ? `<div class="tipo">${ingrediente.tipo.toUpperCase()}</div>` : ''}
      </div>
      <button onclick="eliminarIngrediente(${index})">
        X
      </button>
    `;
    listaIngredientes.appendChild(div);
  });

  sessionStorage.setItem("ingredientes", JSON.stringify(ingredientesSeleccionados));
}

function agregarIngrediente(nombre, tipo) {
  // Si es una masa, manejamos la selección única
  if (esMasa(nombre)) {
    if (masaSeleccionada && masaSeleccionada !== nombre) {
      mostrarPopup("Solo puedes seleccionar un tipo de masa", "error");
      return;
    }
    
    // Si es la misma masa ya seleccionada, no hacer nada
    if (masaSeleccionada === nombre) return;
    
    masaSeleccionada = nombre;
  }

  const existe = ingredientesSeleccionados.some(
    item => item.nombre === nombre && item.tipo === tipo
  );
  
  if (!existe) {
    ingredientesSeleccionados.push({ nombre, tipo });
    renderizarLista();
  }
}

function eliminarIngrediente(index) {
  const ingrediente = ingredientesSeleccionados[index];
  
  // Si es una masa, resetear la selección
  if (esMasa(ingrediente.nombre)) {
    masaSeleccionada = null;
  }
  
  ingredientesSeleccionados.splice(index, 1);
  renderizarLista();
}

// Función auxiliar para determinar si un ingrediente es masa
function esMasa(nombre) {
  const masas = ['original', 'sarten', 'crunchy', 'masa madre'];
  return masas.includes(nombre);
}

// Event listeners para los botones de ingredientes
document.querySelectorAll("button[data-ingrediente]").forEach(button => {
  button.addEventListener("click", function() {
    const nombre = this.getAttribute("data-ingrediente");
    const tipo = this.getAttribute("data-tipo") || null;
    agregarIngrediente(nombre, tipo);
  });
});

// Función para mostrar modales
function mostrarPopup(mensaje, tipo = "success") {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  
  const modal = document.createElement("div");
  modal.className = "modal-content";
  modal.innerHTML = `
    <div class="modal-title">${tipo === "error" ? "¡Atención!" : "¡Éxito!"}</div>
    <p>${mensaje}</p>
    <button class="btn modal-btn" onclick="this.closest('.modal-overlay').remove()">
      Aceptar
    </button>
  `;
  
  if (tipo === "error") {
    modal.style.borderTopColor = "#dc3545";
  }
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// Botones de acción
document.getElementById("btn-marcar-salida")?.addEventListener("click", () => {
    if (ingredientesSeleccionados.length > 0) {
      // Guardar los ingredientes en sessionStorage para cocina
      sessionStorage.setItem('ingredientesParaCocina', JSON.stringify(ingredientesSeleccionados));
      
      // Guardar el número de pedido
      const numeroPedido = document.querySelector('.pedido-info strong').textContent;
      sessionStorage.setItem('numeroPedido', numeroPedido);
      
      mostrarPopup("¡Salida de ingredientes marcada para cocina!");
      
      // Limpiar solo la visualización actual, no los datos para cocina
      ingredientesSeleccionados = [];
      masaSeleccionada = null;
      renderizarLista();
    } else {
      mostrarPopup("No hay ingredientes para marcar salida", "error");
    }
  });

document.getElementById("btn-consultar-pedido")?.addEventListener("click", () => {
  mostrarPopup("Consultando detalles del pedido 078PZNTU54A...");
});

document.getElementById("btn-actualizar-stock")?.addEventListener("click", () => {
  mostrarPopup("Actualizando inventario de ingredientes...");
});

// Inicializar la lista al cargar la página
document.addEventListener("DOMContentLoaded", renderizarLista);