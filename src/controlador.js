/**
 * CONTROLADOR · Notas del semestre                                       (PARTE 4 de la guía)
 *
 * SABE: traducir lo que hace el usuario (eventos de la Vista) en órdenes para el Modelo,
 *       y qué mostrar cuando el Modelo rechaza una orden.
 * NO SABE: HTML ni DOM (eso es de la Vista), ni las reglas del negocio (eso es del Modelo).
 *
 * Es "delgado": cada método hace tres cosas como máximo (leer → ordenar → reaccionar).
 */

import { ErrorDeReglas } from './modelo.js';

export class NotasControlador {
  #modelo;
  #vista;

  constructor(modelo, vista) {
    this.#modelo = modelo;
    this.#vista = vista;

    this.#vista.alAgregar((datos) => this.#ejecutar(() => {
      this.#modelo.agregar(datos);
      this.#vista.limpiarFormulario();
    }));

    this.#vista.alEliminar((id) => this.#ejecutar(() => {
      this.#modelo.eliminar(id);
    }));

    this.#vista.alCalificar((id, textoNota) => this.#ejecutar(() => {
      this.#modelo.calificar(id, textoNota);
    }));
  }

  #ejecutar(accion) {
    try {
      this.#vista.limpiarError();
      accion();
    } catch (error) {
      if (error instanceof ErrorDeReglas) {
        this.#vista.mostrarError(error.message);
        this.#vista.render();
      } else {
        throw error;
      }
    }
  }
}