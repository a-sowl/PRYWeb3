export default class Producto {
    constructor(id, nombre, cantidad, descripcion, precio, categoria, fechaRegistro, disponibilidad, tamanos, imagen) {
        this.id = id; // Número
        this.nombre = nombre; // String
        this.cantidad = cantidad; // Número
        this.descripcion = descripcion; // String
        this.precio = precio; // Número
        this.categoria = categoria; // String
        this.fechaRegistro = fechaRegistro; // String (YYYY-MM-DD)
        this.disponibilidad = disponibilidad; // String ('disponible' o 'noDisponible')
        this.tamanos = tamanos; // Array de strings
        this.imagen = imagen; // String (URL o base64)
    }
}