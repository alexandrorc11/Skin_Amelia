// Error esperado de la aplicación: lleva el código HTTP que debe responderse.
class AppError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}
module.exports = AppError;
