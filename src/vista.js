/**
 * VISTA · Notas del semestre                                            (PARTE 3 de la guía)
 *
 * SABE: dibujar el estado del Modelo en el DOM y avisar qué hizo el usuario (clics, formularios).
 * NO SABE: ninguna regla de negocio, ni cambiar el Modelo, ni guardar datos.
 *
 * Lee del Modelo (solo lectura) y se suscribe a sus cambios para redibujarse sola.
 * El HTML estático (formulario, tabla, resumen) ya está en index.html: aquí solo se rellena y se escucha.
 */

export class NotasVista {
  #modelo;
  #el;

  constructor(raiz, modelo) {
    this.#modelo = modelo;

    this.#el = {
      form: raiz.querySelector('#form'),
      nombre: raiz.querySelector('#nombre'),
      peso: raiz.querySelector('#peso'),
      nota: raiz.querySelector('#nota'),
      error: raiz.querySelector('#error'),
      tabla: raiz.querySelector('#tabla'),
      vacio: raiz.querySelector('#vacio'),
      acumulado: raiz.querySelector('#acumulado'),
      pesoCalificado: raiz.querySelector('#pesoCalificado'),
      pesoPendiente: raiz.querySelector('#pesoPendiente'),
      necesaria: raiz.querySelector('#necesaria'),
      estado: raiz.querySelector('#estado')
    };

    this.#modelo.suscribir(this.render.bind(this));
    this.render();
  }

  // ---------------------------------------------------------- 3B · Eventos que la Vista ofrece
  // El Controlador se registra aquí. La Vista no decide qué hacer: solo avisa "el usuario hizo esto".

  alAgregar(manejador) {
    this.#el.form.addEventListener('submit', (evento) => {
      evento.preventDefault();
      manejador(this.leerFormulario());
    });
  }

  // EJEMPLO RESUELTO (para que hagas alAgregar y alCalificar igual): un solo escuchador en la tabla
  // sirve para todas las filas (delegación de eventos); el id viaja en el atributo data-eliminar.
  // Funciona cuando termines 3A (this.#el.tabla) y 3D (los botones "Eliminar" con data-eliminar).
  alEliminar(manejador) {
    this.#el.tabla.addEventListener('click', (evento) => {
      const boton = evento.target.closest('button[data-eliminar]');
      if (boton) manejador(Number(boton.dataset.eliminar));
    });
  }

  alCalificar(manejador) {
    this.#el.tabla.addEventListener('change', (evento) => {
      const input = evento.target.closest('input[data-nota]');
      if (input) {
        const id = Number(input.dataset.nota);
        manejador(id, input.value);
      }
    });
  }

  // ---------------------------------------------------------- 3C · Órdenes que la Vista obedece

  leerFormulario() {
    return {
      nombre: this.#el.nombre.value,
      peso: this.#el.peso.value,
      nota: this.#el.nota.value
    };
  }

  limpiarFormulario() {
    this.#el.nombre.value = '';
    this.#el.peso.value = '';
    this.#el.nota.value = '';
  }

  mostrarError(mensaje) {
    this.#el.error.textContent = mensaje;
  }

  limpiarError() {
    this.#el.error.textContent = '';
  }

  // ---------------------------------------------------------- 3D · Dibujar

  /** Dibuja TODO a partir del Modelo. No decide nada: solo presenta. */
  render() {
    const evaluaciones = this.#modelo.evaluaciones;
    const resumen = this.#modelo.resumen();

    // 1. Renderizar la tabla de evaluaciones
    this.#el.tabla.innerHTML = '';

    if (evaluaciones.length === 0) {
      if (this.#el.vacio) this.#el.vacio.hidden = false;
    } else {
      if (this.#el.vacio) this.#el.vacio.hidden = true;

      for (const ev of evaluaciones) {
        const tr = document.createElement('tr');

        const tdNombre = document.createElement('td');
        tdNombre.textContent = ev.nombre;

        const tdPeso = document.createElement('td');
        tdPeso.textContent = `${ev.peso} %`;

        const tdNota = document.createElement('td');
        const inputNota = document.createElement('input');
        inputNota.type = 'number';
        inputNota.step = '0.1';
        inputNota.min = '0';
        inputNota.max = '5';
        inputNota.dataset.nota = ev.id;
        inputNota.value = ev.nota !== null ? ev.nota : '';
        tdNota.appendChild(inputNota);

        const tdAporte = document.createElement('td');
        if (ev.nota !== null) {
          tdAporte.textContent = ((ev.peso * ev.nota) / 100).toFixed(2);
        } else {
          tdAporte.textContent = '—';
        }

        const tdAcciones = document.createElement('td');
        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.dataset.eliminar = ev.id;
        tdAcciones.appendChild(btnEliminar);

        tr.appendChild(tdNombre);
        tr.appendChild(tdPeso);
        tr.appendChild(tdNota);
        tr.appendChild(tdAporte);
        tr.appendChild(tdAcciones);

        this.#el.tabla.appendChild(tr);
      }
    }

    // 2. Renderizar la tarjeta del resumen
    if (this.#el.acumulado) {
      this.#el.acumulado.textContent = resumen.acumulado.toFixed(2);
    }
    if (this.#el.pesoCalificado) {
      this.#el.pesoCalificado.textContent = `${resumen.pesoCalificado} %`;
    }
    if (this.#el.pesoPendiente) {
      this.#el.pesoPendiente.textContent = `${resumen.pesoPendiente} %`;
    }
    if (this.#el.necesaria) {
      this.#el.necesaria.textContent =
        resumen.notaNecesaria !== null ? resumen.notaNecesaria.toFixed(2) : '—';
    }

    if (this.#el.estado) {
      this.#el.estado.className = 'estado';

      if (resumen.estado === 'aprobado') {
        this.#el.estado.textContent = '¡Aprobado! Ya alcanzaste la nota mínima.';
        this.#el.estado.classList.add('ok');
      } else if (resumen.estado === 'en-camino') {
        this.#el.estado.textContent = 'En camino: aún puedes aprobar.';
        this.#el.estado.classList.add('en-camino');
      } else if (resumen.estado === 'en-riesgo') {
        this.#el.estado.textContent = 'En riesgo: necesitas una nota alta en lo que falta.';
        this.#el.estado.classList.add('riesgo');
      } else if (resumen.estado === 'imposible') {
        this.#el.estado.textContent = 'Reprobado: ya no alcanza el peso pendiente.';
        this.#el.estado.classList.add('imposible');
      }
    }
  }
}